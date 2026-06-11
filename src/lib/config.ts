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
