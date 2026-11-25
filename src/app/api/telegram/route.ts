// src/app/api/telegram/route.ts

import { NextResponse } from 'next/server';
import { Telegraf } from 'telegraf';

// Load environment variables if not available in runtime context
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// Initialize Telegraf bot. We must initialize outside the handler for webhook setup.
const bot = new Telegraf(BOT_TOKEN!);

// --- Message Handling Logic ---

bot.start((ctx) => {
  ctx.reply("👋 Welcome to Ahmed_Elakad Bot! I am now fully set up.");
});

bot.command('hello', (ctx) => {
  ctx.reply("Hello there! How can I assist you today?");
});

bot.on('message', async (ctx) => {
  const message = ctx.message;
  // Type guard check: ensure message exists and has a text property
  if (message?.text) {
    const text = message.text;
    if (!text.startsWith('/')) {
      await ctx.reply(`Echo: ${text}`);
    }
  }
});


// --- Webhook Endpoint Handler ---

export async function POST(request: Request) {
  try {
    const update = await request.json();
    
    // Forward the update to the bot instance to process it via the library
    await bot.handleUpdate(update);

    return NextResponse.json({ status: "success" }, { status: 200 });

  } catch (error) {
    console.error("Error processing Telegram webhook:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}