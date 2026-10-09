import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fundsQuery, profileQuery } from "@/lib/data";
import { matchFunds, totalOf } from "@/lib/matching";
import { loadSituation, type Situation } from "@/lib/options";

export function useSituation() {
  const [s, setS] = useState<Situation>({ items: [] });
  useEffect(() => {
    const read = () => setS(loadSituation());
    read();
    window.addEventListener("gg-situation", read);
    return () => window.removeEventListener("gg-situation", read);
  }, []);
  return s;
}

export function useMatches() {
  const { data: profile, isLoading: pl } = useQuery(profileQuery);
  const { data: funds = [], isLoading: fl } = useQuery(fundsQuery);
  const situation = useSituation();
  const answers = profile?.answers ?? null;
  const matches = useMemo(() => (answers ? matchFunds(funds, answers, situation) : []), [funds, answers, situation]);
  return { loading: pl || fl, profile, answers, funds, situation, matches, total: totalOf(matches) };
}
