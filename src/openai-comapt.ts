import OpenAI from "openai";

import type {
    Provider,
    StopReason,
    Usage,
    ContentBlock,
    Message,
    ToolSpec,
    AssistantMessage
} from "./types.js";

export function createOpenAICompat(
    name: string,
    baseURL: string,
    apiKey: string,
    defaultModel: string
): Provider {
    const client = new OpenAI({
        baseURL,
        apiKey
    });

    return {
        name,
        defaultModel,

        async *stream({ messages, model, system, tools }) {

            // Convert internal messages into OpenAI-compatible messages.
            const chat: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];

            for (const m of messages) {
                if (m.role === "user") {
                    chat.push({
                        role: "user",
                        content: m.content
                    });
                }

                if (m.role === "assistant") {
                    const text = m.content
                        .filter(block => block.type === "text")
                        .map(block => block.text)
                        .join("");

                    const toolCalls = m.content.filter(
                        block => block.type === "toolCall"
                    );

                    chat.push({
                        role: "assistant",
                        content: text || null,
                        ...(toolCalls.length > 0 && {
                            tool_calls: toolCalls.map(block => {
                                if (block.type !== "toolCall") {
                                    throw new Error("Invalid tool call");
                                }

                                return {
                                    id: block.id,
                                    type: "function" as const,
                                    function: {
                                        name: block.name,
                                        arguments: JSON.stringify(block.arguments)
                                    }
                                };
                            })
                        })
                    });
                }

                if (m.role === "toolResult") {
                    chat.push({
                        role: "tool",
                        tool_call_id: m.toolCallId,
                        content: m.content
                            .filter(block => block.type === "text")
                            .map(block => block.text)
                            .join("\n")
                    });
                }
            }

            // Convert internal tool specifications into API format.
            const apiTools: OpenAI.Chat.Completions.ChatCompletionTool[] | undefined =
                tools?.map(tool => ({
                    type: "function",
                    function: {
                        name: tool.name,
                        description: tool.description,
                        parameters: tool.parameters
                    }
                }));

            const stream = await client.chat.completions.create({
                model,
                stream: true,
                stream_options: {
                    include_usage: true
                },
                messages: system
                    ? [
                          { role: "system", content: system },
                          ...chat
                      ]
                    : chat,
                ...(apiTools?.length ? {
                    tools: apiTools,
                    tool_choice: "auto" as const
                } : {})
            });

            let text = "";

            // Store streamed tool calls by their index.
            const toolCalls = new Map<
                number,
                {
                    id: string;
                    name: string;
                    arguments: string;
                }
            >();

            let usage: Usage = {
                input: 0,
                output: 0
            };

            let stopReason: StopReason = "stop";

            for await (const chunk of stream) {
                const choice = chunk.choices[0];
                const delta = choice?.delta;

                // Handle normal text streaming.
                if (delta?.content) {
                    text += delta.content;

                    yield {
                        type: "text_delta",
                        delta: delta.content
                    };
                }

                // Handle streamed tool calls.
                if (delta?.tool_calls) {
                    for (const toolCall of delta.tool_calls) {
                        const index = toolCall.index;

                        const existing = toolCalls.get(index) ?? {
                            id: "",
                            name: "",
                            arguments: ""
                        };

                        if (toolCall.id) {
                            existing.id = toolCall.id;
                        }

                        if (toolCall.function?.name) {
                            existing.name += toolCall.function.name;
                        }

                        if (toolCall.function?.arguments) {
                            existing.arguments += toolCall.function.arguments;
                        }

                        toolCalls.set(index, existing);
                    }
                }

                // Detect why generation stopped.
                if (choice?.finish_reason === "length") {
                    stopReason = "length";
                }

                if (choice?.finish_reason === "tool_calls") {
                    stopReason = "toolUse";
                }

                if (chunk.usage) {
                    usage = {
                        input: chunk.usage.prompt_tokens,
                        output: chunk.usage.completion_tokens
                    };
                }
            }

            // Convert accumulated tool calls into internal content blocks.
            const content: ContentBlock[] = [];

            if (text) {
                content.push({
                    type: "text",
                    text
                });
            }

            for (const toolCall of toolCalls.values()) {
                let parsedArguments: Record<string, unknown>;

                try {
                    const parsed: unknown = JSON.parse(toolCall.arguments);

                    if (
                        typeof parsed !== "object" ||
                        parsed === null ||
                        Array.isArray(parsed)
                    ) {
                        throw new Error("Tool arguments must be a JSON object");
                    }

                    parsedArguments = parsed as Record<string, unknown>;
                } catch {
                    throw new Error(
                        `Invalid arguments for tool ${toolCall.name}: ${toolCall.arguments}`
                    );
                }

                content.push({
                    type: "toolCall",
                    id: toolCall.id,
                    name: toolCall.name,
                    arguments: parsedArguments
                });
            }

            if (toolCalls.size > 0) {
                stopReason = "toolUse";
            }

            const message: AssistantMessage = {
                role: "assistant",
                content,
                usage,
                stopReason
            };

            yield {
                type: "done",
                message
            };
        }
    };
}