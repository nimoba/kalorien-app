'use client';

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

interface Props {
  onOpenForm: () => void;
  onOpenSettings: () => void;
}

export default function FloatingActionMenu({ onOpenForm, onOpenSettings }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: "fixed", bottom: 30, right: 30, zIndex: 1000 }}>
      {/* Sub-Buttons */}
      <AnimatePresence>
        {open && (
          <>
            <motion.button
              initial={{ opacity: 0, y: 0 }}
              animate={{ opacity: 1, y: -130 }}
              exit={{ opacity: 0, y: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 25 }}
              onClick={() => {
                onOpenForm();
                setOpen(false);
              }}
              style={subButtonStyle}
            >
              ➕
            </motion.button>

            <motion.button
              initial={{ opacity: 0, y: 0 }}
              animate={{ opacity: 1, y: -70 }}
              exit={{ opacity: 0, y: 0 }}
              transition={{ type: "spring", stiffness: 300, delay: 0.05 }}
              onClick={() => {
                onOpenSettings();
                setOpen(false);
              }}
              style={subButtonStyle}
            >
              ⚙️
            </motion.button>
          </>
        )}
      </AnimatePresence>

      {/* Main FAB */}
      <motion.button
        animate={{ rotate: open ? 45 : 0 }}
        onClick={() => setOpen(!open)}
        style={{
          width: 60,
          height: 60,
          borderRadius: "50%",
          backgroundColor: "#36a2eb",
          color: "#fff",
          fontSize: 30,
          border: "none",
          boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
          cursor: "pointer",
        }}
        whileTap={{ scale: 0.9 }}
      >
        +
      </motion.button>
    </div>
  );
}

const subButtonStyle: React.CSSProperties = {
  position: "absolute",
  right: 0,
  width: 50,
  height: 50,
  borderRadius: "50%",
  backgroundColor: "#444",
  color: "#fff",
  fontSize: 20,
  border: "none",
  cursor: "pointer",
  boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
};
