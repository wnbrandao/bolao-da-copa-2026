// URL do Apps Script Web App (backend no Google Sheets). Pública por natureza
// (roda no browser). Fixada aqui como padrão porque a republicação do Apps Script
// pode gerar uma URL /exec nova — assim o app sempre fala com a versão atual (a que
// tem a action `saveMata`), sem depender da variável NEXT_PUBLIC_API_URL poder estar
// desatualizada. Se a env estiver definida (testes / .env local), ela tem prioridade.
const API_URL_PADRAO =
  "https://script.google.com/macros/s/AKfycbyDd5VUNoBMxCpM37fqrtrgwGXYWyf9160fFWjgvupMUdxRMjiNIoYIOL5LBMRMBmQ6fg/exec";
export const API_URL = process.env.NEXT_PUBLIC_API_URL || API_URL_PADRAO;

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
// "encerrada": o mata-mata começou — palpites TRAVADOS. Os brackets já enviados
// ficam só leitura e a pontuação continua somando conforme os resultados (results)
// entram. Nada é apagado. (Estava "aberta" durante a janela de palpites.)
export const MATA_FASE: "auto" | "em-breve" | "aberta" | "encerrada" = "encerrada";
