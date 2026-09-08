'use client';

import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Icon, { IconName } from '../ui/Icon';

interface Props {
  onFood: () => void;
  onSport: () => void;
  onWeight: () => void;
}

export default function FabMenu({ onFood, onSport, onWeight }: Props) {
  const [open, setOpen] = useState(false);
  const items: { label: string; icon: IconName; action: () => void }[] = [
    { label: 'Gewicht', icon: 'scale', action: onWeight },
    { label: 'Sport', icon: 'activity', action: onSport },
    { label: 'Essen', icon: 'utensils', action: onFood },
  ];

  const pick = (fn: () => void) => { setOpen(false); fn(); };

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div className="fab-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {open && (
          <div className="fab-menu">
            {items.map((it, i) => (
              <motion.button
                key={it.label}
                className="fab-item"
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ delay: (items.length - 1 - i) * 0.03 }}
                onClick={() => pick(it.action)}
              >
                <Icon name={it.icon} size={18} />
                {it.label}
              </motion.button>
            ))}
          </div>
        )}
      </AnimatePresence>
      <button className="fab" onClick={() => setOpen((v) => !v)} aria-label="Eintragen" aria-expanded={open}>
        <motion.span animate={{ rotate: open ? 45 : 0 }} style={{ display: 'flex' }}>
          <Icon name="plus" size={26} strokeWidth={2.4} />
        </motion.span>
      </button>
    </>
  );
}
