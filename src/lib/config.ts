// URL do Apps Script Web App (backend no Google Sheets). Injetada no build via
// NEXT_PUBLIC_API_URL (variável do GitHub Actions / .env local). Pública por
// natureza (roda no browser).
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

// Caminho base no GitHub Pages (repo de projeto serve em /<repo>/).
// Precisa bater com `basePath` do next.config.ts.
export const BASE_PATH = "/bolao-da-copa-2026";

// Trava de apostas: true = copa começou, UI de palpite desabilitada em todo o
// app (o backend continua aceitando POST; a trava é só de interface).
export const APOSTAS_ENCERRADAS = true;

// Fase do mata-mata. "auto" (padrão) = abre sozinho quando o seeding fica
// completo (32 slots) — ou seja, quando o gabarito dos grupos + os 8 melhores
// terceiros estiverem preenchidos; senão fica em "em-breve" (prévia read-only).
// Use "encerrada" pra travar a UI quando o mata-mata começar; "em-breve"/"aberta"
// forçam o estado manualmente.
export const MATA_FASE: "auto" | "em-breve" | "aberta" | "encerrada" = "auto";
