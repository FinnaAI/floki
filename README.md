<div align="center">
  <img src="public/fehu-colored.png" alt="Floki Logo" width="200"/>
  <h1>Floki</h1>
  <p><strong>The AI-First Development Environment</strong></p>
  
  <p>
    <a href="#introduction">Introduction</a> •
    <a href="#key-features">Key Features</a> •
    <a href="#installation">Installation</a> •
    <a href="#development">Development</a> •
    <a href="#roadmap">Roadmap</a> •
    <a href="#license">License</a>
  </p>
</div>

## Introduction

Floki is an AI-native development environment designed for the next evolution of coding. Just as development progressed from punch cards to terminals to text editors to IDEs, Floki represents the next step: a platform built from the ground up for seamless AI-human collaboration.

Traditional IDEs weren't designed with AI integration in mind. Floki creates a new paradigm for working with multiple AI coding agents in parallel, letting you build better software, faster with AI-powered assistance.

## Key Features

- **AI-First Design**: Purpose-built for working with AI coding agents, not just an IDE with AI features added on
- **Multi-Agent Support**: Work with any AI model including OpenAI Codex, Claude Code, and more
- **Model Freedom**: Choose any AI provider or model that fits your project needs
- **Crafted Prompts**: Built-in prompts optimized for planning, architecture, and code execution
- **PRD Generator**: Create detailed product requirement documents with AI assistance
- **Task Management**: Manage your coding tasks and delegate to AI agents efficiently

![](/public/floki-dev1.png)

## Installation

```bash
# Install dependencies
pnpm install

# Run the web application
pnpm dev

# For desktop app development
pnpm electron:dev
```

## Development

### Web Application

```bash
# Start development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

### Desktop Application

```bash
# Develop desktop app
pnpm electron:dev

# Build desktop app
pnpm rebuild node-pty
pnpm electron:build
```

### Other Commands

```bash
# Type checking
pnpm typecheck

# Linting
pnpm check

# Database tools
pnpm db:generate    # Generate Prisma migrations
pnpm db:push        # Push schema to database
pnpm db:studio      # Open Prisma Studio
```

## Philosophy

Floki was created with the belief that the way we write code is fundamentally changing with the rise of AI. Instead of simply adding AI features to existing development environments, we need an entirely new approach.

Our core principles:

1. **AI as a First-Class Citizen**: AI agents are equal partners in the development process
2. **Multiplicity**: Run numerous agents simultaneously, each with different strengths
3. **Human-Centered**: Enhanced productivity without removing human creativity and control
4. **Open Ecosystem**: Support for any model or agent, avoiding vendor lock-in

## Roadmap

- ✅ Core AI integration
- ✅ Multi-model support
- ✅ Prompt engineering for development tasks
- 🔄 Run 10+ agents in parallel
- 🔄 Agent collaboration features
- 🔄 Enhanced testing and debugging with AI
- 🔄 Community-driven prompt library

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the [AGPL-3.0 License](LICENSE).

## Support

If you enjoy using Floki, please consider giving it a star on GitHub. It helps us reach more developers.

---

<div align="center">
  <sub>Built with ❤️ by <a href="https://finna.ai">Finna AI</a></sub>
</div>
