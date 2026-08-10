"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import type { Alert } from "@/lib/automation/alert";

export function AlertsPanel() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [msg, setMsg] = useState("");

  async function load() {
    const res = await fetch("/api/admin/alerts");
    const d = await res.json();
    setAlerts(d.alerts || []);
  }

  useEffect(() => {
    load().catch(() => setMsg("Error cargando alertas"));
  }, []);

  const badge = (level: Alert["level"]) =>
    level === "critical"
      ? "bg-red-100 text-red-800"
      : level === "warn"
      ? "bg-amber-100 text-amber-900"
      : "bg-gold/20 text-gold-dark";

  return (
    <div className="rounded-2xl border border-gold/20 bg-ivory p-6">
      <div className="flex items-center gap-2">
        <Bell size={18} strokeWidth={1.5} />
        <h2 className="font-serif text-2xl font-semibold text-brown">Alertas</h2>
        {alerts.some((a) => !a.resolved) && (
          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-800">
            {alerts.filter((a) => !a.resolved).length} activas
          </span>
        )}
      </div>
      {msg && <p className="mt-2 text-sm text-gold-dark">{msg}</p>}
      <ul className="mt-4 space-y-2">
        {alerts.length === 0 && <li className="text-sm text-brown-soft">Sin alertas.</li>}
        {alerts.map((a) => (
          <li
            key={a.id}
            className={`flex items-start justify-between gap-3 rounded-xl border px-3 py-2 text-sm ${
              a.resolved ? "border-gold/10 opacity-60" : "border-gold/25 bg-cream"
            }`}
          >
            <div>
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold uppercase ${badge(a.level)}`}>
                  {a.level}
                </span>
                <span className="font-mono text-[11px] text-brown-soft">{a.kind}</span>
              </div>
              <p className="mt-1 whitespace-pre-line text-brown">{a.message}</p>
              <p className="text-[11px] text-brown-soft">
                {new Date(a.createdAt).toLocaleString()}
              </p>
            </div>
            {!a.resolved && (
              <button
                type="button"
                onClick={async () => {
                  await fetch(`/api/admin/alerts/${a.id}`, { method: "DELETE" });
                  load();
                }}
                className="shrink-0 rounded-full border border-gold/30 px-3 py-1 text-xs font-semibold text-brown-soft hover:text-brown"
              >
                Resolver
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
