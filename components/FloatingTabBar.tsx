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
      height: 64,
      backgroundColor: "#1e1e1e",
      display: "flex",
      justifyContent: "space-around",
      alignItems: "center",
      borderTop: "1px solid #333",
      zIndex: 999, // über allem außer FloatingForm
      backdropFilter: "blur(8px)",
      boxShadow: "0 -2px 10px rgba(0,0,0,0.3)",
      paddingBottom: "env(safe-area-inset-bottom)", // für iOS-Support
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
      <TabButton
        label="Fortschritt"
        emoji="📸"
        active={pathname === "/fortschritt"}
        onClick={() => router.push("/fortschritt")}
      />
      <TabButton
        label="Kühlschrank"
        emoji="🍳"
        active={pathname === "/kuehlschrank"}
        onClick={() => router.push("/kuehlschrank")}
      />
      <TabButton
        label="Empfehlung"
        emoji="🍽️"
        active={pathname === "/empfehlung"}
        onClick={() => router.push("/empfehlung")}
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
      flex: 1,
      paddingTop: 6,
    }}>
      <span style={{ fontSize: 22 }}>{emoji}</span>
      <span style={{ fontSize: 12 }}>{label}</span>
    </button>
  );
}