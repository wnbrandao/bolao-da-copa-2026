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

// Resultado OFICIAL do mata-mata da Copa 2026 — o SLOT vencedor de cada confronto
// (matchId → slot), nunca a sigla. Fonte: resultados reais (Wikipedia "2026 FIFA
// World Cup knockout stage" + noticiário). Campeã: Espanha (bateu a Argentina 1–0
// na final); Inglaterra em 3º (bateu a França). Todo slot aqui é competidor válido
// do seu confronto (ver bracket.ts) — checado no teste gabarito.test.ts.
//
// Precedência: base é este embutido; a aba `chaveamento` da planilha sobrescreve
// POR CONFRONTO quando preenchida (merge em getState, src/lib/api.ts).
export const RESULTADOS_OFICIAIS: Record<string, string> = {
  // 16-avos (M32): quem passou. Ex.: RSA×CAN → CAN(2B).
  M32_1: "2B", //  RSA × CAN  → Canadá
  M32_2: "T1", //  GER × PAR  → Paraguai (pênaltis)
  M32_3: "2C", //  NED × MAR  → Marrocos
  M32_4: "1C", //  BRA × JPN  → Brasil
  M32_5: "1I", //  FRA × SWE  → França
  M32_6: "2I", //  CIV × NOR  → Noruega
  M32_7: "1A", //  MEX × ECU  → México
  M32_8: "1L", //  ENG × COD  → Inglaterra
  M32_9: "1D", //  USA × BIH  → EUA
  M32_10: "1G", // BEL × SEN  → Bélgica
  M32_11: "2K", // POR × CRO  → Portugal
  M32_12: "1H", // ESP × AUT  → Espanha
  M32_13: "1B", // SUI × ALG  → Suíça
  M32_14: "1J", // ARG × CPV  → Argentina
  M32_15: "1K", // COL × GHA  → Colômbia
  M32_16: "2G", // AUS × EGY  → Egito (pênaltis)
  // Oitavas (M16)
  M16_1: "1I", // PAR × FRA  → França
  M16_2: "2C", // CAN × MAR  → Marrocos
  M16_3: "2I", // BRA × NOR  → Noruega (Brasil eliminado)
  M16_4: "1L", // MEX × ENG  → Inglaterra
  M16_5: "1H", // POR × ESP  → Espanha
  M16_6: "1G", // USA × BEL  → Bélgica
  M16_7: "1J", // ARG × EGY  → Argentina
  M16_8: "1B", // SUI × COL  → Suíça
  // Quartas (M8)
  M8_1: "1I", // FRA × MAR  → França
  M8_2: "1L", // NOR × ENG  → Inglaterra
  M8_3: "1H", // ESP × BEL  → Espanha
  M8_4: "1J", // ARG × SUI  → Argentina
  // Semis (M4)
  M4_1: "1H", // FRA × ESP  → Espanha
  M4_2: "1J", // ENG × ARG  → Argentina
  // Final (M2) e disputa de 3º (M3P)
  M2_1: "1H", //  ESP × ARG  → 🏆 Espanha campeã
  M3P_1: "1L", // FRA × ENG  → Inglaterra (3º lugar)
};
