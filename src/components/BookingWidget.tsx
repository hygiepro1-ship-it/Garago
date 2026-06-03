"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useLang } from "@/contexts/LanguageContext";

interface BookingWidgetProps {
  garageId:     string;
  garageSlug:   string;
  garageName:   string;
  garageAddress?: string;
  garageCity?:    string;
  services: Array<{ category: { name: string } }>;
}

type Step = "service" | "date" | "slot" | "info" | "done";

const MONTHS_FR = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
const DAYS_FR   = ["Dim","Lun","Mar","Mer","Jeu","Ven","Sam"];

export default function BookingWidget({ garageId, garageSlug, garageName, garageAddress, garageCity, services }: BookingWidgetProps) {
  const { data: session } = useSession();
  const { t } = useLang();
  const b = t.booking;

  const [step, setStep]           = useState<Step>("service");
  const [service, setService]     = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  // Initialize calMonth without new Date() to avoid SSR/client hydration mismatch
  const [calMonth, setCalMonth]   = useState<Date>(() => {
    if (typeof window === "undefined") {
      // Server: return a placeholder (will be corrected by useEffect)
      return new Date(2000, 0, 1);
    }
    const d = new Date(); d.setDate(1); return d;
  });
  const [slots, setSlots]         = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [closedDay, setClosedDay] = useState(false);

  const [name, setName]           = useState("");
  const [phone, setPhone]         = useState("");
  const [email, setEmail]         = useState("");
  const [vehicleMake, setVehicleMake] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [vehicleYear, setVehicleYear] = useState("");
  const [userVehicles, setUserVehicles] = useState<{ id: string; year: number; make: string; model: string; isDefault: boolean }[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [submitting, setSubmitting]   = useState(false);
  const [error, setError]             = useState("");
  const [appointmentId, setAppointmentId] = useState<string | null>(null);

  // Correct calMonth on client after SSR (avoid hydration mismatch)
  useEffect(() => {
    const d = new Date(); d.setDate(1);
    setCalMonth(d);
  }, []);

  // Fetch user profile (name, email, phone, vehicles) when authenticated
  useEffect(() => {
    if (!session?.user) return;
    fetch("/api/user/profile")
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return;
        if (data.name)  setName(data.name);
        if (data.email) setEmail(data.email);
        if (data.phone) setPhone(data.phone);
        if (Array.isArray(data.vehicles) && data.vehicles.length > 0) {
          setUserVehicles(data.vehicles);
          // Pre-select default vehicle (or first one)
          const def = data.vehicles.find((v: any) => v.isDefault) ?? data.vehicles[0];
          setSelectedVehicleId(def.id);
          setVehicleYear(String(def.year));
          setVehicleMake(def.make);
          setVehicleModel(def.model);
        }
      })
      .catch(() => {});
  }, [session]);

  // Fetch slots when date changes
  useEffect(() => {
    if (!selectedDate) return;
    const dateStr = formatDate(selectedDate);
    setLoadingSlots(true);
    setSlots([]);
    setSelectedSlot("");
    setClosedDay(false);
    fetch(`/api/garages/${garageSlug}/slots?date=${dateStr}`)
      .then(r => r.json())
      .then(d => {
        setSlots(d.slots ?? []);
        setClosedDay(!!d.closed);
        setLoadingSlots(false);
      });
  }, [selectedDate, garageSlug]);

  function formatDate(d: Date) {
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  }

  function formatDateFr(d: Date) {
    return `${DAYS_FR[d.getDay()]} ${d.getDate()} ${MONTHS_FR[d.getMonth()]} ${d.getFullYear()}`;
  }

  function buildCalendar(month: Date) {
    const year = month.getFullYear();
    const mo   = month.getMonth();
    const firstDay = new Date(year, mo, 1).getDay();
    const daysInMonth = new Date(year, mo + 1, 0).getDate();
    const today = new Date(); today.setHours(0,0,0,0);

    const cells: (Date | null)[] = Array(firstDay).fill(null);
    for (let i = 1; i <= daysInMonth; i++) cells.push(new Date(year, mo, i));
    return { cells, today };
  }

  async function handleSubmit() {
    if (!name || !phone || !selectedDate || !selectedSlot) return;
    setSubmitting(true);
    setError("");
    const res = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        garageId,
        customerName:  name,
        customerPhone: phone,
        customerEmail: email || null,
        vehicleYear:   vehicleYear || null,
        vehicleMake:   vehicleMake || null,
        vehicleModel:  vehicleModel || null,
        serviceName:   service || null,
        date:      formatDate(selectedDate!),
        startTime: selectedSlot,
      }),
    });
    setSubmitting(false);
    if (res.ok) {
      const data = await res.json();
      setAppointmentId(data.id ?? null);
      setStep("done");
    } else {
      const d = await res.json();
      setError(d.error ?? "Erreur lors de la réservation");
    }
  }

  const { cells, today } = buildCalendar(calMonth);
  const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400";

  // ── DONE ─────────────────────────────────────────────────────────────────
  if (step === "done") {
    // Build Google Calendar URL
    const gcalDate = selectedDate ? formatDate(selectedDate) : "";
    const gcalStart = gcalDate.replace(/-/g, "") + "T" + (selectedSlot ?? "").replace(":", "") + "00";
    const [sh, sm] = (selectedSlot ?? "00:00").split(":").map(Number);
    const endMin = sh * 60 + sm + 60;
    const gcalEnd = gcalDate.replace(/-/g, "") + "T" + String(Math.floor(endMin / 60)).padStart(2, "0") + String(endMin % 60).padStart(2, "0") + "00";
    const location = [garageAddress, garageCity].filter(Boolean).join(", ");
    const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE` +
      `&text=${encodeURIComponent(`RDV ${garageName}${service ? ` — ${service}` : ""}`)}` +
      `&dates=${gcalStart}/${gcalEnd}` +
      `&details=${encodeURIComponent(`Rendez-vous chez ${garageName}${service ? `\nService : ${service}` : ""}`)}` +
      `&location=${encodeURIComponent(location)}`;

    const outlookUrl = `https://outlook.live.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent` +
      `&subject=${encodeURIComponent(`RDV ${garageName}`)}` +
      `&startdt=${gcalDate}T${(selectedSlot ?? "00:00").replace(":", "")}00` +
      `&enddt=${gcalDate}T${String(Math.floor(endMin / 60)).padStart(2, "0")}${String(endMin % 60).padStart(2, "0")}00` +
      `&location=${encodeURIComponent(location)}`;

    const icsUrl = appointmentId ? `/api/appointments/${appointmentId}/ics` : null;

    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
        <div className="text-center mb-5">
          <div className="text-5xl mb-3">✅</div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">{b.requestSent}</h3>
          <p className="text-gray-500 text-sm">
            <strong>{selectedDate ? formatDateFr(selectedDate) : ""}</strong> {b.at} <strong>{selectedSlot}</strong>
          </p>
          {email && (
            <p className="text-gray-400 text-xs mt-2">{b.confirmSentTo} <strong>{email}</strong></p>
          )}
        </div>

        {/* Calendar integration */}
        <div className="border border-gray-100 rounded-xl p-4 bg-gray-50">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">{b.addToCalendar}</p>
          <div className="flex flex-col gap-2">
            <a
              href={gcalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-700 hover:border-orange-300 hover:text-orange-600 transition-colors"
            >
              <span className="text-base">📅</span> {b.googleCal}
            </a>
            {icsUrl && (
              <a
                href={icsUrl}
                className="flex items-center gap-2.5 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-700 hover:border-gray-400 transition-colors"
              >
                <span className="text-base">🍎</span> {b.appleCal}
              </a>
            )}
            <a
              href={outlookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-700 hover:border-orange-300 hover:text-orange-600 transition-colors"
            >
              <span className="text-base">📧</span> {b.outlookCal}
            </a>
            {icsUrl && (
              <p className="text-xs text-gray-400 text-center mt-1">{b.icsNote}</p>
            )}
          </div>
        </div>

        <button
          onClick={() => { setStep("service"); setSelectedDate(null); setSelectedSlot(""); setService(""); setAppointmentId(null); }}
          className="mt-4 w-full text-center text-sm text-orange-500 hover:underline"
        >
          {b.anotherAppt}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-gray-100">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{b.title}</p>
        <p className="text-sm font-semibold text-gray-700">{garageName}</p>
      </div>

      {/* Progress */}
      <div className="flex border-b border-gray-100">
        {(["service","date","slot","info"] as Step[]).map((s, i) => {
          const labels = [b.service, b.date, b.slot, b.infoStep];
          const done = ["service","date","slot","info"].indexOf(step) > i;
          const active = step === s;
          return (
            <button
              key={s}
              onClick={() => {
                if (done) setStep(s);
              }}
              className="flex-1 py-2.5 text-xs font-semibold transition-colors relative"
              style={{ color: active ? "#f97316" : done ? "#6b7280" : "#d1d5db" }}
            >
              <span className="block">{i+1}. {labels[i]}</span>
              {active && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-400" />}
            </button>
          );
        })}
      </div>

      <div className="p-5">

        {/* ── Step 1: Service ─────────────────────────────────────── */}
        {step === "service" && (
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-3">{b.whatService}</p>
            <div className="space-y-2">
              {services.length > 0 ? services.map((sv, i) => (
                <button
                  key={i}
                  onClick={() => { setService(sv.category.name); setStep("date"); }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl border text-sm transition-all font-medium ${
                    service === sv.category.name
                      ? "border-orange-400 bg-orange-50 text-orange-700"
                      : "border-gray-200 hover:border-orange-300 text-gray-700"
                  }`}
                >
                  {sv.category.name}
                </button>
              )) : (
                <p className="text-gray-400 text-sm">{b.noServices}</p>
              )}
            </div>
            <button
              onClick={() => { setService(""); setStep("date"); }}
              className="mt-3 text-xs text-gray-400 hover:text-gray-600 underline"
            >
              {b.continueWithout}
            </button>
          </div>
        )}

        {/* ── Step 2: Date ─────────────────────────────────────────── */}
        {step === "date" && (
          <div>
            {/* Month nav */}
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() => setCalMonth(m => new Date(m.getFullYear(), m.getMonth()-1, 1))}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
              >‹</button>
              <span className="text-sm font-semibold text-gray-800">
                {MONTHS_FR[calMonth.getMonth()]} {calMonth.getFullYear()}
              </span>
              <button
                onClick={() => setCalMonth(m => new Date(m.getFullYear(), m.getMonth()+1, 1))}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
              >›</button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 mb-1">
              {DAYS_FR.map(d => (
                <div key={d} className="text-center text-xs text-gray-400 font-medium py-1">{d}</div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-0.5">
              {cells.map((d, i) => {
                if (!d) return <div key={i} />;
                const isPast  = d < today;
                const isSel   = selectedDate ? formatDate(d) === formatDate(selectedDate) : false;
                const isToday = formatDate(d) === formatDate(today);
                return (
                  <button
                    key={i}
                    disabled={isPast}
                    onClick={() => { setSelectedDate(d); setStep("slot"); }}
                    className={`aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-all
                      ${isSel    ? "bg-orange-500 text-white"          : ""}
                      ${isToday && !isSel ? "border border-orange-300 text-orange-600" : ""}
                      ${isPast   ? "text-gray-200 cursor-not-allowed"  : !isSel ? "hover:bg-orange-50 text-gray-700" : ""}
                    `}
                  >
                    {d.getDate()}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Step 3: Slot ─────────────────────────────────────────── */}
        {step === "slot" && (
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-1">
              {selectedDate ? formatDateFr(selectedDate) : ""}
            </p>
            {loadingSlots && (
              <p className="text-gray-400 text-sm mt-4 text-center">Chargement des créneaux…</p>
            )}
            {!loadingSlots && closedDay && (
              <div className="mt-4 text-center">
                <p className="text-gray-500 text-sm">{b.closedDay}</p>
                <button onClick={() => setStep("date")} className="mt-3 text-sm text-orange-500 hover:underline">
                  {b.chooseAnotherDate}
                </button>
              </div>
            )}
            {!loadingSlots && !closedDay && slots.length === 0 && (
              <div className="mt-4 text-center">
                <p className="text-gray-500 text-sm">{b.noSlots}</p>
                <button onClick={() => setStep("date")} className="mt-3 text-sm text-orange-500 hover:underline">
                  {b.chooseAnotherDate}
                </button>
              </div>
            )}
            {!loadingSlots && slots.length > 0 && (
              <>
                <p className="text-xs text-gray-400 mb-3">{b.selectSlot}</p>
                <div className="grid grid-cols-3 gap-2">
                  {slots.map(s => (
                    <button
                      key={s}
                      onClick={() => { setSelectedSlot(s); setStep("info"); }}
                      className={`py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                        selectedSlot === s
                          ? "border-orange-400 bg-orange-500 text-white"
                          : "border-gray-200 hover:border-orange-300 hover:bg-orange-50 text-gray-700"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Step 4: Info ─────────────────────────────────────────── */}
        {step === "info" && (
          <div className="space-y-3">
            {/* Summary */}
            <div className="bg-orange-50 rounded-xl p-3 border border-orange-100 text-xs text-orange-700 mb-4">
              {service && <p>🔧 <strong>{service}</strong></p>}
              <p>📅 <strong>{selectedDate ? formatDateFr(selectedDate) : ""}</strong> à <strong>{selectedSlot}</strong></p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">{b.fullName}</label>
              <input className={inputCls} value={name} onChange={e=>setName(e.target.value)} placeholder="Jean Tremblay" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">{b.phone}</label>
              <input className={inputCls} type="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="(514) 555-0100" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">{b.email}</label>
              <input className={inputCls} type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="jean@exemple.com" />
            </div>

            {/* Véhicule — dropdown si l'utilisateur en a, sinon champs libres */}
            {userVehicles.length > 0 ? (
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">{b.vehicle}</label>
                <select
                  className={inputCls}
                  value={selectedVehicleId}
                  onChange={e => {
                    const id = e.target.value;
                    setSelectedVehicleId(id);
                    if (!id) { setVehicleYear(""); setVehicleMake(""); setVehicleModel(""); return; }
                    const v = userVehicles.find(v => v.id === id);
                    if (v) { setVehicleYear(String(v.year)); setVehicleMake(v.make); setVehicleModel(v.model); }
                  }}
                >
                  <option value="">{b.noVehicle}</option>
                  {userVehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.year} {v.make} {v.model}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">{b.year}</label>
                  <input className={inputCls} value={vehicleYear} onChange={e=>setVehicleYear(e.target.value)} placeholder="2020" maxLength={4} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">{b.make}</label>
                  <input className={inputCls} value={vehicleMake} onChange={e=>setVehicleMake(e.target.value)} placeholder="Toyota" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">{b.model}</label>
                  <input className={inputCls} value={vehicleModel} onChange={e=>setVehicleModel(e.target.value)} placeholder="Camry" />
                </div>
              </div>
            )}

            {error && (
              <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}

            <button
              onClick={handleSubmit}
              disabled={submitting || !name || !phone}
              className="w-full py-3 rounded-xl font-bold text-white text-sm transition hover:opacity-90 disabled:opacity-50 mt-2"
              style={{ backgroundColor: "#f97316" }}
            >
              {submitting ? b.submitting : b.confirm}
            </button>
            <p className="text-xs text-center text-gray-400">
              {b.garageConfirm}
            </p>
          </div>
        )}
      </div>

      {/* Back button */}
      {step !== "service" && (step as string) !== "done" && (
        <div className="px-5 pb-4">
          <button
            onClick={() => {
              const order: Step[] = ["service","date","slot","info"];
              const idx = order.indexOf(step);
              if (idx > 0) setStep(order[idx-1]);
            }}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            {b.back}
          </button>
        </div>
      )}
    </div>
  );
}
