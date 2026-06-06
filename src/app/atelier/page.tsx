"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { compressImage } from "@/lib/compressImage";

interface Payment {
  id: string;
  amount: number;
  date: string;
  note: string;
}

interface Dress {
  id: string;
  label: string;
  images: string[];
  createdAt: string;
}

interface VoiceNote {
  id: string;
  url: string;
  from: "atelier" | "admin";
  createdAt: string;
}

interface Client {
  id: string;
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
}

function paid(c: Client) {
  return c.payments.reduce((s, p) => s + p.amount, 0);
}
function remaining(c: Client) {
  return Math.max(0, c.totalPrice - paid(c));
}

const statusAr = { active: "نشط", completed: "مكتمل", pending: "جديد" };
const statusBg = {
  active: "bg-green-100 text-green-700",
  completed: "bg-blue-100 text-blue-700",
  pending: "bg-amber-100 text-amber-700",
};
const dressTypeAr = { wedding: "زفاف", evening: "سهرة", "": "" };
const branchAr = { cairo: "القاهرة", damietta: "دمياط", "": "" };

function fmtDate(d: string) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

// Normalize search input: handle both Latin and Arabic-Indic digits
function normalizeDigits(s: string): string {
  return s
    .replace(/[٠-٩]/g, d => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/\D/g, "");
}

// ── Add Payment Modal ─────────────────────────────────
function AddPaymentModal({
  clientName,
  onSave,
  onClose,
}: {
  clientName: string;
  onSave: (amount: number, date: string, note: string) => Promise<void>;
  onClose: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return;
    setSaving(true);
    try {
      await onSave(Number(amount), date, note);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden" dir="rtl">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 className="font-bold text-base text-black">إضافة دفعة</h3>
          <p className="text-xs text-gray-400">{clientName}</p>
          <button onClick={onClose} className="text-gray-300 hover:text-black text-xl font-bold transition-colors">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-[12px] uppercase tracking-[2px] text-gray-400 font-bold block mb-1.5">المبلغ (جنيه) *</label>
            <input
              type="number"
              min="1"
              required
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-4 py-3 text-lg font-black text-black focus:border-[#b3a384] focus:outline-none"
              placeholder="0"
              autoFocus
            />
          </div>
          <div>
            <label className="text-[12px] uppercase tracking-[2px] text-gray-400 font-bold block mb-1.5">التاريخ</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:border-[#b3a384] focus:outline-none"
            />
          </div>
          <div>
            <label className="text-[12px] uppercase tracking-[2px] text-gray-400 font-bold block mb-1.5">ملاحظة (اختياري)</label>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:border-[#b3a384] focus:outline-none"
              placeholder="مثال: دفعة مقدمة"
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 min-h-[48px] border border-gray-200 rounded-xl text-[13px] uppercase tracking-[2px] font-black text-gray-400 hover:bg-gray-50 transition-all">إلغاء</button>
            <button type="submit" disabled={saving} className="flex-1 min-h-[48px] bg-black text-white rounded-xl text-[13px] uppercase tracking-[2px] font-black hover:bg-[#b3a384] transition-all disabled:opacity-40">
              {saving ? "جاري الحفظ..." : "حفظ"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Edit Payment Modal ─────────────────────────────────
function EditPaymentModal({
  payment,
  clientName,
  onSave,
  onClose,
}: {
  payment: Payment;
  clientName: string;
  onSave: (amount: number, date: string, note: string) => Promise<void>;
  onClose: () => void;
}) {
  const [amount, setAmount] = useState(String(payment.amount));
  const [date, setDate] = useState(payment.date);
  const [note, setNote] = useState(payment.note);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return;
    setSaving(true);
    try {
      await onSave(Number(amount), date, note);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden" dir="rtl">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 className="font-bold text-base text-black">تعديل الدفعة</h3>
          <p className="text-xs text-gray-400">{clientName}</p>
          <button onClick={onClose} className="text-gray-300 hover:text-black text-xl font-bold transition-colors">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-[12px] uppercase tracking-[2px] text-gray-400 font-bold block mb-1.5">المبلغ (جنيه) *</label>
            <input
              type="number"
              min="1"
              required
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-4 py-3 text-lg font-black text-black focus:border-[#b3a384] focus:outline-none"
              placeholder="0"
              autoFocus
            />
          </div>
          <div>
            <label className="text-[12px] uppercase tracking-[2px] text-gray-400 font-bold block mb-1.5">التاريخ</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:border-[#b3a384] focus:outline-none"
            />
          </div>
          <div>
            <label className="text-[12px] uppercase tracking-[2px] text-gray-400 font-bold block mb-1.5">ملاحظة (اختياري)</label>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:border-[#b3a384] focus:outline-none"
              placeholder="مثال: دفعة مقدمة"
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 min-h-[48px] border border-gray-200 rounded-xl text-[13px] uppercase tracking-[2px] font-black text-gray-400 hover:bg-gray-50 transition-all">إلغاء</button>
            <button type="submit" disabled={saving} className="flex-1 min-h-[48px] bg-black text-white rounded-xl text-[13px] uppercase tracking-[2px] font-black hover:bg-[#b3a384] transition-all disabled:opacity-40">
              {saving ? "جاري الحفظ..." : "حفظ التعديلات"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Edit Client Modal ─────────────────────────────────
function EditClientModal({
  client,
  onSave,
  onClose,
}: {
  client: Client;
  onSave: (data: Partial<Client>) => Promise<void>;
  onClose: () => void;
}) {
  const [name, setName] = useState(client.name);
  const [notes, setNotes] = useState(client.notes);
  const [totalPrice, setTotalPrice] = useState(String(client.totalPrice || ""));
  const [appointmentDate, setAppointmentDate] = useState(client.appointmentDate);
  const [nextAppointmentDate, setNextAppointmentDate] = useState(client.nextAppointmentDate);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({ name, notes, totalPrice: Number(totalPrice) || 0, appointmentDate, nextAppointmentDate });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-y-auto max-h-[95vh]" dir="rtl">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 className="font-bold text-base text-black">تعديل بيانات العميل</h3>
          <button onClick={onClose} className="text-gray-300 hover:text-black text-xl font-bold transition-colors">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-[12px] tracking-[2px] text-gray-400 font-bold block mb-1.5">الاسم</label>
            <input value={name} onChange={e => setName(e.target.value)} className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:border-[#b3a384] focus:outline-none" placeholder="الاسم الكامل" />
          </div>
          <div>
            <label className="text-[12px] tracking-[2px] text-gray-400 font-bold block mb-1.5">إجمالي السعر (جنيه)</label>
            <input type="number" min="0" value={totalPrice} onChange={e => setTotalPrice(e.target.value)} className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:border-[#b3a384] focus:outline-none" placeholder="0" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[12px] tracking-[2px] text-gray-400 font-bold block mb-1.5">الموعد الأول</label>
              <input type="date" value={appointmentDate} onChange={e => setAppointmentDate(e.target.value)} className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:border-[#b3a384] focus:outline-none" />
            </div>
            <div>
              <label className="text-[12px] tracking-[2px] text-gray-400 font-bold block mb-1.5">الموعد القادم</label>
              <input type="date" value={nextAppointmentDate} onChange={e => setNextAppointmentDate(e.target.value)} className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:border-[#b3a384] focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="text-[12px] tracking-[2px] text-gray-400 font-bold block mb-1.5">ملاحظات</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:border-[#b3a384] focus:outline-none resize-none" placeholder="ملاحظات خاصة بالعميل..." />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 min-h-[48px] border border-gray-200 rounded-xl text-[13px] font-black text-gray-400 hover:bg-gray-50 transition-all">إلغاء</button>
            <button type="submit" disabled={saving} className="flex-1 min-h-[48px] bg-black text-white rounded-xl text-[13px] font-black hover:bg-[#b3a384] transition-all disabled:opacity-40">
              {saving ? "جاري الحفظ..." : "حفظ التعديلات"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Image Lightbox ────────────────────────────────────
function Lightbox({ src, onClose }: { src: string; onClose: () => void }) {
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);
  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={onClose}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" onClick={e => e.stopPropagation()} />
      <button onClick={onClose} className="absolute top-4 right-4 text-white text-2xl font-bold bg-black/50 w-10 h-10 rounded-full flex items-center justify-center hover:bg-black transition-colors">✕</button>
    </div>
  );
}

// ── Voice Note Player ─────────────────────────────────
function VoiceNotePlayer({ note, onDelete }: { note: VoiceNote; onDelete?: () => void }) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const fmt = (s: number) => isFinite(s) && s > 0
    ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`
    : "—";

  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) { audioRef.current.pause(); setPlaying(false); }
    else { audioRef.current.play().catch(() => {}); setPlaying(true); }
  };

  const isAdmin = note.from === "admin";

  return (
    <div className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${isAdmin ? "bg-indigo-50 border border-indigo-100" : "bg-[#faf9f7] border border-[#e8dfd4]"}`}>
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio
        ref={audioRef}
        src={note.url}
        onLoadedMetadata={e => setDuration((e.target as HTMLAudioElement).duration)}
        onTimeUpdate={e => {
          const a = e.target as HTMLAudioElement;
          if (a.duration) setProgress((a.currentTime / a.duration) * 100);
        }}
        onEnded={() => { setPlaying(false); setProgress(0); if (audioRef.current) audioRef.current.currentTime = 0; }}
      />
      <button
        onClick={toggle}
        className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center shadow-sm transition-transform active:scale-95 ${isAdmin ? "bg-indigo-500 text-white" : "bg-[#b3a384] text-white"}`}
      >
        {playing ? (
          <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
        ) : (
          <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><polygon points="6,3 20,12 6,21"/></svg>
        )}
      </button>
      <div className="flex-1 min-w-0">
        <div className="h-1.5 bg-white rounded-full overflow-hidden border border-gray-100 mb-1.5">
          <div
            className={`h-full rounded-full transition-all duration-100 ${isAdmin ? "bg-indigo-400" : "bg-[#b3a384]"}`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex items-center justify-between">
          <span className={`text-[11px] font-bold ${isAdmin ? "text-indigo-400" : "text-[#b3a384]"}`}>
            {isAdmin ? "رد الإدارة" : "من الأتيليه"}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-300">{fmt(duration)}</span>
            <span className="text-[10px] text-gray-300">
              {new Date(note.createdAt).toLocaleDateString("ar-EG", { day: "numeric", month: "short" })}
            </span>
          </div>
        </div>
      </div>
      {onDelete && (
        <button onClick={onDelete} className="shrink-0 text-gray-200 hover:text-red-400 transition-colors text-base leading-none">✕</button>
      )}
    </div>
  );
}

// ── Voice Recorder ────────────────────────────────────
function VoiceRecorder({ onSave }: { onSave: (url: string) => Promise<void> }) {
  const [state, setState] = useState<"idle" | "recording" | "uploading">("idle");
  const [secs, setSecs] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"]
        .find(t => MediaRecorder.isTypeSupported(t)) ?? "";
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const mime = recorder.mimeType || "audio/webm";
        const ext = mime.includes("mp4") ? "mp4" : mime.includes("ogg") ? "ogg" : "webm";
        const blob = new Blob(chunksRef.current, { type: mime });
        setState("uploading");
        try {
          const fd = new FormData();
          fd.append("file", blob, `voice.${ext}`);
          const res = await fetch("/api/upload/voice", { method: "POST", body: fd });
          if (!res.ok) throw new Error();
          const { url } = await res.json();
          await onSave(url);
        } catch {
          alert("فشل رفع الملاحظة الصوتية، يرجى المحاولة مرة أخرى");
        } finally {
          setState("idle");
          setSecs(0);
        }
      };
      recorder.start(250);
      recorderRef.current = recorder;
      setState("recording");
      setSecs(0);
      timerRef.current = setInterval(() => setSecs(s => s + 1), 1000);
    } catch {
      alert("تعذّر الوصول إلى الميكروفون — تأكد من منح الإذن");
    }
  };

  const stop = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    recorderRef.current?.stop();
  };

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  if (state === "uploading") {
    return (
      <div className="flex items-center gap-2 text-xs text-gray-400 py-2">
        <span className="w-2 h-2 rounded-full bg-[#b3a384] animate-pulse" />
        <span>جاري الرفع...</span>
      </div>
    );
  }

  if (state === "recording") {
    return (
      <div className="flex items-center gap-3">
        <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shrink-0" />
        <span className="text-sm font-black text-red-600 tabular-nums">{fmt(secs)}</span>
        <button
          onClick={stop}
          className="min-h-[44px] px-5 py-2 bg-red-500 text-white rounded-xl text-[13px] font-black hover:bg-red-600 transition-colors flex items-center gap-2"
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>
          إيقاف
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={start}
      className="flex items-center gap-2 min-h-[44px] px-4 py-2.5 border border-dashed border-[#b3a384] text-[#b3a384] hover:bg-[#b3a384] hover:text-white rounded-xl text-[13px] font-black transition-all w-full justify-center"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/>
        <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
        <line x1="12" y1="19" x2="12" y2="22"/>
      </svg>
      تسجيل ملاحظة صوتية
    </button>
  );
}

// ── Client Card ───────────────────────────────────────
function ClientCard({
  client,
  onAddPayment,
  onDeletePayment,
  onEditPayment,
  onEdit,
  onRefresh,
}: {
  client: Client;
  onAddPayment: (clientId: string) => void;
  onDeletePayment: (clientId: string, paymentId: string) => void;
  onEditPayment: (clientId: string, payment: Payment) => void;
  onEdit: (client: Client) => void;
  onRefresh: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [uploadingDressId, setUploadingDressId] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState("");

  const handleUploadDressImages = async (dressId: string, files: FileList) => {
    if (!files.length) return;
    setUploadingDressId(dressId);
    try {
      const uploaded: string[] = [];
      for (let i = 0; i < files.length; i++) {
        setUploadStatus(`ضغط ${i + 1}/${files.length}...`);
        const compressed = await compressImage(files[i]);
        setUploadStatus(`رفع ${i + 1}/${files.length}...`);
        const fd = new FormData();
        fd.append("files", compressed, compressed.name);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        if (!res.ok) { setUploadStatus("فشل الرفع"); return; }
        const data = await res.json();
        uploaded.push(...data.uploaded);
      }
      if (uploaded.length) {
        await fetch("/api/admin/clients", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: client.id, action: "addDressImages", dressId, images: uploaded }),
        });
        onRefresh();
      }
    } finally {
      setUploadingDressId(null);
      setUploadStatus("");
    }
  };

  const paidAmt = paid(client);
  const remainAmt = remaining(client);
  const pct = client.totalPrice > 0 ? Math.round((paidAmt / client.totalPrice) * 100) : 0;

  return (
    <div className={`rounded-xl border overflow-hidden bg-white transition-all duration-200 ${expanded ? "shadow-lg border-gray-200" : "shadow-sm border-gray-100 hover:shadow-md"}`}>
      {lightbox && <Lightbox src={lightbox} onClose={() => setLightbox(null)} />}

      {/* Collapsed row */}
      <button onClick={() => setExpanded(!expanded)} className="w-full text-right px-4 sm:px-6 py-4 flex items-start gap-3 sm:gap-4">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`shrink-0 mt-1 text-gray-300 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}>
          <path d="m6 9 6 6 6-6" />
        </svg>
        <div className="flex-1 min-w-0 text-right">
          <p className="text-base font-black text-black mb-0.5"><span dir="ltr">{client.phone}</span></p>
          <div className="flex flex-wrap items-center gap-2 mb-1 justify-end">
            <span className={`text-[12px] tracking-[2px] font-black px-2 py-0.5 rounded-full ${statusBg[client.status]}`}>{statusAr[client.status]}</span>
            {client.dressType && <span className="text-[12px] tracking-[1px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">{dressTypeAr[client.dressType]}</span>}
            {client.branch && <span className="text-[12px] tracking-[1px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{branchAr[client.branch]}</span>}
            <span className="text-xs text-stone-500">{client.name}</span>
          </div>
          <p className="text-xs text-stone-400">
            {paidAmt.toLocaleString("en-US")} جنيه مدفوع · {remainAmt.toLocaleString("en-US")} جنيه متبقي
          </p>
          <div className="mt-2 h-1 bg-gray-100 rounded-full overflow-hidden w-full max-w-xs mr-auto">
            <div className="h-full bg-[#b3a384] rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
          {client.nextAppointmentDate && (
            <p className="text-[13px] text-gray-400 mt-1.5 font-bold">الموعد القادم: {fmtDate(client.nextAppointmentDate)}</p>
          )}
        </div>
        <span className={`mt-2 shrink-0 w-2 h-2 rounded-full ${client.status === "active" ? "bg-green-500" : client.status === "completed" ? "bg-blue-400" : "bg-amber-400"}`} />
      </button>

      {/* Expanded */}
      {expanded && (
        <div className="px-4 sm:px-6 pb-6 space-y-6 border-t border-gray-100 pt-5">

          {/* Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-lg px-4 py-3 text-right">
              <p className="text-[12px] tracking-[2px] font-black text-gray-400 mb-1">رقم الموبايل</p>
              <a href={`tel:${client.phone}`} className="text-base font-black text-stone-800 hover:text-[#b3a384] transition-colors"><span dir="ltr">{client.phone}</span></a>
            </div>
            {client.email && (
              <div className="bg-gray-50 rounded-lg px-4 py-3 text-right">
                <p className="text-[12px] tracking-[2px] font-black text-gray-400 mb-1">البريد الإلكتروني</p>
                <span className="text-sm text-stone-700 break-all">{client.email}</span>
              </div>
            )}
          </div>

          {/* Financial summary */}
          <div className="bg-[#faf9f7] border border-[#e8dfd4] rounded-xl p-4 text-right">
            <p className="text-[12px] tracking-[3px] font-black text-gray-400 mb-3">الملخص المالي</p>
            <div className="grid grid-cols-3 gap-2 text-center mb-4">
              <div>
                <p className="text-[12px] tracking-[1px] font-bold text-gray-400 mb-0.5">الإجمالي</p>
                <p className="text-sm sm:text-base font-black text-black">{client.totalPrice.toLocaleString("en-US")} ج</p>
              </div>
              <div>
                <p className="text-[12px] tracking-[1px] font-bold text-gray-400 mb-0.5">المدفوع</p>
                <p className="text-sm sm:text-base font-black text-green-600">{paidAmt.toLocaleString("en-US")} ج</p>
              </div>
              <div>
                <p className="text-[12px] tracking-[1px] font-bold text-gray-400 mb-0.5">المتبقي</p>
                <p className="text-sm sm:text-base font-black text-amber-600">{remainAmt.toLocaleString("en-US")} ج</p>
              </div>
            </div>
            <div className="h-2 bg-white rounded-full overflow-hidden border border-[#e8dfd4]">
              <div className="h-full bg-[#b3a384] rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
            <p className="text-[13px] text-gray-400 font-bold mt-1.5 text-left">{pct}% مدفوع</p>
          </div>

          {/* Payments */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <button onClick={() => onAddPayment(client.id)} className="text-[13px] font-black tracking-[2px] text-[#b3a384] hover:text-black transition-colors">+ إضافة دفعة</button>
              <p className="text-[12px] tracking-[3px] font-black text-gray-400">سجل الدفعات</p>
            </div>
            {client.payments.length === 0 ? (
              <p className="text-xs text-gray-300 italic text-right">لا توجد دفعات مسجلة بعد</p>
            ) : (
              <div className="space-y-2">
                {client.payments.map(p => (
                  <div key={p.id} className="flex items-center gap-3 bg-white border border-gray-100 rounded-lg px-4 py-2.5">
                    <button onClick={() => onDeletePayment(client.id, p.id)} className="text-red-400 hover:text-red-600 transition-colors text-xs font-black shrink-0">✕</button>
                    <button onClick={() => onEditPayment(client.id, p)} className="text-gray-300 hover:text-[#b3a384] transition-colors shrink-0" title="تعديل الدفعة">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <span className="text-[13px] text-gray-400 font-bold whitespace-nowrap">{fmtDate(p.date)}</span>
                    <div className="flex-1 min-w-0 text-right">
                      <span className="text-sm font-black text-green-600">+{p.amount.toLocaleString("en-US")} جنيه</span>
                      {p.note && <span className="text-[13px] text-gray-400 mr-2">· {p.note}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Dresses */}
          <div>
            <p className="text-[12px] tracking-[3px] font-black text-gray-400 mb-3 text-right">صور الفستان</p>
            {(client.dresses ?? []).length === 0 ? (
              <p className="text-xs text-gray-300 italic text-right">لا يوجد فستان مضاف بعد — أضفه من لوحة الإدارة أولاً</p>
            ) : (
              (client.dresses ?? []).map((dress) => (
                <div key={dress.id} className="space-y-3">
                  {dress.label && (
                    <p className="text-xs text-stone-500 font-bold text-right">{dress.label}</p>
                  )}
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {dress.images.map((src) => (
                      <div key={src} className="relative group aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden shadow-sm">
                        <button onClick={() => setLightbox(src)} className="w-full h-full">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={src} alt="" className="w-full h-full object-cover" loading="lazy" />
                        </button>
                        <button
                          onClick={async () => {
                            if (!window.confirm("حذف هذه الصورة؟")) return;
                            await fetch("/api/admin/clients", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: client.id, action: "removeDressImage", dressId: dress.id, imageUrl: src }) });
                            fetch("/api/upload", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: src }) }).catch(() => {});
                            onRefresh();
                          }}
                          className="absolute top-1 right-1 bg-red-500 text-white text-[13px] w-6 h-6 flex items-center justify-center rounded-full shadow opacity-80 hover:opacity-100 transition-opacity"
                        >✕</button>
                      </div>
                    ))}
                    {/* Upload button */}
                    <label className={`aspect-[3/4] border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors ${uploadingDressId === dress.id ? "border-[#b3a384] text-[#b3a384]" : "border-gray-200 text-gray-300 hover:border-[#b3a384] hover:text-[#b3a384]"}`}>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={e => { if (e.target.files) handleUploadDressImages(dress.id, e.target.files); e.target.value = ""; }}
                      />
                      {uploadingDressId === dress.id ? (
                        <span className="text-[12px] font-black text-center px-1">{uploadStatus}</span>
                      ) : (
                        <>
                          <span className="text-xl">+</span>
                          <span className="text-[12px] font-black">صور</span>
                        </>
                      )}
                    </label>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Voice Notes */}
          <div>
            <p className="text-[12px] tracking-[3px] font-black text-gray-400 mb-3 text-right">ملاحظات صوتية</p>
            <div className="space-y-2 mb-3">
              {(client.voiceNotes ?? []).length === 0 ? (
                <p className="text-xs text-gray-300 italic text-right">لا توجد ملاحظات صوتية بعد</p>
              ) : (
                (client.voiceNotes ?? []).map(note => (
                  <VoiceNotePlayer
                    key={note.id}
                    note={note}
                    onDelete={note.from === "atelier" ? async () => {
                      if (!window.confirm("حذف هذه الملاحظة الصوتية؟")) return;
                      await fetch("/api/admin/clients", {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ id: client.id, action: "deleteVoiceNote", voiceNoteId: note.id }),
                      });
                      onRefresh();
                    } : undefined}
                  />
                ))
              )}
            </div>
            <VoiceRecorder
              onSave={async (url) => {
                await fetch("/api/admin/clients", {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ id: client.id, action: "addVoiceNote", url, from: "atelier" }),
                });
                onRefresh();
              }}
            />
          </div>

          {/* Notes */}
          {client.notes && (
            <div className="bg-amber-50 border border-amber-100 rounded-lg px-4 py-3 text-right">
              <p className="text-[12px] tracking-[2px] font-black text-amber-600 mb-2">ملاحظات</p>
              <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-wrap">{client.notes}</p>
            </div>
          )}

          {/* Client Images (reference images set by assistant in admin) */}
          {(client.clientImages ?? []).length > 0 && (
            <div>
              <p className="text-[12px] tracking-[3px] font-black text-gray-400 mb-3 text-right">صور من العميل</p>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {(client.clientImages ?? []).map((src) => (
                  <div key={src} className="relative aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden shadow-sm group">
                    <button onClick={() => setLightbox(src)} className="w-full h-full">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt="" className="w-full h-full object-cover" loading="lazy" />
                    </button>
                    <button
                      onClick={async () => {
                        if (!window.confirm("حذف هذه الصورة؟")) return;
                        const updated = (client.clientImages ?? []).filter(u => u !== src);
                        await fetch("/api/admin/clients", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: client.id, clientImages: updated }) });
                        onRefresh();
                      }}
                      className="absolute top-1 right-1 bg-red-500 text-white text-[13px] w-6 h-6 flex items-center justify-center rounded-full shadow opacity-80 hover:opacity-100 transition-opacity"
                    >✕</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Appointments */}
          {(client.appointmentDate || client.nextAppointmentDate || client.fittingDate || client.eventDate) && (
            <div className="grid grid-cols-2 gap-3 text-right">
              {client.appointmentDate && (
                <div className="bg-gray-50 rounded-lg px-4 py-3">
                  <p className="text-[12px] tracking-[2px] font-black text-gray-400 mb-1">الموعد الأول</p>
                  <p className="text-sm font-bold text-stone-700">{fmtDate(client.appointmentDate)}</p>
                </div>
              )}
              {client.nextAppointmentDate && (
                <div className="bg-gray-50 rounded-lg px-4 py-3">
                  <p className="text-[12px] tracking-[2px] font-black text-gray-400 mb-1">الموعد القادم</p>
                  <p className="text-sm font-bold text-stone-700">{fmtDate(client.nextAppointmentDate)}</p>
                </div>
              )}
              {client.fittingDate && (
                <div className="bg-gray-50 rounded-lg px-4 py-3">
                  <p className="text-[12px] tracking-[2px] font-black text-gray-400 mb-1">موعد القياس</p>
                  <p className="text-sm font-bold text-stone-700">{fmtDate(client.fittingDate)}</p>
                </div>
              )}
              {client.eventDate && (
                <div className="bg-gray-50 rounded-lg px-4 py-3">
                  <p className="text-[12px] tracking-[2px] font-black text-gray-400 mb-1">تاريخ المناسبة</p>
                  <p className="text-sm font-bold text-[#b3a384]">{fmtDate(client.eventDate)}</p>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            {client.phone && (
              <a
                href={`https://wa.me/${client.phone.replace(/\D/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 min-h-[44px] bg-[#25D366] text-white px-5 py-2.5 rounded-lg text-[13px] tracking-[2px] font-black hover:bg-[#1ebe5d] transition-all"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                </svg>
                واتساب
              </a>
            )}
            <button
              onClick={() => onEdit(client)}
              className="inline-flex items-center gap-2 min-h-[44px] px-5 py-2.5 rounded-lg text-[13px] tracking-[2px] font-black border border-gray-200 text-gray-500 hover:bg-gray-50 transition-all"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              تعديل البيانات
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────
export default function AtelierPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "pending" | "completed">("all");
  const [paymentClientId, setPaymentClientId] = useState<string | null>(null);
  const [editingPayment, setEditingPayment] = useState<{ clientId: string; payment: Payment } | null>(null);
  const [editClient, setEditClient] = useState<Client | null>(null);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/admin/clients");
    const data = await res.json();
    setClients(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const filtered = clients.filter(c => {
    const matchStatus = filter === "all" || c.status === filter;
    const q = search.trim();
    if (!q) return matchStatus;
    const qDigits = normalizeDigits(q);
    const matchPhone = qDigits.length > 0 && normalizeDigits(c.phone ?? "").includes(qDigits);
    const matchName = (c.name ?? "").includes(q);
    return matchStatus && (matchPhone || matchName);
  });

  const counts = {
    active: clients.filter(c => c.status === "active").length,
    pending: clients.filter(c => c.status === "pending").length,
    completed: clients.filter(c => c.status === "completed").length,
  };

  const totalCollected = clients.reduce((s, c) => s + paid(c), 0);
  const totalRemaining = clients.reduce((s, c) => s + remaining(c), 0);

  const handleAddPayment = async (clientId: string, amount: number, date: string, note: string) => {
    await fetch("/api/admin/clients", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: clientId, action: "addPayment", amount, date, note }),
    });
    setPaymentClientId(null);
    refresh();
  };

  const handleUpdate = async (data: Partial<Client>) => {
    if (!editClient) return;
    await fetch("/api/admin/clients", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editClient.id, ...data }),
    });
    setEditClient(null);
    refresh();
  };

  const handleDeletePayment = async (clientId: string, paymentId: string) => {
    if (!window.confirm("هل تريد حذف هذه الدفعة؟")) return;
    await fetch("/api/admin/clients", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: clientId, action: "deletePayment", paymentId }),
    });
    refresh();
  };

  const handleEditPayment = async (clientId: string, paymentId: string, amount: number, date: string, note: string) => {
    await fetch("/api/admin/clients", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: clientId, action: "updatePayment", paymentId, amount, date, note }),
    });
    setEditingPayment(null);
    refresh();
  };

  const paymentClient = clients.find(c => c.id === paymentClientId);

  return (
    <div dir="rtl" lang="ar" className="atelier-root min-h-screen bg-[#faf9f7]" style={{ fontFamily: "'Tajawal', 'Segoe UI', Arial, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap');
        * { letter-spacing: 0 !important; }
        .atelier-root { font-size: 17px; }
      `}</style>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-5">

        {/* Page title + refresh */}
        <div className="flex items-center justify-between">
          <button onClick={refresh} className="text-[13px] font-black px-4 py-2.5 min-h-[44px] border border-gray-200 hover:bg-black hover:text-white hover:border-black transition-all rounded flex items-center gap-2">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>
            تحديث
          </button>
          <div className="text-right">
            <h1 className="text-lg font-black text-black">إدارة العملاء</h1>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4 text-right">
          <p className="text-2xl font-black text-black mb-0.5">{clients.length} عميل</p>
          <p className="text-xs text-gray-400 font-bold">
            {totalCollected.toLocaleString("en-US")} جنيه محصّل · {totalRemaining.toLocaleString("en-US")} جنيه متبقي
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <svg className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="بحث بالاسم أو رقم الموبايل..."
            className="w-full border border-gray-200 rounded-xl pr-11 pl-10 py-3 text-base focus:border-[#b3a384] focus:outline-none bg-white text-right"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-black text-lg font-bold transition-colors">✕</button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {([["active", "نشط"], ["pending", "جديد"], ["completed", "مكتمل"]] as const).map(([s, label]) => (
            <div key={s} className="bg-white border border-gray-100 rounded-xl p-3 text-center shadow-sm">
              <p className="text-xl font-black text-black">{counts[s]}</p>
              <p className="text-[12px] tracking-[2px] font-bold text-gray-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap">
          {([["all", `الكل (${clients.length})`], ["active", `نشط (${counts.active})`], ["pending", `جديد (${counts.pending})`], ["completed", `مكتمل (${counts.completed})`]] as const).map(([f, label]) => (
            <button key={f} onClick={() => setFilter(f)} className={`min-h-[40px] px-4 py-2 text-[13px] tracking-[1px] font-black rounded-full transition-all ${filter === f ? "bg-black text-white" : "bg-white border border-gray-100 text-gray-400 hover:bg-gray-50"}`}>
              {label}
            </button>
          ))}
        </div>

        {/* Client list */}
        {loading ? (
          <div className="py-20 text-center text-gray-300 text-sm">جاري التحميل...</div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center border-2 border-dashed border-gray-100 rounded text-gray-300 text-xs tracking-[3px] font-bold">
            {search ? `لم يتم العثور على عميل بالرقم "${search}"` : "لا يوجد عملاء"}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(client => (
              <ClientCard
                key={client.id}
                client={client}
                onAddPayment={setPaymentClientId}
                onDeletePayment={handleDeletePayment}
                onEditPayment={(clientId, payment) => setEditingPayment({ clientId, payment })}
                onEdit={setEditClient}
                onRefresh={refresh}
              />
            ))}
          </div>
        )}
      </main>

      {/* Add Payment Modal */}
      {paymentClientId && paymentClient && (
        <AddPaymentModal
          clientName={paymentClient.name || paymentClient.phone}
          onSave={(amount, date, note) => handleAddPayment(paymentClientId, amount, date, note)}
          onClose={() => setPaymentClientId(null)}
        />
      )}

      {/* Edit Payment Modal */}
      {editingPayment && (
        <EditPaymentModal
          payment={editingPayment.payment}
          clientName={clients.find(c => c.id === editingPayment.clientId)?.name || editingPayment.clientId}
          onSave={(amount, date, note) => handleEditPayment(editingPayment.clientId, editingPayment.payment.id, amount, date, note)}
          onClose={() => setEditingPayment(null)}
        />
      )}

      {/* Edit Client Modal */}
      {editClient && (
        <EditClientModal
          client={editClient}
          onSave={handleUpdate}
          onClose={() => setEditClient(null)}
        />
      )}
    </div>
  );
}
