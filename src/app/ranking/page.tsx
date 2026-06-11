"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getState } from "@/lib/api";
import { computeRanking, type RankEntry, type PalpiteRow } from "@/lib/ranking";
import { BOLOES, BOLAO_BY_USER, type Bolao } from "@/data/grupos";
import type { Gabarito } from "@/lib/scoring";

export default function RankingPage() {
  const [phase, setPhase] = useState<"loading" | "ready" | "error">("loading");
  const [palpites, setPalpites] = useState<PalpiteRow[]>([]);
  const [gabarito, setGabarito] = useState<Gabarito>({});
  const [bolao, setBolao] = useState<Bolao>(BOLOES[0]);
  const [errMsg, setErrMsg] = useState("");

  useEffect(() => {
    let alive = true;
    getState()
      .then((s) => {
        if (!alive) return;
        setPalpites(s.palpites);
        setGabarito(s.gabarito);
        setPhase("ready");
      })
      .catch((e) => {
        if (!alive) return;
        setErrMsg(e instanceof Error ? e.message : "Falha ao carregar.");
        setPhase("error");
      });
    return () => {
      alive = false;
    };
  }, []);

  // Cada aba mostra só os participantes do bolão selecionado.
  const doBolao = palpites.filter((p) => (BOLAO_BY_USER[p.userId] ?? []).includes(bolao));
  const ranking = computeRanking(doBolao, gabarito);
  const enviados = doBolao
    .filter((p) => p.enviadoEm)
    .sort((a, b) => a.nome.localeCompare(b.nome));

  return (
    <main className="flex-1 flex flex-col px-5 py-8">
      <header className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Ranking</h1>
        <Link href="/" className="text-sm text-neutral-400 underline">
          Início
        </Link>
      </header>

      <div className="mb-6 flex gap-2">
        {BOLOES.map((b) => (
          <button
            key={b}
            type="button"
            onClick={() => setBolao(b)}
            className={`flex-1 rounded-lg px-3 py-2.5 text-xs font-semibold leading-snug ${
              b === bolao
                ? "bg-emerald-500 text-black"
                : "border border-neutral-800 bg-neutral-900 text-neutral-300"
            }`}
          >
            {b}
          </button>
        ))}
      </div>

      {phase === "loading" && <p className="text-sm text-neutral-400">Carregando…</p>}

      {phase === "error" && (
        <div className="rounded-lg border border-red-800/60 bg-red-950/30 p-4 text-sm text-red-300">
          Não consegui carregar o ranking ({errMsg}).
        </div>
      )}

      {phase === "ready" && (ranking === null ? <Aguardando enviados={enviados} /> : <Tabela ranking={ranking} />)}
    </main>
  );
}

function Aguardando({ enviados }: { enviados: PalpiteRow[] }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-lg border border-amber-800/60 bg-amber-950/30 p-4 text-sm text-amber-300">
        O ranking aparece quando todos os 12 grupos forem encerrados e o gabarito oficial
        estiver completo.
      </div>
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-400">
          Palpites enviados ({enviados.length})
        </h2>
        {enviados.length === 0 ? (
          <p className="text-sm text-neutral-500">Ninguém enviou palpite ainda.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {enviados.map((p) => (
              <li key={p.userId}>
                <Link
                  href={`/ver/?u=${p.userId}`}
                  className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm"
                >
                  <span className="font-medium">{p.nome}</span>
                  <span className="text-neutral-500">ver palpite →</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Tabela({ ranking }: { ranking: RankEntry[] }) {
  if (ranking.length === 0) {
    return <p className="text-sm text-neutral-500">Nenhum palpite enviado.</p>;
  }
  return (
    <ol className="flex flex-col gap-2">
      {ranking.map((r, i) => (
        <li key={r.userId}>
          <Link
            href={`/ver/?u=${r.userId}`}
            className="flex items-center gap-3 rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3"
          >
            <span
              className={`w-6 text-center text-sm font-bold tabular-nums ${
                i === 0 ? "text-amber-400" : "text-neutral-500"
              }`}
            >
              {i + 1}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm font-medium">{r.nome}</span>
            <span className="text-sm font-semibold text-emerald-400 tabular-nums">
              {r.pontos} pts
            </span>
          </Link>
        </li>
      ))}
    </ol>
  );
}
