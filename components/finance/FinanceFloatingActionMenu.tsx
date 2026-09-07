'use client';

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Icon from "../ui/Icon";

interface Props {
  onOpenTransaction: () => void;
  onOpenSettings: () => void;
}

export default function FinanceFloatingActionMenu({ onOpenTransaction, onOpenSettings }: Props) {
  const [open, setOpen] = useState(false);
  const pick = (fn: () => void) => { setOpen(false); fn(); };
  return (
    <>
      <AnimatePresence>
        {open && <motion.div className="fab-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {open && (
          <div className="fab-menu">
            <motion.button className="fab-item" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} onClick={() => pick(onOpenSettings)}>
              <Icon name="settings" size={18} /> Einstellungen
            </motion.button>
            <motion.button className="fab-item" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} transition={{ delay: 0.03 }} onClick={() => pick(onOpenTransaction)}>
              <Icon name="euro" size={18} /> Buchung
            </motion.button>
          </div>
        )}
      </AnimatePresence>
      <button className="fab" style={{ background: '#3b82f6', color: '#fff', boxShadow: '0 8px 24px rgba(59,130,246,0.3)' }} onClick={() => setOpen((v) => !v)} aria-label="Hinzufügen">
        <motion.span animate={{ rotate: open ? 45 : 0 }} style={{ display: 'flex' }}><Icon name="plus" size={26} strokeWidth={2.4} /></motion.span>
      </button>
    </>
  );
}
