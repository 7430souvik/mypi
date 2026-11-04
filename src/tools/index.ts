import type { Tool } from "../types.ts";

import { bashTool } from "./bash.js";
import { readTool } from "./read.js";


export const tools: Tool[] = [bashTool, readTool];


