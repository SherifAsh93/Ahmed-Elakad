import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  getClients,
  addClient,
  updateClient,
  deleteClient,
  addPayment,
  updatePayment,
  deletePayment,
  addDress,
  deleteDress,
  addDressImages,
  removeDressImage,
  updateDressLabel,
  addVoiceNote,
  deleteVoiceNote,
} from "@/lib/clients";

async function auth() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");
  return session?.value === "authenticated";
}

export async function GET() {
  if (!(await auth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const clients = await getClients();
  return NextResponse.json(clients);
}

export async function POST(req: NextRequest) {
  if (!(await auth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  if (!body.phone) return NextResponse.json({ error: "Mobile number is required" }, { status: 400 });
  try {
    const client = await addClient({
      name: body.name ?? "",
      email: body.email ?? "",
      phone: body.phone,
      notes: body.notes ?? "",
      totalPrice: Number(body.totalPrice) || 0,
      payments: [],
      dresses: [],
      appointmentDate: body.appointmentDate ?? "",
      appointmentTime: body.appointmentTime ?? "",
      nextAppointmentDate: body.nextAppointmentDate ?? "",
      fittingDate: body.fittingDate ?? "",
      fittingTime: body.fittingTime ?? "",
      eventDate: body.eventDate ?? "",
      dressType: body.dressType ?? "",
      branch: body.branch ?? "",
      clientImages: body.clientImages ?? [],
      status: body.status ?? "pending",
      sourceMessageId: body.sourceMessageId,
    });
    return NextResponse.json(client, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to create client";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function PUT(req: NextRequest) {
  if (!(await auth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { id, action, ...data } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  if (action === "addPayment") {
    const updated = await addPayment(id, { amount: Number(data.amount), date: data.date, note: data.note ?? "" });
    if (!updated) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json(updated);
  }

  if (action === "updatePayment") {
    const updated = await updatePayment(id, data.paymentId, {
      amount: data.amount !== undefined ? Number(data.amount) : undefined,
      date: data.date,
      note: data.note,
    });
    if (!updated) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json(updated);
  }

  if (action === "deletePayment") {
    const updated = await deletePayment(id, data.paymentId);
    if (!updated) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json(updated);
  }

  if (action === "addDress") {
    const updated = await addDress(id, data.label ?? "");
    if (!updated) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json(updated);
  }

  if (action === "deleteDress") {
    const updated = await deleteDress(id, data.dressId);
    if (!updated) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json(updated);
  }

  if (action === "addDressImages") {
    const updated = await addDressImages(id, data.dressId, data.images ?? []);
    if (!updated) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json(updated);
  }

  if (action === "removeDressImage") {
    const updated = await removeDressImage(id, data.dressId, data.imageUrl);
    if (!updated) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json(updated);
  }

  if (action === "updateDressLabel") {
    const updated = await updateDressLabel(id, data.dressId, data.label ?? "");
    if (!updated) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json(updated);
  }

  if (action === "addVoiceNote") {
    if (!data.url || !data.from) return NextResponse.json({ error: "url and from required" }, { status: 400 });
    const updated = await addVoiceNote(id, { url: data.url, from: data.from });
    if (!updated) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json(updated);
  }

  if (action === "deleteVoiceNote") {
    if (!data.voiceNoteId) return NextResponse.json({ error: "voiceNoteId required" }, { status: 400 });
    const updated = await deleteVoiceNote(id, data.voiceNoteId);
    if (!updated) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json(updated);
  }

  try {
    const updated = await updateClient(id, {
      name: data.name,
      email: data.email,
      phone: data.phone,
      notes: data.notes,
      totalPrice: data.totalPrice !== undefined ? Number(data.totalPrice) : undefined,
      appointmentDate: data.appointmentDate,
      appointmentTime: data.appointmentTime,
      nextAppointmentDate: data.nextAppointmentDate,
      fittingDate: data.fittingDate,
      fittingTime: data.fittingTime,
      eventDate: data.eventDate,
      dressType: data.dressType,
      branch: data.branch,
      clientImages: data.clientImages,
      status: data.status,
    });
    if (!updated) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json(updated);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to update client";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!(await auth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await deleteClient(body.id);
  return NextResponse.json({ ok: true });
}
