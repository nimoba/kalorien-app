'use client';

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

interface Props {
  onOpenForm: () => void;
  onOpenWeight: () => void;
  onOpenSettings: () => void;
  onOpenSport: () => void;
}

const menuItems = [
  {
    id: "food",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
        <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
        <line x1="6" y1="1" x2="6" y2="4" />
        <line x1="10" y1="1" x2="10" y2="4" />
        <line x1="14" y1="1" x2="14" y2="4" />
      </svg>
    ),
    label: "Essen",
    color: "#6366f1",
    gradient: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
  },
  {
    id: "sport",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="5" r="3" />
        <path d="M12 22v-8" />
        <path d="M5 12h14" />
        <path d="M5 12l3 8" />
        <path d="M19 12l-3 8" />
      </svg>
    ),
    label: "Sport",
    color: "#10b981",
    gradient: "linear-gradient(135deg, #10b981 0%, #34d399 100%)",
  },
  {
    id: "weight",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
    ),
    label: "Gewicht",
    color: "#f59e0b",
    gradient: "linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)",
  },
  {
    id: "settings",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
    label: "Settings",
    color: "#71717a",
    gradient: "linear-gradient(135deg, #52525b 0%, #71717a 100%)",
  },
];

export default function FloatingActionMenu({
  onOpenForm,
  onOpenWeight,
  onOpenSettings,
  onOpenSport,
}: Props) {
  const [open, setOpen] = useState(false);

  const handlers: Record<string, () => void> = {
    food: onOpenForm,
    sport: onOpenSport,
    weight: onOpenWeight,
    settings: onOpenSettings,
  };

  return (
    <>
      {/* Backdrop overlay when menu is open */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0, 0, 0, 0.4)",
              backdropFilter: "blur(4px)",
              WebkitBackdropFilter: "blur(4px)",
              zIndex: 998,
            }}
          />
        )}
      </AnimatePresence>

      <div style={{ position: "fixed", bottom: 104, right: 20, zIndex: 1000 }}>
        {/* Sub-Buttons */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: "absolute",
                bottom: 68,
                right: 0,
                display: "flex",
                flexDirection: "column",
                gap: 12,
                alignItems: "flex-end",
              }}
            >
              {menuItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20, scale: 0.8 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    transition: { delay: index * 0.05 },
                  }}
                  exit={{
                    opacity: 0,
                    y: 20,
                    scale: 0.8,
                    transition: { delay: (menuItems.length - index) * 0.03 },
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  {/* Label tooltip */}
                  <motion.span
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0, transition: { delay: index * 0.05 + 0.1 } }}
                    exit={{ opacity: 0, x: 10 }}
                    style={{
                      background: "rgba(28, 28, 38, 0.95)",
                      padding: "8px 14px",
                      borderRadius: 10,
                      fontSize: 13,
                      fontWeight: 500,
                      color: "#fff",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {item.label}
                  </motion.span>

                  {/* Button */}
                  <motion.button
                    onClick={() => {
                      handlers[item.id]();
                      setOpen(false);
                    }}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 16,
                      background: item.gradient,
                      color: "#fff",
                      border: "none",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: `0 4px 16px ${item.color}50`,
                    }}
                  >
                    {item.icon}
                  </motion.button>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main FAB */}
        <motion.button
          onClick={() => setOpen(!open)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          animate={{
            rotate: open ? 45 : 0,
            boxShadow: open
              ? "0 8px 32px rgba(99, 102, 241, 0.6)"
              : "0 4px 20px rgba(99, 102, 241, 0.4)",
          }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          style={{
            width: 60,
            height: 60,
            borderRadius: 18,
            background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
            color: "#fff",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </motion.button>
      </div>
    </>
  );
}
