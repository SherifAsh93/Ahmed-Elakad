import fs from "fs";

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

export interface Client {
  id: string; // normalized phone digits — the primary key
  name: string;
  email: string;
  phone: string;
  notes: string;
  totalPrice: number;
  payments: Payment[];
  dresses: Dress[];
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

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

function readLocal(): Client[] {
  try {
    if (fs.existsSync(CLIENTS_FILE)) {
      const data = JSON.parse(fs.readFileSync(CLIENTS_FILE, "utf-8"));
      return (data as Client[])
        .filter((c) => c.phone && normalizePhone(c.phone).length >= 7)
        .map((c) => {
          const payments: Payment[] = c.payments ?? [];
          const dresses: Dress[] = c.dresses ?? [];
          const totalPrice: number = c.totalPrice ?? 0;
          const client: Client = {
            ...c,
            name: c.name ?? "",
            email: c.email ?? "",
            notes: c.notes ?? "",
            totalPrice,
            appointmentDate: c.appointmentDate ?? "",
            nextAppointmentDate: c.nextAppointmentDate ?? "",
            fittingDate: c.fittingDate ?? "",
            eventDate: c.eventDate ?? "",
            dressType: c.dressType ?? "",
            branch: c.branch ?? "",
            clientImages: c.clientImages ?? [],
            id: normalizePhone(c.phone),
            dresses,
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

export async function addClient(data: Omit<Client, "id" | "createdAt">): Promise<Client> {
  if (!data.phone) throw new Error("Mobile number is required");
  const id = normalizePhone(data.phone);
  if (id.length < 7) throw new Error("Invalid mobile number");

  const clients = readLocal();
  if (clients.some((c) => c.id === id)) throw new Error("A client with this mobile number already exists");

  const client: Client = {
    ...data,
    id,
    createdAt: new Date().toISOString(),
  };
  writeLocal([client, ...clients]);
  return client;
}

export async function updateClient(id: string, data: Partial<Omit<Client, "id" | "createdAt">>): Promise<Client | null> {
  const clients = readLocal();

  if (data.phone) {
    const newId = normalizePhone(data.phone);
    if (newId !== id && clients.some((c) => c.id === newId)) {
      throw new Error("Another client already has this mobile number");
    }
  }

  let updated: Client | null = null;
  const next = clients.map((c) => {
    if (c.id === id) {
      const newId = data.phone ? normalizePhone(data.phone) : c.id;
      const merged: Client = { ...c, ...data, id: newId };
      // Auto-recompute status when totalPrice changes (unless status was explicitly set)
      if (data.totalPrice !== undefined && data.status === undefined) {
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
  writeLocal(readLocal().filter((c) => c.id !== id));
}

export async function addPayment(clientId: string, payment: Omit<Payment, "id">): Promise<Client | null> {
  const clients = readLocal();
  let updated: Client | null = null;
  const next = clients.map((c) => {
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
  const clients = readLocal();
  let updated: Client | null = null;
  const next = clients.map((c) => {
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
  const clients = readLocal();
  let updated: Client | null = null;
  const next = clients.map((c) => {
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
  const clients = readLocal();
  let updated: Client | null = null;
  const next = clients.map((c) => {
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
  const clients = readLocal();
  let updated: Client | null = null;
  const next = clients.map((c) => {
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
  const clients = readLocal();
  let updated: Client | null = null;
  const next = clients.map((c) => {
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
  const clients = readLocal();
  let updated: Client | null = null;
  const next = clients.map((c) => {
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
