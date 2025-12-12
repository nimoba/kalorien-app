'use client';

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion } from "framer-motion";

const tabs = [
  { path: "/", label: "Dashboard", icon: "dashboard" },
  { path: "/gewicht", label: "Gewicht", icon: "weight" },
  { path: "/fortschritt", label: "Progress", icon: "camera" },
  { path: "/kuehlschrank", label: "Rezepte", icon: "recipe" },
  { path: "/empfehlung", label: "Empfehlung", icon: "recommend" },
];

// Custom SVG Icons for cleaner look
const icons: Record<string, React.ReactElement> = {
  dashboard: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
  ),
  weight: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v18" />
      <path d="M3 12h18" />
      <path d="M16 6l-4 4-4-4" />
      <path d="M8 18l4-4 4 4" />
    </svg>
  ),
  camera: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  ),
  recipe: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6V13.87Z" />
      <line x1="6" y1="17" x2="18" y2="17" />
    </svg>
  ),
  recommend: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  ),
};

export default function FloatingTabBar() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      style={{
        position: "fixed",
        bottom: 16,
        left: 16,
        right: 16,
        height: 72,
        background: "rgba(22, 22, 29, 0.85)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderRadius: 20,
        display: "flex",
        justifyContent: "space-around",
        alignItems: "center",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
        zIndex: 999,
        padding: "0 8px",
      }}
    >
      {tabs.map((tab) => {
        const active = pathname === tab.path;
        return (
          <TabButton
            key={tab.path}
            label={tab.label}
            icon={icons[tab.icon]}
            active={active}
            onClick={() => router.push(tab.path)}
          />
        );
      })}
    </motion.div>
  );
}

function TabButton({
  label,
  icon,
  active,
  onClick,
}: {
  label: string;
  icon: React.ReactElement;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.9 }}
      style={{
        background: "none",
        border: "none",
        color: active ? "#fff" : "#71717a",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        flex: 1,
        padding: "8px 4px",
        position: "relative",
        gap: 4,
        transition: "color 200ms ease",
      }}
    >
      {/* Active indicator */}
      {active && (
        <motion.div
          layoutId="activeTab"
          style={{
            position: "absolute",
            top: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: 32,
            height: 3,
            background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
            borderRadius: 4,
          }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      )}

      {/* Icon with glow effect when active */}
      <motion.div
        animate={{
          scale: active ? 1.1 : 1,
        }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          filter: active ? "drop-shadow(0 0 8px rgba(99, 102, 241, 0.5))" : "none",
        }}
      >
        {icon}
      </motion.div>

      {/* Label */}
      <motion.span
        animate={{
          opacity: active ? 1 : 0.6,
          y: active ? 0 : 2,
        }}
        style={{
          fontSize: 10,
          fontWeight: active ? 600 : 500,
          letterSpacing: "0.02em",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </motion.span>
    </motion.button>
  );
}
