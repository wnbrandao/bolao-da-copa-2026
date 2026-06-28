"use client";

import { useEffect, useState } from "react";
import { getStored } from "@/lib/identity";
import { getState } from "@/lib/api";
import { MATA_FASE } from "@/lib/config";
import {
  effectiveSeeding,
  isSeedingComplete,
  resolveMataFase,
  type MataFaseResolved,
  type MataPalpite,
} from "@/lib/mata";
import type { SourceId } from "@/data/bracket";
import BracketBoard from "./BracketBoard";

type Loaded = {
  fase: MataFaseResolved;
  userId: string;
  nome: string;
  mata: MataPalpite;
  submitted: boolean;
  seeding: Record<SourceId, string>;
};

export default function MataPage() {
  const [phase, setPhase] = useState<"loading" | "ready">("loading");
  const [data, setData] = useState<Loaded | null>(null);

  useEffect(() => {
    const { userId, nome } = getStored();
    let alive = true;

    getState()
      .then((s) => {
        if (!alive) return;
        const seeding = effectiveSeeding(s.gabarito, s.chaveamento);
        const fase = resolveMataFase(MATA_FASE, isSeedingComplete(seeding));
        // Sem identidade NÃO redireciona (senão cai na home "apostas encerradas").
        // A página carrega read-only e o board mostra como entrar com o nome.
        const mine = s.palpites.find((p) => p.userId === userId);
        setData({
          fase,
          userId: userId ?? "",
          nome: nome ?? "",
          mata: mine?.mata ?? {},
          submitted: !!mine?.enviadoMataEm,
          seeding,
        });
        setPhase("ready");
      })
      .catch(() => {
        if (!alive) return;
        // Backend indisponível: mostra a prévia (placeholders), read-only.
        const fase = resolveMataFase(MATA_FASE, false);
        setData({
          fase,
          userId: userId ?? "",
          nome: nome ?? "",
          mata: {},
          submitted: false,
          seeding: {},
        });
        setPhase("ready");
      });

    return () => {
      alive = false;
    };
  }, []);

  if (phase === "loading" || !data) {
    return (
      <main className="flex-1 flex items-center justify-center p-8 text-sm text-neutral-400">
        Carregando…
      </main>
    );
  }

  return (
    <BracketBoard
      fase={data.fase}
      userId={data.userId}
      nome={data.nome}
      initialMata={data.mata}
      submitted={data.submitted}
      seeding={data.seeding}
    />
  );
}
