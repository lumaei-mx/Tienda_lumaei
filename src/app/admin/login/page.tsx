"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      router.push("/admin");
      router.refresh();
    } else {
      setErr("Contraseña incorrecta");
    }
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-2xl border border-gold/25 bg-ivory p-8 shadow-sm"
      >
        <h1 className="font-serif text-2xl font-semibold text-brown">
          Admin · Lumaei
        </h1>
        <p className="mt-1 text-sm text-brown-soft">Ingresa la contraseña</p>
        <input
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-5 w-full rounded-xl border border-gold/30 bg-white px-3 py-2.5 outline-none ring-gold focus:ring-2"
          placeholder="••••••••"
        />
        {err && <p className="mt-3 text-sm text-red-700">{err}</p>}
        <button
          type="submit"
          className="mt-5 w-full rounded-full bg-brown py-2.5 text-sm font-semibold text-ivory hover:bg-gold-dark"
        >
          Entrar
        </button>
      </form>
    </div>
  );
}
