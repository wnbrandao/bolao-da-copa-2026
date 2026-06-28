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

// Fase do mata-mata. "auto" = abre sozinho quando o seeding fica completo (32
// slots) — gabarito dos grupos + os 8 melhores terceiros; senão fica em "em-breve"
// (prévia read-only). Use "encerrada" pra travar a UI quando o mata-mata começar;
// "em-breve"/"aberta" forçam o estado manualmente.
//
// FORÇADO "aberta": a fase de grupos acabou, então o chaveamento está liberado pra
// galera chutar. Os 24 slots de 1º/2º mostram as seleções (vêm do gabarito); os 8
// terceiros aparecem com o rótulo do grupo ("3º [A/B/C/D/F]") até o seeding dos
// T1..T8 ser preenchido — o palpite e a pontuação são por SLOT, então já funciona.
export const MATA_FASE: "auto" | "em-breve" | "aberta" | "encerrada" = "aberta";
