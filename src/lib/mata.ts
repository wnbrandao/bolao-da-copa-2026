// Lógica do mata-mata — funções PURAS (sem rede), testáveis. Tudo opera sobre
// SLOTS (SourceId), nunca siglas. O seeding em Chaveamento só serve p/ exibir e
// pra resolver o estado da fase.
import {
  BRACKET,
  MATCHES_BY_FASE,
  FASES,
  SOURCES,
  type SourceId,
  type Side,
} from "@/data/bracket";
import type { Gabarito } from "@/lib/scoring";

// Palpite do mata: pra cada confronto, qual SLOT o usuário fez vencer.
// Ex.: { "M32_1": "1A", "M16_1": "1A", ..., "M2_1": "1A"/*campeão*/, "M3P_1": "2F" }
export type MataPalpite = Record<string, SourceId>;

// Resultado oficial: seeding (slot→sigla, só exibição/estado) + vencedores por
// confronto (parcial — preenchido conforme os jogos acontecem).
export type Chaveamento = {
  seeding: Record<SourceId, string>;
  resultados: MataPalpite;
};

// Pontos por CHEGAR a cada fase (= vencer o confronto da fase anterior). Ajustável.
export const PONTOS_MATA = {
  oitavas: 1,
  quartas: 2,
  semis: 3,
  finalista: 5,
  campeao: 8,
  terceiro: 4,
} as const;

// Quanto vale VENCER um confronto de cada fase (o vencedor "chega" à fase seguinte).
const PONTOS_POR_FASE: Record<string, number> = {
  M32: PONTOS_MATA.oitavas,
  M16: PONTOS_MATA.quartas,
  M8: PONTOS_MATA.semis,
  M4: PONTOS_MATA.finalista,
  M2: PONTOS_MATA.campeao,
};

// Resolve um lado do confronto a partir do palpite atual. null se indefinido.
function resolveSide(side: Side, palpite: MataPalpite): SourceId | null {
  if (side.kind === "source") return side.source;
  if (side.kind === "winner") return palpite[side.match] ?? null;
  // loser: o competidor do confronto anterior que NÃO foi escolhido
  const [x, y] = competitors(side.match, palpite);
  const w = palpite[side.match];
  if (!w || !x || !y) return null;
  return w === x ? y : x;
}

// Os dois competidores de um confronto, dado o palpite. null onde indefinido.
export function competitors(
  matchId: string,
  palpite: MataPalpite,
): [SourceId | null, SourceId | null] {
  const m = BRACKET[matchId];
  return [resolveSide(m.a, palpite), resolveSide(m.b, palpite)];
}

// O perdedor de um confronto (usado pela disputa de 3º).
export function loserOf(matchId: string, palpite: MataPalpite): SourceId | null {
  const [x, y] = competitors(matchId, palpite);
  const w = palpite[matchId];
  if (!w || !x || !y) return null;
  return w === x ? y : x;
}

// Remove picks a jusante que ficaram inválidos (slot não é mais competidor).
// Processa raso→fundo, então cada confronto é avaliado já com os ascendentes ok.
export function sanitize(palpite: MataPalpite): MataPalpite {
  const out: MataPalpite = { ...palpite };
  // Inclui M32: poda picks de 16-avos que não sejam mais um dos dois slots-fonte
  // do confronto (ex.: rascunho salvo sob um pareamento antigo) — raso→fundo, então
  // a cascata limpa os dependentes a jusante em seguida.
  for (const fase of ["M32", "M16", "M8", "M4", "M2", "M3P"] as const) {
    for (const id of MATCHES_BY_FASE[fase]) {
      if (!out[id]) continue;
      const [x, y] = competitors(id, out);
      if (out[id] !== x && out[id] !== y) delete out[id];
    }
  }
  return out;
}

export function isMataCompleto(palpite: MataPalpite): boolean {
  return Object.keys(BRACKET).every((id) => Boolean(palpite[id]));
}

// Constrói um bracket completo e consistente (default: vence sempre o 1º
// competidor resolvido). Útil p/ testes e como ponto de partida.
export function fullBracket(): MataPalpite {
  const p: MataPalpite = {};
  for (const fase of FASES) {
    for (const id of MATCHES_BY_FASE[fase]) {
      const [a] = competitors(id, p);
      if (a) p[id] = a;
    }
  }
  return p;
}

// Σ por fase |previstos ∩ oficiais| × pts + bônus 3º se exato. Opera só sobre
// slots, então independe do seeding. Confrontos sem resultado oficial não contam.
export function scoreMata(palpite: MataPalpite, oficial: Chaveamento): number {
  let pts = 0;
  for (const fase of ["M32", "M16", "M8", "M4", "M2"] as const) {
    const previstos = new Set<string>();
    const oficiais = new Set<string>();
    for (const id of MATCHES_BY_FASE[fase]) {
      if (palpite[id]) previstos.add(palpite[id]);
      if (oficial.resultados[id]) oficiais.add(oficial.resultados[id]);
    }
    let hits = 0;
    for (const s of previstos) if (oficiais.has(s)) hits++;
    pts += hits * PONTOS_POR_FASE[fase];
  }
  if (palpite.M3P_1 && palpite.M3P_1 === oficial.resultados.M3P_1) {
    pts += PONTOS_MATA.terceiro;
  }
  return pts;
}

// ===== Seeding (slot → seleção) e estado da fase =====
// Objetivo: você só adiciona o resultado dos grupos (gabarito) + os 8 melhores
// terceiros, e o bracket fica pronto pra preencher.

// Deriva os 24 slots de 1º/2º de cada grupo direto do gabarito (resultado oficial
// dos grupos). Os terceiros (T1..T8) NÃO saem daqui — vêm do chaveamento.seeding.
export function seedFromGabarito(gabarito: Gabarito): Record<SourceId, string> {
  const out: Record<string, string> = {};
  for (const g of Object.keys(gabarito)) {
    const ord = gabarito[g] ?? [];
    if (ord[0]) out[`1${g}`] = ord[0];
    if (ord[1]) out[`2${g}`] = ord[1];
  }
  return out;
}

// Seeding efetivo: 1º/2º do gabarito + o que o admin pôs no chaveamento (T1..T8 e
// quaisquer correções). O chaveamento tem prioridade.
export function effectiveSeeding(
  gabarito: Gabarito,
  ch: Chaveamento,
): Record<SourceId, string> {
  return { ...seedFromGabarito(gabarito), ...ch.seeding };
}

// Seeding completo = os 32 slots têm seleção.
export function isSeedingComplete(seeding: Record<SourceId, string>): boolean {
  return SOURCES.every((s) => Boolean(seeding[s]));
}

export type MataFaseResolved = "em-breve" | "aberta" | "encerrada";

// Resolve a fase efetiva a partir da flag de config + se o seeding está completo.
// "auto": abre sozinho quando o seeding fica completo; senão fica em "em-breve".
export function resolveMataFase(flag: string, seedingCompleto: boolean): MataFaseResolved {
  if (flag === "encerrada") return "encerrada";
  if (flag === "aberta") return "aberta";
  if (flag === "em-breve") return "em-breve";
  return seedingCompleto ? "aberta" : "em-breve"; // "auto"
}
