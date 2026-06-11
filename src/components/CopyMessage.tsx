"use client";

import { useState } from "react";
import { APOSTAS_ENCERRADAS, BASE_PATH } from "@/lib/config";

// Copia a mensagem pronta (com o link público do palpite) pra colar no WhatsApp.
// Não abre o app — só copia. `card` envolve num cartão (usado após enviar).
export default function CopyMessage({ userId, card = false }: { userId: string; card?: boolean }) {
  const [copied, setCopied] = useState(false);

  async function copiar() {
    const url = `${window.location.origin}${BASE_PATH}/ver/?u=${userId}`;
    const msg = APOSTAS_ENCERRADAS
      ? `🏆 Meu palpite no Bolão da Copa 2026! Bora ver quem crava a fase de grupos: ${url}`
      : `🏆 Meu palpite no Bolão da Copa 2026! Faz o seu e bora ver quem crava a fase de grupos: ${url}`;
    try {
      await navigator.clipboard.writeText(msg);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // clipboard indisponível — ignora.
    }
  }

  const botao = (
    <button
      type="button"
      onClick={copiar}
      className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-black"
    >
      <WhatsAppIcon />
      {copied ? "Mensagem copiada ✓" : "Copiar mensagem"}
    </button>
  );

  if (!card) return botao;

  return (
    <div className="rounded-xl border border-emerald-800 bg-emerald-950/40 p-4">
      <p className="text-sm font-medium text-emerald-300">Palpite registrado! 🎉</p>
      <p className="mb-3 mt-1 text-xs text-neutral-400">
        Copie a mensagem e cole no grupo do WhatsApp pra chamar a galera.
      </p>
      {botao}
    </div>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 32 32" width="18" height="18" fill="currentColor" aria-hidden="true">
      <path d="M16.004 0h-.008C7.174 0 .004 7.17.004 16c0 3.5 1.13 6.74 3.05 9.38L1.05 31.4l6.2-1.98A15.9 15.9 0 0 0 16 32c8.83 0 16-7.17 16-16S24.834 0 16.004 0zm9.31 22.6c-.39 1.1-1.94 2.01-3.17 2.28-.84.18-1.94.32-5.64-1.21-4.73-1.96-7.78-6.77-8.02-7.08-.23-.31-1.92-2.56-1.92-4.88s1.22-3.46 1.65-3.93c.36-.39.94-.57 1.5-.57.18 0 .35.01.5.02.43.02.65.04.94.73.36.86 1.23 2.98 1.34 3.2.11.22.18.48.04.79-.13.31-.24.45-.47.71-.23.26-.45.46-.68.74-.21.24-.45.5-.18.96.27.45 1.2 1.98 2.58 3.21 1.78 1.59 3.25 2.08 3.74 2.28.36.15.79.11 1.06-.18.34-.37.76-.99 1.18-1.6.3-.43.68-.49 1.08-.34.41.14 2.59 1.22 3.03 1.44.44.22.73.33.84.51.11.18.11 1.06-.28 2.16z" />
    </svg>
  );
}
