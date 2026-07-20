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

function normalizeName(nome: string): string {
  return nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

// O identificador fica no localStorage. Se alguém trocar de navegador/celular,
// pode gerar outro UUID e enviar só o mata. Junta apenas esse caso complementar
// ao palpite de grupos com o mesmo nome; dois palpites completos nunca se misturam.
export function consolidatePalpites(palpites: PalpiteRow[]): PalpiteRow[] {
  const groupRowsByName = new Map<string, number[]>();
  const mergedMataRows = new Set<number>();
  const merged = new Map<number, PalpiteRow>();

  palpites.forEach((p, i) => {
    if (!p.enviadoEm || p.enviadoMataEm) return;
    const key = normalizeName(p.nome);
    const candidates = groupRowsByName.get(key) ?? [];
    candidates.push(i);
    groupRowsByName.set(key, candidates);
  });

  palpites.forEach((p, i) => {
    if (p.enviadoEm || !p.enviadoMataEm) return;
    const candidates = groupRowsByName.get(normalizeName(p.nome)) ?? [];
    // Não tenta adivinhar quando há homônimos com palpite de grupos.
    if (candidates.length !== 1) return;

    const groupRowIndex = candidates[0];
    const groupRow = palpites[groupRowIndex];
    merged.set(groupRowIndex, {
      ...groupRow,
      mata: p.mata,
      enviadoMataEm: p.enviadoMataEm,
    });
    mergedMataRows.add(i);
  });

  return palpites.flatMap((p, i) => {
    if (mergedMataRows.has(i)) return [];
    return [merged.get(i) ?? p];
  });
}

// Ranking PARCIAL da fase de grupos, ordenado por pontos (desc), desempate por
// nome. Pontua os grupos já apurados (4 colocados) — vai crescendo conforme os
// grupos fecham. Retorna null só enquanto nenhum grupo saiu ainda.
export function computeRanking(
  palpites: PalpiteRow[],
  gabarito: Gabarito,
): RankEntry[] | null {
  if (contaGruposApurados(gabarito) === 0) return null;
  const official = gabaritoToPositions(gabaritoApurado(gabarito));
  const entries = consolidatePalpites(palpites)
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
  const entries = consolidatePalpites(palpites)
    .filter((p) => p.enviadoEm || p.enviadoMataEm)
    .map((p) => {
      const grupos = p.enviadoEm ? score(p.palpite, official) : 0;
      const mata = p.enviadoMataEm ? scoreMata(p.mata ?? {}, chaveamento) : 0;
      return { userId: p.userId, nome: p.nome, grupos, mata, total: grupos + mata };
    });
  entries.sort((a, b) => b.total - a.total || a.nome.localeCompare(b.nome));
  return entries;
}
