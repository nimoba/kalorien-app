'use client';

import { useRouter, usePathname } from "next/navigation";

export default function FloatingTabBar() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div style={{
      position: "fixed",
      bottom: 0,
      left: 0,
      right: 0,
      height: 60,
      backgroundColor: "#1e1e1e",
      display: "flex",
      justifyContent: "space-around",
      alignItems: "center",
      borderTop: "1px solid #333",
      zIndex: 900, // unterhalb von Forms
    }}>
      <TabButton
        label="Dashboard"
        emoji="📊"
        active={pathname === "/"}
        onClick={() => router.push("/")}
      />
      <TabButton
        label="Gewicht"
        emoji="📉"
        active={pathname === "/gewicht"}
        onClick={() => router.push("/gewicht")}
      />
    </div>
  );
}

function TabButton({ label, emoji, active, onClick }: {
  label: string;
  emoji: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button onClick={onClick} style={{
      background: "none",
      border: "none",
      color: active ? "#36a2eb" : "#ccc",
      fontSize: 18,
      fontWeight: active ? "bold" : "normal",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      cursor: "pointer",
    }}>
      <span>{emoji}</span>
      <span style={{ fontSize: 12 }}>{label}</span>
    </button>
  );
}
