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
