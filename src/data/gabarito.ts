import type { Gabarito } from "@/lib/scoring";

// Gabarito OFICIAL da fase de grupos da Copa 2026 — classificação final 1º→4º de
// cada grupo (siglas FIFA). Fixado aqui porque a aba `gabarito` da planilha não
// está sendo editada; assim o ranking sai mesmo sem o backend preenchido.
//
// Precedência: a planilha (quando preenchida) sobrescreve POR GRUPO — ver o merge
// em `getState` (src/lib/api.ts). Logo, é só apagar este arquivo (e o merge) quando
// a planilha voltar a ser a fonte da verdade.
export const GABARITO_OFICIAL: Gabarito = {
  A: ["MEX", "RSA", "KOR", "CZE"], // México, África do Sul, Coreia do Sul, Tchéquia
  B: ["SUI", "CAN", "BIH", "QAT"], // Suíça, Canadá, Bósnia, Catar
  C: ["BRA", "MAR", "SCO", "HAI"], // Brasil, Marrocos, Escócia, Haiti
  D: ["USA", "AUS", "PAR", "TUR"], // EUA, Austrália, Paraguai, Turquia
  E: ["GER", "CIV", "ECU", "CUW"], // Alemanha, Costa do Marfim, Equador, Curaçao
  F: ["NED", "JPN", "SWE", "TUN"], // Países Baixos, Japão, Suécia, Tunísia
  G: ["BEL", "EGY", "IRN", "NZL"], // Bélgica, Egito, Irã, Nova Zelândia
  H: ["ESP", "CPV", "URU", "KSA"], // Espanha, Cabo Verde, Uruguai, Arábia Saudita
  I: ["FRA", "NOR", "SEN", "IRQ"], // França, Noruega, Senegal, Iraque
  J: ["ARG", "AUT", "ALG", "JOR"], // Argentina, Áustria, Argélia, Jordânia
  K: ["COL", "POR", "COD", "UZB"], // Colômbia, Portugal, RD Congo, Uzbequistão
  L: ["ENG", "CRO", "GHA", "PAN"], // Inglaterra, Croácia, Gana, Panamá
};

// Seeding dos 8 melhores 3os colocados nos slots T1..T8 (slot → sigla), conforme o
// chaveamento oficial do R32 da Copa 2026. Cada T joga contra um 1º fixo (ver
// bracket.ts): T1×1E(GER), T2×1I(FRA), T3×1A(MEX), T4×1L(ENG), T5×1D(USA),
// T6×1G(BEL), T7×1B(SUI), T8×1K(COL). Os 1º/2º saem do gabarito; só os terceiros
// precisam disto. Fixado aqui porque a aba `chaveamento` da planilha não está sendo
// editada — ela sobrescreve POR SLOT quando preenchida (ver merge em api.ts).
export const SEED_TERCEIROS: Record<string, string> = {
  T1: "PAR", // Paraguai (3º D) × Alemanha
  T2: "SWE", // Suécia (3º F) × França
  T3: "ECU", // Equador (3º E) × México
  T4: "COD", // RD Congo (3º K) × Inglaterra
  T5: "BIH", // Bósnia (3º B) × EUA
  T6: "SEN", // Senegal (3º I) × Bélgica
  T7: "ALG", // Argélia (3º J) × Suíça
  T8: "GHA", // Gana (3º L) × Colômbia
};
