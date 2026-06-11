"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Flag from "@/components/Flag";
import CopyMessage from "@/components/CopyMessage";
import { GROUPS, TEAM_BY_CODE } from "@/data/teams";
import { getState } from "@/lib/api";
import { APOSTAS_ENCERRADAS } from "@/lib/config";
import {
  gabaritoToPositions,
  isGabaritoCompleto,
  POINTS_EXACT,
  type Gabarito,
  type Palpite,
} from "@/lib/scoring";

export default function VerPage() {
  return (
    <Suspense
      fallback={
        <main className="flex-1 flex items-center justify-center p-8 text-sm text-neutral-400">
          Carregando…
        </main>
      }
    >
      <VerPalpite />
    </Suspense>
  );
}

function VerPalpite() {
  const userId = useSearchParams().get("u") ?? "";
  const [phase, setPhase] = useState<"loading" | "ready" | "notfound" | "error">("loading");
  const [nome, setNome] = useState("");
  const [palpite, setPalpite] = useState<Palpite>({});
  const [gabarito, setGabarito] = useState<Gabarito>({});

  useEffect(() => {
    if (!userId) {
      setPhase("notfound");
      return;
    }
    let alive = true;
    getState()
      .then((s) => {
        if (!alive) return;
        const u = s.palpites.find((p) => p.userId === userId && p.enviadoEm);
        if (!u) {
          setPhase("notfound");
          return;
        }
        setNome(u.nome);
        setPalpite(u.palpite ?? {});
        setGabarito(s.gabarito ?? {});
        setPhase("ready");
      })
      .catch(() => alive && setPhase("error"));
    return () => {
      alive = false;
    };
  }, [userId]);

  if (phase === "loading") {
    return (
      <main className="flex-1 flex items-center justify-center p-8 text-sm text-neutral-400">
        Carregando…
      </main>
    );
  }

  if (phase === "notfound" || phase === "error") {
    return (
      <main className="flex-1 flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
        <div className="text-5xl">🤷</div>
        <h1 className="text-xl font-bold">
          {phase === "error" ? "Erro ao carregar" : "Palpite não encontrado"}
        </h1>
        <p className="text-sm text-neutral-400">
          {phase === "error"
            ? "Tente de novo daqui a pouco."
            : "Esse palpite não existe ou ainda não foi enviado."}
        </p>
        <Link href="/ranking" className="text-sm text-emerald-400 underline">
          Voltar ao ranking
        </Link>
      </main>
    );
  }

  const temGabarito = isGabaritoCompleto(gabarito);
  const oficial = gabaritoToPositions(gabarito);
  const acertos = Object.keys(palpite).filter((c) => oficial[c] === palpite[c]).length;
  const pontos = acertos * POINTS_EXACT;

  return (
    <main className="flex-1 flex flex-col px-5 py-8">
      <header className="mb-5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold tracking-tight">{nome}</h1>
          {temGabarito ? (
            <p className="text-sm text-neutral-400">
              <span className="font-semibold text-emerald-400">{pontos} pts</span>
              <span className="text-neutral-500"> · {acertos}/48 posições exatas</span>
            </p>
          ) : (
            <p className="text-sm text-neutral-500">Aguardando resultados oficiais</p>
          )}
        </div>
        <Link href="/ranking" className="shrink-0 text-sm text-neutral-400 underline">
          Ranking
        </Link>
      </header>

      <div className="flex flex-col gap-2">
        {!APOSTAS_ENCERRADAS && (
          <Link
            href="/"
            className="flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-3 text-base font-semibold text-black"
          >
            ⚽ Faz o seu palpite
          </Link>
        )}
        <CopyMessage userId={userId} />
      </div>

      <div className="mt-6 flex flex-col gap-5">
        {GROUPS.map((g) => {
          const codes = Object.keys(palpite)
            .filter((c) => TEAM_BY_CODE[c]?.group === g)
            .sort((a, b) => palpite[a] - palpite[b]);
          if (codes.length === 0) return null;
          return (
            <section key={g} className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-3">
              <h2 className="mb-2 text-sm font-semibold text-neutral-200">Grupo {g}</h2>
              <ul className="flex flex-col gap-1.5">
                {codes.map((c) => {
                  const team = TEAM_BY_CODE[c];
                  const pos = palpite[c];
                  const hit = temGabarito && oficial[c] === pos;
                  const advances = pos <= 2;
                  return (
                    <li
                      key={c}
                      className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-sm ${
                        hit ? "border-emerald-700 bg-emerald-950/40" : "border-neutral-800 bg-neutral-900"
                      }`}
                    >
                      <span
                        className={`w-5 text-center text-sm font-bold tabular-nums ${
                          advances ? "text-emerald-400" : "text-neutral-500"
                        }`}
                      >
                        {pos}º
                      </span>
                      <Flag code={team.flag} />
                      <span className="min-w-0 flex-1 truncate font-medium">{team.nome}</span>
                      {hit && <span className="text-xs text-emerald-400">✓</span>}
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </main>
  );
}
