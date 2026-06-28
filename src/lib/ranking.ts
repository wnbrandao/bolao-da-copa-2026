import {
  score,
  gabaritoToPositions,
  gabaritoApurado,
  contaGruposApurados,
  type Gabarito,
  type Palpite,
} from "@/lib/scoring";
import { scoreMata, type Chaveamento, type MataPalpite } from "@/lib/mata";

export type PalpiteRow = {
  userId: string;
  nome: string;
  enviadoEm: string;
  palpite: Palpite;
  mata?: MataPalpite;
  enviadoMataEm?: string;
};

export type RankEntry = { userId: string; nome: string; pontos: number };

export type CombinedEntry = {
  userId: string;
  nome: string;
  grupos: number;
  mata: number;
  total: number;
};

// Ranking PARCIAL da fase de grupos, ordenado por pontos (desc), desempate por
// nome. Pontua os grupos já apurados (4 colocados) — vai crescendo conforme os
// grupos fecham. Retorna null só enquanto nenhum grupo saiu ainda.
export function computeRanking(
  palpites: PalpiteRow[],
  gabarito: Gabarito,
): RankEntry[] | null {
  if (contaGruposApurados(gabarito) === 0) return null;
  const official = gabaritoToPositions(gabaritoApurado(gabarito));
  const entries = palpites
    .filter((p) => p.enviadoEm)
    .map((p) => ({ userId: p.userId, nome: p.nome, pontos: score(p.palpite, official) }));
  entries.sort((a, b) => b.pontos - a.pontos || a.nome.localeCompare(b.nome));
  return entries;
}

// Ranking combinado (grupos + mata), NÃO bloqueante:
// - grupos: pontua PARCIAL, só os grupos já apurados, para quem enviou; senão 0.
// - mata: pontua quem enviou o mata, parcial conforme o chaveamento enche; senão 0.
export function computeCombined(
  palpites: PalpiteRow[],
  gabarito: Gabarito,
  chaveamento: Chaveamento,
): CombinedEntry[] {
  const official = gabaritoToPositions(gabaritoApurado(gabarito));
  const entries = palpites
    .filter((p) => p.enviadoEm || p.enviadoMataEm)
    .map((p) => {
      const grupos = p.enviadoEm ? score(p.palpite, official) : 0;
      const mata = p.enviadoMataEm ? scoreMata(p.mata ?? {}, chaveamento) : 0;
      return { userId: p.userId, nome: p.nome, grupos, mata, total: grupos + mata };
    });
  entries.sort((a, b) => b.total - a.total || a.nome.localeCompare(b.nome));
  return entries;
}
