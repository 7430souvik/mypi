# mypi ⚡

**A lightweight, local AI coding agent built with TypeScript, Node.js, and Groq.**

mypi is a terminal-based AI coding assistant that can interact with your local project through tools. It uses an agent loop, supports multiple LLM providers, and executes tool calls to help with development tasks.

The goal is to build a simple, extensible coding agent that can understand project files and perform development operations directly from the terminal.

## ✨ Features

- **AI-powered coding assistant** – Interact with your codebase using natural language.
- **Groq integration** – Run models through the Groq API.
- **Multiple provider architecture** – Designed to support Groq and Anthropic.
- **Tool calling** – The model can request local tools to perform tasks.
- **File reading** – Read files from your project.
- **Bash execution** – Execute terminal commands through the agent.
- **Streaming responses** – Receive model responses incrementally.
- **Agent loop** – Automatically handles model responses and tool execution.
- **Extensible architecture** – Add new tools and providers independently.

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| TypeScript | Main programming language |
| Node.js | Runtime |
| Groq API | LLM inference |
| OpenAI SDK | OpenAI-compatible API integration |
| Anthropic SDK | Anthropic provider integration |
| tsx | TypeScript development runtime |
| dotenv | Environment variable management |

## 📁 Project Structure

```text
mypi/
├── agent/
│   └── loop.ts
├── bin/
│   └── mypi.js
├── src/
│   ├── providers/
│   │   ├── index.ts
│   │   └── anthropic.ts
│   ├── tools/
│   │   ├── index.ts
│   │   ├── read.ts
│   │   └── bash.ts
│   ├── main.ts
│   ├── types.ts
│   └── openai-compat.ts
├── .env
├── .gitignore
├── package.json
└── tsconfig.json
```

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/7430souvik/mypi.git
cd mypi
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root:

```env
GROQ_API_KEY=your_groq_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
```

Get your Groq API key from [Groq Console](https://console.groq.com/keys).

Never commit your `.env` file or expose API keys publicly.

### 4. Run in development mode

```bash
npm run dev -- -p "Hello, mypi!"
```

### 5. Build the project

```bash
npm run build
```

### 6. Run the CLI

```bash
npm start -- -p "Explain this project"
```

## 💻 Usage

Ask mypi questions or give it coding tasks:

```bash
mypi -p "Which model are you using?"
```

Inspect project files:

```bash
mypi -p "Read package.json and explain the dependencies"
```

Ask it to inspect your code:

```bash
mypi -p "Find the entry point of this application"
```

Request development assistance:

```bash
mypi -p "Create a client-side todo application using HTML, CSS and JavaScript"
```

Select a provider:

```bash
mypi -p "Hello" --provider groq
```

```bash
mypi -p "Hello" --provider anthropic
```

## 🧠 Architecture

mypi follows a tool-based agent architecture.

```text
             User Prompt
                  |
                  v
             CLI (main.ts)
                  |
                  v
             Agent Loop
                  |
                  v
             LLM Provider
             (Groq / Anthropic)
                  |
                  v
           Tool Call Response
                  |
                  v
             Tool Registry
              /       \
             v         v
           Read       Bash
             \         /
              v       v
             Tool Results
                  |
                  v
              Agent Loop
                  |
                  v
             Final Response
```

### Core Components

**1. Agent Loop**

Manages conversations, streams model responses, identifies tool calls, executes tools, and sends tool results back to the model.

**2. Provider Layer**

Provides a common interface for different LLM providers, allowing the agent to switch models without changing the agent loop.

**3. Tool System**

Tools expose capabilities to the model through structured descriptions and parameter schemas.

Each tool implements a common interface:

```ts
export type Tool = ToolSpec & {
  execute(
    args: Record<string, unknown>
  ): Promise<string>;
};
```

**4. Streaming**

The provider streams text responses and returns completed assistant messages containing tool calls when requested.

## 🔧 Available Tools

| Tool | Description |
|---|---|
| `read` | Reads local project files |
| `bash` | Executes shell commands |

More filesystem and developer tools are planned.

## 🗺️ Roadmap

- [x] CLI interface
- [x] Groq provider integration
- [x] Provider abstraction
- [x] Streaming responses
- [x] Agent execution loop
- [x] Tool registration system
- [x] Read tool
- [x] Bash tool
- [ ] Write file tool
- [ ] Edit file tool
- [ ] Directory listing tool
- [ ] Grep and file search tools
- [ ] Git integration
- [ ] Improved tool-call error recovery
- [ ] Conversation history management
- [ ] Project-aware context management
- [ ] Filesystem permission and safety controls

## 🔐 Security

- Store API keys in environment variables.
- Keep `.env` excluded from Git.
- Restrict filesystem operations to the intended project directory.
- Add safeguards and approval mechanisms for destructive operations.
- Treat shell execution as a privileged operation.

## 🤝 Contributing

Contributions, ideas, and suggestions are welcome!

1. Fork the repository.
2. Create a feature branch.
3. Implement your changes.
4. Test your implementation.
5. Submit a pull request.

## 👨‍💻 Author

**Souvik Chatterjee**

GitHub: [@7430souvik](https://github.com/7430souvik)

---

⭐ If you find this project interesting, consider giving it a star!

*Built as an exploration of AI agents, LLM tool calling, and local developer automation.*
