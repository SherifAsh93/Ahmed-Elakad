import fs from "fs";
import path from "path";

export interface Payment {
  id: string;
  amount: number;
  date: string;
  note: string;
}

export interface Dress {
  id: string;
  label: string;
  images: string[];
  createdAt: string;
}

export interface VoiceNote {
  id: string;
  url: string;
  from: "atelier" | "admin";
  createdAt: string;
}

export interface Client {
  id: string; // normalized phone digits — the primary key
  name: string;
  email: string;
  phone: string;
  notes: string;
  totalPrice: number;
  payments: Payment[];
  dresses: Dress[];
  voiceNotes: VoiceNote[];
  appointmentDate: string;
  nextAppointmentDate: string;
  fittingDate: string;
  eventDate: string;
  dressType: "wedding" | "evening" | "";
  branch: "cairo" | "damietta" | "";
  clientImages: string[];
  status: "active" | "completed" | "pending";
  createdAt: string;
  sourceMessageId?: string;
}

const CLIENTS_FILE = "/home/sherif/data/ahmed-elakad/clients.json";
const VOICES_DIR = "/home/sherif/data/ahmed-elakad/voices";
const VOICES_BASE = "https://ahmedelakad.com/voices";

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

// Reads every record — never drops entries, used internally for all writes
function readAll(): Client[] {
  try {
    if (fs.existsSync(CLIENTS_FILE)) {
      const raw = JSON.parse(fs.readFileSync(CLIENTS_FILE, "utf-8")) as Client[];
      return raw.map((c) => {
        const payments: Payment[] = c.payments ?? [];
        const dresses: Dress[] = c.dresses ?? [];
        const voiceNotes: VoiceNote[] = c.voiceNotes ?? [];
        const totalPrice: number = c.totalPrice ?? 0;
        // If phone was lost or is too short, reconstruct it from id so the record stays valid
        const rawPhone = c.phone ?? "";
        const phone = rawPhone && normalizePhone(rawPhone).length >= 7 ? rawPhone : (c.id ?? "");
        const client: Client = {
          ...c,
          name: c.name ?? "",
          email: c.email ?? "",
          phone,
          notes: c.notes ?? "",
          totalPrice,
          appointmentDate: c.appointmentDate ?? "",
          nextAppointmentDate: c.nextAppointmentDate ?? "",
          fittingDate: c.fittingDate ?? "",
          eventDate: c.eventDate ?? "",
          dressType: c.dressType ?? "",
          branch: c.branch ?? "",
          clientImages: c.clientImages ?? [],
          id: phone ? normalizePhone(phone) : (c.id ?? ""),
          dresses,
          voiceNotes,
          payments,
          status: "pending",
        };
        client.status = autoStatus(client);
        return client;
      });
    }
  } catch {}
  return [];
}

// Public read — only returns fully-valid clients (has phone ≥7 digits)
function readLocal(): Client[] {
  return readAll().filter((c) => c.phone && normalizePhone(c.phone).length >= 7);
}

function writeLocal(clients: Client[]): void {
  fs.writeFileSync(CLIENTS_FILE, JSON.stringify(clients, null, 2), "utf-8");
}

export function paidAmount(client: Client): number {
  return client.payments.reduce((sum, p) => sum + p.amount, 0);
}

export function remainingAmount(client: Client): number {
  return Math.max(0, client.totalPrice - paidAmount(client));
}

function autoStatus(client: Client): Client["status"] {
  const paid = client.payments.reduce((s, p) => s + p.amount, 0);
  if (client.totalPrice > 0 && paid >= client.totalPrice) return "completed";
  if (paid > 0) return "active";
  return "pending";
}

export async function getClients(): Promise<Client[]> {
  return readLocal();
}

// voiceNotes omitted — always initialized to [] on create
export async function addClient(data: Omit<Client, "id" | "createdAt" | "voiceNotes">): Promise<Client> {
  if (!data.phone) throw new Error("Mobile number is required");
  const id = normalizePhone(data.phone);
  if (id.length < 7) throw new Error("Invalid mobile number");

  const all = readAll();
  if (all.some((c) => c.id === id)) throw new Error("A client with this mobile number already exists");

  const client: Client = {
    ...data,
    id,
    voiceNotes: [],
    createdAt: new Date().toISOString(),
  };
  writeLocal([client, ...all]);
  return client;
}

export async function updateClient(id: string, data: Partial<Omit<Client, "id" | "createdAt">>): Promise<Client | null> {
  const all = readAll();

  if (data.phone) {
    const newId = normalizePhone(data.phone);
    if (newId !== id && all.some((c) => c.id === newId)) {
      throw new Error("Another client already has this mobile number");
    }
  }

  // Strip undefined values — spreading undefined would silently erase existing fields
  const cleanData = Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== undefined)
  ) as Partial<Omit<Client, "id" | "createdAt">>;

  let updated: Client | null = null;
  const next = all.map((c) => {
    if (c.id === id) {
      const newId = cleanData.phone ? normalizePhone(cleanData.phone) : c.id;
      const merged: Client = { ...c, ...cleanData, id: newId };
      if (cleanData.totalPrice !== undefined && cleanData.status === undefined) {
        merged.status = autoStatus(merged);
      }
      updated = merged;
      return updated;
    }
    return c;
  });
  if (updated) writeLocal(next);
  return updated;
}

export async function deleteClient(id: string): Promise<void> {
  writeLocal(readAll().filter((c) => c.id !== id));
}

export async function addPayment(clientId: string, payment: Omit<Payment, "id">): Promise<Client | null> {
  const all = readAll();
  let updated: Client | null = null;
  const next = all.map((c) => {
    if (c.id === clientId) {
      const newPayment: Payment = { ...payment, id: Math.random().toString(36).substring(2, 11) };
      const newPayments = [...c.payments, newPayment];
      updated = { ...c, payments: newPayments, status: autoStatus({ ...c, payments: newPayments }) };
      return updated;
    }
    return c;
  });
  if (updated) writeLocal(next);
  return updated;
}

export async function deletePayment(clientId: string, paymentId: string): Promise<Client | null> {
  const all = readAll();
  let updated: Client | null = null;
  const next = all.map((c) => {
    if (c.id === clientId) {
      const newPayments = c.payments.filter((p) => p.id !== paymentId);
      updated = { ...c, payments: newPayments, status: autoStatus({ ...c, payments: newPayments }) };
      return updated;
    }
    return c;
  });
  if (updated) writeLocal(next);
  return updated;
}

export async function addDress(clientId: string, label: string): Promise<Client | null> {
  const all = readAll();
  let updated: Client | null = null;
  const next = all.map((c) => {
    if (c.id === clientId) {
      const newDress: Dress = {
        id: Math.random().toString(36).substring(2, 11),
        label,
        images: [],
        createdAt: new Date().toISOString(),
      };
      updated = { ...c, dresses: [...c.dresses, newDress] };
      return updated;
    }
    return c;
  });
  if (updated) writeLocal(next);
  return updated;
}

export async function deleteDress(clientId: string, dressId: string): Promise<Client | null> {
  const all = readAll();
  let updated: Client | null = null;
  const next = all.map((c) => {
    if (c.id === clientId) {
      updated = { ...c, dresses: c.dresses.filter((d) => d.id !== dressId) };
      return updated;
    }
    return c;
  });
  if (updated) writeLocal(next);
  return updated;
}

export async function addDressImages(clientId: string, dressId: string, images: string[]): Promise<Client | null> {
  const all = readAll();
  let updated: Client | null = null;
  const next = all.map((c) => {
    if (c.id === clientId) {
      updated = {
        ...c,
        dresses: c.dresses.map((d) =>
          d.id === dressId ? { ...d, images: [...d.images, ...images] } : d
        ),
      };
      return updated;
    }
    return c;
  });
  if (updated) writeLocal(next);
  return updated;
}

export async function removeDressImage(clientId: string, dressId: string, imageUrl: string): Promise<Client | null> {
  const all = readAll();
  let updated: Client | null = null;
  const next = all.map((c) => {
    if (c.id === clientId) {
      updated = {
        ...c,
        dresses: c.dresses.map((d) =>
          d.id === dressId ? { ...d, images: d.images.filter((img) => img !== imageUrl) } : d
        ),
      };
      return updated;
    }
    return c;
  });
  if (updated) writeLocal(next);
  return updated;
}

export async function updateDressLabel(clientId: string, dressId: string, label: string): Promise<Client | null> {
  const all = readAll();
  let updated: Client | null = null;
  const next = all.map((c) => {
    if (c.id === clientId) {
      updated = {
        ...c,
        dresses: c.dresses.map((d) =>
          d.id === dressId ? { ...d, label } : d
        ),
      };
      return updated;
    }
    return c;
  });
  if (updated) writeLocal(next);
  return updated;
}

export async function addVoiceNote(clientId: string, data: Omit<VoiceNote, "id" | "createdAt">): Promise<Client | null> {
  const all = readAll();
  let updated: Client | null = null;
  const next = all.map((c) => {
    if (c.id === clientId) {
      const newNote: VoiceNote = {
        ...data,
        id: Math.random().toString(36).substring(2, 11),
        createdAt: new Date().toISOString(),
      };
      updated = { ...c, voiceNotes: [...c.voiceNotes, newNote] };
      return updated;
    }
    return c;
  });
  if (updated) writeLocal(next);
  return updated;
}

export async function deleteVoiceNote(clientId: string, voiceNoteId: string): Promise<Client | null> {
  const all = readAll();
  let updated: Client | null = null;
  let deletedUrl = "";

  const next = all.map((c) => {
    if (c.id === clientId) {
      const note = c.voiceNotes.find((n) => n.id === voiceNoteId);
      if (note) deletedUrl = note.url;
      updated = { ...c, voiceNotes: c.voiceNotes.filter((n) => n.id !== voiceNoteId) };
      return updated;
    }
    return c;
  });

  if (updated) {
    writeLocal(next);
    if (deletedUrl.startsWith(VOICES_BASE)) {
      try {
        const filename = deletedUrl.replace(`${VOICES_BASE}/`, "");
        const filepath = path.join(VOICES_DIR, filename);
        if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
      } catch {}
    }
  }
  return updated;
}
