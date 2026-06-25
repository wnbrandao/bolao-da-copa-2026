"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
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
        // Fora de "em-breve" precisa de identidade pra palpitar / ver o próprio bracket.
        if (fase !== "em-breve" && (!userId || !nome)) {
          router.replace("/");
          return;
        }
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
        if (fase !== "em-breve" && (!userId || !nome)) {
          router.replace("/");
          return;
        }
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
  }, [router]);

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
