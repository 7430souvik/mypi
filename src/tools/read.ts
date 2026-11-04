import type { Tool } from "../types.js";
import { readFile } from "node:fs/promises";

export const readTool: Tool = {
    name: "read",
    description: "Read a file from the local filesystem",

    parameters: {
        type: "object",
        properties: {
            path: {
                type: "string",
                description: "Path to the file, relative to the current folder"
            }
        },
        required: ["path"]
    },

    async execute(args) {
        try {
            const path = args.path as string;

            const content = await readFile(path, "utf-8");

            return [
                {
                    type: "text",
                    text: content
                }
            ];

        } catch (error) {
            return [
                {
                    type: "text",
                    text: `Error reading file: ${
                        error instanceof Error ? error.message : "Unknown error"
                    }`
                }
            ];
        }
    }
};