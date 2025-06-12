'use client';

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  onOpenTransaction: () => void;
  onOpenSettings: () => void;
}

export default function FinanceFloatingActionMenu({ onOpenTransaction, onOpenSettings }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <div style={{ 
      position: "fixed", 
      bottom: "80px", 
      right: "24px", 
      zIndex: 1000 
    }}>
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.button
              initial={{ opacity: 0, scale: 0.3, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.3, y: 20 }}
              transition={{ duration: 0.2, delay: 0.1 }}
              onClick={onOpenSettings}
              style={{
                position: "absolute",
                bottom: "140px",
                right: 0,
                width: 56,
                height: 56,
                borderRadius: "50%",
                backgroundColor: "#ff9800",
                border: "none",
                color: "#fff",
                fontSize: "24px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 16px rgba(255, 152, 0, 0.4)",
              }}
            >
              ⚙️
            </motion.button>

            <motion.button
              initial={{ opacity: 0, scale: 0.3, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.3, y: 20 }}
              transition={{ duration: 0.2 }}
              onClick={onOpenTransaction}
              style={{
                position: "absolute",
                bottom: "70px",
                right: 0,
                width: 56,
                height: 56,
                borderRadius: "50%",
                backgroundColor: "#4caf50",
                border: "none",
                color: "#fff",
                fontSize: "24px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 16px rgba(76, 175, 80, 0.4)",
              }}
            >
              💳
            </motion.button>
          </>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={toggleMenu}
        style={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          backgroundColor: "#36a2eb",
          border: "none",
          color: "#fff",
          fontSize: "28px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 16px rgba(54, 162, 235, 0.4)",
          transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
          transition: "transform 0.2s ease",
        }}
      >
        {isOpen ? "✕" : "+"}
      </motion.button>
    </div>
  );
}