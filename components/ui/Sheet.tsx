'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from './Icon';

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  zIndex?: number;
}

export default function Sheet({ open, onClose, title, subtitle, actions, footer, children, zIndex = 1000 }: Props) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="sheet-overlay"
          style={{ zIndex }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            className="sheet"
            role="dialog"
            aria-modal="true"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          >
            <div className="sheet-handle" />
            <div className="sheet-header">
              <div style={{ flex: 1, minWidth: 0 }}>
                <h2 className="sheet-title">{title}</h2>
                {subtitle && <p className="sheet-subtitle">{subtitle}</p>}
              </div>
              {actions}
              <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Schließen">
                <Icon name="x" />
              </button>
            </div>
            <div className={`sheet-body ${footer ? '' : 'sheet-body-pad-bottom'}`}>{children}</div>
            {footer && <div className="sheet-footer">{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
