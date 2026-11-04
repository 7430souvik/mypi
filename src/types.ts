export type Usage = {
    input: number;
    output: number;
};

export type StopReason = "stop" | "length" | "toolUse";

export type TextBlock = {
    type: "text";
    text: string;
};

export type ToolCallBlock = {
    type: "toolCall";
    id: string;
    name: string;
    arguments: Record<string, unknown>;
};

export type ContentBlock = TextBlock | ToolCallBlock;

export type UserMessage = {
    role: "user";
    content: string;
};

export type AssistantMessage = {
    role: "assistant";
    content: ContentBlock[];
    usage: Usage;
    stopReason: StopReason;
};

export type ToolResultMessage = {
    role: "toolResult";
    toolCallId: string;
    toolName: string;
    content: ContentBlock[];
    isError: boolean;
};

export type Message = UserMessage | AssistantMessage | ToolResultMessage;