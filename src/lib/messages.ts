import { messages as messagesTable } from "@/lib/db/schema";
import { getCollection, saveCollection } from "@/lib/db/store";

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  createdAt: string;
  read?: boolean;
}

async function readLocal(): Promise<ContactMessage[]> {
  try {
    return await getCollection<ContactMessage>(messagesTable);
  } catch {
    return [];
  }
}

async function writeLocal(messages: ContactMessage[]): Promise<void> {
  await saveCollection(messagesTable, messages);
}

export async function getMessages(): Promise<ContactMessage[]> {
  return readLocal();
}

export async function addMessage(msg: Omit<ContactMessage, "id" | "createdAt">): Promise<ContactMessage> {
  const messages = await readLocal();
  const newMsg: ContactMessage = {
    ...msg,
    id: Math.random().toString(36).substring(2, 11),
    createdAt: new Date().toISOString(),
    read: false,
  };
  await writeLocal([newMsg, ...messages]);
  return newMsg;
}

export async function deleteMessage(id: string): Promise<void> {
  await writeLocal((await readLocal()).filter((m) => m.id !== id));
}

export async function markMessageRead(id: string, read: boolean): Promise<void> {
  await writeLocal((await readLocal()).map((m) => (m.id === id ? { ...m, read } : m)));
}
