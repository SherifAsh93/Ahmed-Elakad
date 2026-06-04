import fs from "fs";
import { atomicWriteJSON } from "@/lib/atomicWrite";

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  createdAt: string;
  read?: boolean;
}

const MESSAGES_FILE = "/home/sherif/data/ahmed-elakad/messages.json";

function readLocal(): ContactMessage[] {
  try {
    if (fs.existsSync(MESSAGES_FILE)) {
      return JSON.parse(fs.readFileSync(MESSAGES_FILE, "utf-8"));
    }
  } catch {}
  return [];
}

function writeLocal(messages: ContactMessage[]): void {
  atomicWriteJSON(MESSAGES_FILE, messages);
}

export async function getMessages(): Promise<ContactMessage[]> {
  return readLocal();
}

export async function addMessage(msg: Omit<ContactMessage, "id" | "createdAt">): Promise<ContactMessage> {
  const messages = readLocal();
  const newMsg: ContactMessage = {
    ...msg,
    id: Math.random().toString(36).substring(2, 11),
    createdAt: new Date().toISOString(),
    read: false,
  };
  writeLocal([newMsg, ...messages]);
  return newMsg;
}

export async function deleteMessage(id: string): Promise<void> {
  writeLocal(readLocal().filter((m) => m.id !== id));
}

export async function markMessageRead(id: string, read: boolean): Promise<void> {
  writeLocal(readLocal().map((m) => (m.id === id ? { ...m, read } : m)));
}
