import {
  score,
  gabaritoToPositions,
  isGabaritoCompleto,
  type Gabarito,
  type Palpite,
} from "@/lib/scoring";

export type PalpiteRow = {
  userId: string;
  nome: string;
  enviadoEm: string;
  palpite: Palpite;
};

export type RankEntry = { userId: string; nome: string; pontos: number };

// Ranking ordenado por pontos (desc), desempate por nome.
// Retorna null enquanto o gabarito não estiver completo (12 grupos).
export function computeRanking(
  palpites: PalpiteRow[],
  gabarito: Gabarito,
): RankEntry[] | null {
  if (!isGabaritoCompleto(gabarito)) return null;
  const official = gabaritoToPositions(gabarito);
  const entries = palpites
    .filter((p) => p.enviadoEm)
    .map((p) => ({ userId: p.userId, nome: p.nome, pontos: score(p.palpite, official) }));
  entries.sort((a, b) => b.pontos - a.pontos || a.nome.localeCompare(b.nome));
  return entries;
}
