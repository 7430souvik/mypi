import { config } from "dotenv";
import { fileURLToPath } from "url";
import { parseArgs } from "node:util";

import type {
    AssistantMessage,
    Message,
    Tool
} from "./types.js";

import { getProvider } from "./index.js";
import { readTool } from "./tools/read.js";

config({
    path: fileURLToPath(new URL("../.env", import.meta.url)),
    quiet: true
});

const tools: Tool[] = [readTool];

const toolMap = new Map(
    tools.map(tool => [tool.name, tool])
);

const toolSpecs = tools.map(
    ({ name, description, parameters }) => ({
        name,
        description,
        parameters
    })
);

const { values } = parseArgs({
    options: {
        prompt: {
            type: "string",
            short: "p"
        },
        model: {
            type: "string"
        }
    }
});

if (!values.prompt) {
    console.log("No prompt provided.");
    process.exit(1);
}

const provider = getProvider("groq");
const model = values.model ?? provider.defaultModel;

const messages: Message[] = [
    {
        role: "user",
        content: values.prompt
    }
];

async function callModel(): Promise<AssistantMessage> {
    for await (const event of provider.stream({
        messages,
        model,
        tools: toolSpecs
    })) {
        if (event.type === "text_delta") {
            process.stdout.write(event.delta);
        }

        if (event.type === "done") {
            console.log(
                `\n\n${provider.name} finished: ${event.message.stopReason}`
            );

            return event.message;
        }
    }

    throw new Error("Stream ended without a done event");
}
async function runAgent() {

    let iterations = 0;
    const MAX_ITERATIONS = 10;

    while (iterations++ < MAX_ITERATIONS) {

        const assistantMessage = await callModel();

        messages.push(assistantMessage);

        // Model has finished responding
        if (assistantMessage.stopReason !== "toolUse") {
            break;
        }

        // Execute requested tools
        for (const block of assistantMessage.content) {

            if (block.type !== "toolCall") continue;

            console.log(
                `\n-> ${block.name} (${JSON.stringify(block.arguments)})`
            );

            const tool = toolMap.get(block.name);

            if (!tool) {
                messages.push({
                    role: "toolResult",
                    toolCallId: block.id,
                    toolName: block.name,
                    content: [{
                        type: "text",
                        text: `Unknown tool: ${block.name}`
                    }],
                    isError: true
                });

                continue;
            }

            try {
                const result = await tool.execute(block.arguments);

                messages.push({
                    role: "toolResult",
                    toolCallId: block.id,
                    toolName: block.name,
                    content: result,
                    isError: false
                });

            } catch (error) {
                messages.push({
                    role: "toolResult",
                    toolCallId: block.id,
                    toolName: block.name,
                    content: [{
                        type: "text",
                        text: error instanceof Error
                            ? error.message
                            : "Tool execution failed"
                    }],
                    isError: true
                });
            }
        }
    }

    if (iterations > MAX_ITERATIONS) {
        console.log("\nMaximum tool iterations reached.");
    }
}

await runAgent();