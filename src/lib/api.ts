import { API_URL } from "@/lib/config";
import { GABARITO_OFICIAL, SEED_TERCEIROS } from "@/data/gabarito";
import type { Gabarito, Palpite } from "@/lib/scoring";
import type { Chaveamento, MataPalpite } from "@/lib/mata";
import type { PalpiteRow } from "@/lib/ranking";

// Estado completo vindo do Apps Script (GET).
export type State = { palpites: PalpiteRow[]; gabarito: Gabarito; chaveamento: Chaveamento };

function ensureConfigured() {
  if (!API_URL) {
    throw new Error(
      "Backend não configurado (NEXT_PUBLIC_API_URL vazio). Configure a URL do Apps Script.",
    );
  }
}

// Lê todos os palpites + gabarito + chaveamento (tolerante a campos ausentes).
export async function getState(): Promise<State> {
  ensureConfigured();
  const res = await fetch(API_URL, { method: "GET" });
  if (!res.ok) throw new Error("Falha ao carregar os dados.");
  const data = await res.json();
  const ch = data?.chaveamento ?? {};
  const rows: PalpiteRow[] = Array.isArray(data?.palpites)
    ? data.palpites.map((p: Record<string, unknown>) => ({
        userId: String(p.userId ?? ""),
        nome: String(p.nome ?? ""),
        enviadoEm: String(p.enviadoEm ?? ""),
        palpite: (p.palpite as Palpite) ?? {},
        mata: (p.mata as MataPalpite) ?? {},
        enviadoMataEm: String(p.enviadoMataEm ?? ""),
      }))
    : [];
  // Gabarito: base é o oficial embutido; a planilha sobrescreve POR GRUPO quando
  // preenchida (assim, quando a aba `gabarito` voltar a ser usada, ela vence).
  const gabarito: Gabarito = { ...GABARITO_OFICIAL, ...(data?.gabarito ?? {}) };
  // Seeding dos terceiros (T1..T8) embutido; a planilha sobrescreve por slot.
  return {
    palpites: rows,
    gabarito,
    chaveamento: {
      seeding: { ...SEED_TERCEIROS, ...(ch.seeding ?? {}) },
      resultados: ch.resultados ?? {},
    },
  };
}

// Salva (cria/atualiza) o palpite de GRUPOS de um usuário.
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

// Salva (cria/atualiza) o palpite do MATA-MATA de um usuário.
export async function saveMata(input: {
  userId: string;
  nome: string;
  mata: MataPalpite;
  submit: boolean;
}): Promise<{ ok?: boolean; error?: string }> {
  ensureConfigured();
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "content-type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action: "saveMata", ...input }),
  });
  if (!res.ok) throw new Error(`Falha ao salvar (HTTP ${res.status}).`);
  return res.json();
}
