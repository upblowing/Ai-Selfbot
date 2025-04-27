# Ai Selfbot

simple selfbot that uses Ollama to chat back when pinged / replied to.

## setup

Install dependencies:
```bash
npm install discord.js-selfbot-v13 node-fetch
```

## usage

1. replace "ur token" with ur own token
2. run Ollama locally on port 11434 ( `ollama serve` )
3. start the bot: `node index.js`

## commands

- `!custom-prompt <prompt>` - set custom prompt for a user

## Requirements

- Node.js
- Ollama
