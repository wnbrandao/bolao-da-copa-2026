import { API_URL } from "@/lib/config";
import type { Gabarito, Palpite } from "@/lib/scoring";
import type { PalpiteRow } from "@/lib/ranking";

// Estado completo vindo do Apps Script (GET).
export type State = { palpites: PalpiteRow[]; gabarito: Gabarito };

function ensureConfigured() {
  if (!API_URL) {
    throw new Error(
      "Backend não configurado (NEXT_PUBLIC_API_URL vazio). Configure a URL do Apps Script.",
    );
  }
}

// Lê todos os palpites + gabarito.
export async function getState(): Promise<State> {
  ensureConfigured();
  const res = await fetch(API_URL, { method: "GET" });
  if (!res.ok) throw new Error("Falha ao carregar os dados.");
  const data = await res.json();
  return {
    palpites: Array.isArray(data?.palpites) ? data.palpites : [],
    gabarito: data?.gabarito ?? {},
  };
}

// Salva (cria/atualiza) o palpite de um usuário.
// POST como text/plain pra evitar preflight CORS no Apps Script.
export async function savePalpite(input: {
  userId: string;
  nome: string;
  palpite: Palpite;
  submit: boolean;
}): Promise<{ ok?: boolean; error?: string }> {
  ensureConfigured();
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "content-type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action: "save", ...input }),
  });
  if (!res.ok) throw new Error(`Falha ao salvar (HTTP ${res.status}).`);
  return res.json();
}
