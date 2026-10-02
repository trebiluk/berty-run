import { useEffect, useState } from "react";
import { readAccess, type Lang } from "@/game/access";

export function useLang(): Lang {
  const [lang, setLang] = useState<Lang>("en");
  useEffect(() => {
    const sync = () => setLang(readAccess().lang);
    sync();
    window.addEventListener("br-access", sync);
    return () => window.removeEventListener("br-access", sync);
  }, []);
  return lang;
}
