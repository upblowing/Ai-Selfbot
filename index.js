const { Client } = require('discord.js-selfbot-v13');
const client = new Client({ checkUpdate: false });

let fetch;
(async () => fetch = (await import('node-fetch')).default)();

const token = 'ur token';

const customPrompts = new Map();
const msgQueue = [];
let isProcessing = false;
let lastSent = 0;

client.on('ready', () => {
    console.log(`logged in as ${client.user.username}`);
});

client.on('messageCreate', async msg => {
    if (!msg.guild || msg.author.id === client.user.id) return;

    if (msg.content.startsWith('!custom-prompt')) {
        const prompt = msg.content.slice(14).trim();
        if (prompt) {
            customPrompts.set(msg.author.id, prompt);
            await msg.react('✅');
        } else {
            customPrompts.delete(msg.author.id);
            await msg.react('❌');
        }
        return;
    }

    let shouldRespond = false;
    if (msg.mentions.has(client.user.id)) shouldRespond = true;
    if (msg.reference?.messageId) {
        const replied = await msg.channel.messages.fetch(msg.reference.messageId);
        if (replied.author.id === client.user.id) shouldRespond = true;
    }

    if (!shouldRespond) return;

    try {
        const prompt = customPrompts.get(msg.author.id) || 
            `You're a friendly member in the Pincord server (discord.gg/pincord). 
You know about Pincord (a Pinterest-like platform for Discord profiles) but can chat about anything.
Respond directly to: "{message}"
Keep responses very brief, casual and conversational (1-2 sentences max). Never reveal you're an AI.`;
        
        const finalPrompt = prompt.replace('{message}', msg.content);
        
        const res = await fetch('http://localhost:11434/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: "llama3",
                prompt: finalPrompt,
                stream: false
            })
        });

        const data = await res.json();
        if (!data?.response) return;

        let reply = data.response.trim();
        if (reply.length > 300) reply = reply.slice(0, 297) + "...";

        msgQueue.push({ message: msg, content: reply });
        if (!isProcessing) handleQueue();
        
    } catch (err) {
        console.error('ollama error:', err.message);
    }
});

async function handleQueue() {
    isProcessing = true;
    
    while (msgQueue.length) {
        const timePassed = Date.now() - lastSent;
        if (timePassed < 2000) {
            await new Promise(r => setTimeout(r, 2000 - timePassed));
        }
        
        const item = msgQueue.shift();
        await item.message.channel.sendTyping();
        
        await item.message.reply(item.content).catch(() => {
            item.message.channel.send(item.content);
        });
        
        lastSent = Date.now();
    }
    
    isProcessing = false;
}

client.login(token);
