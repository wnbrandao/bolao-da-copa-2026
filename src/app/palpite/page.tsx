"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getStored } from "@/lib/identity";
import { getState } from "@/lib/api";
import type { Palpite } from "@/lib/scoring";
import PalpiteBoard from "./PalpiteBoard";

type Loaded = {
  userId: string;
  nome: string;
  palpite: Palpite;
  submitted: boolean;
};

export default function PalpitePage() {
  const router = useRouter();
  const [phase, setPhase] = useState<"loading" | "ready" | "error">("loading");
  const [data, setData] = useState<Loaded | null>(null);
  const [errMsg, setErrMsg] = useState<string>("");

  useEffect(() => {
    const { userId, nome } = getStored();
    if (!userId || !nome) {
      router.replace("/");
      return;
    }
    let alive = true;
    getState()
      .then((s) => {
        if (!alive) return;
        const mine = s.palpites.find((p) => p.userId === userId);
        setData({
          userId,
          nome,
          palpite: mine?.palpite ?? {},
          submitted: !!mine?.enviadoEm,
        });
        setPhase("ready");
      })
      .catch((e) => {
        if (!alive) return;
        // Sem conseguir carregar, ainda deixa palpitar do zero (save avisa se falhar).
        setErrMsg(e instanceof Error ? e.message : "Falha ao carregar.");
        setData({ userId, nome, palpite: {}, submitted: false });
        setPhase("error");
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
    <>
      {phase === "error" && (
        <div className="mx-4 mt-4 rounded-lg border border-amber-800/60 bg-amber-950/30 p-3 text-xs text-amber-300">
          Não consegui carregar do servidor ({errMsg}). Você pode montar o palpite, mas o
          envio só funciona com o backend configurado.{" "}
          <Link href="/" className="underline">
            voltar
          </Link>
        </div>
      )}
      <PalpiteBoard
        userId={data.userId}
        nome={data.nome}
        submitted={data.submitted}
        initialPalpite={data.palpite}
      />
    </>
  );
}
