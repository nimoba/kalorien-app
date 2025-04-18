import { useEffect, useState } from "react";

export interface Ziele {
  zielKcal: number;
  zielEiweiss: number;
  zielFett: number;
  zielKh: number;
}

export function useZiele(trigger = 0): Ziele {
  const [ziele, setZiele] = useState<Ziele>({
    zielKcal: 2200,
    zielEiweiss: 130,
    zielFett: 70,
    zielKh: 250,
  });

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        setZiele({
          zielKcal: data.zielKcal,
          zielEiweiss: data.zielEiweiss,
          zielFett: data.zielFett,
          zielKh: data.zielKh,
        });
      })
      .catch(() => console.warn("⚠️ Zielwerte konnten nicht geladen werden"));
  }, [trigger]); // 🧠 immer neu laden bei trigger-Änderung

  return ziele;
}
