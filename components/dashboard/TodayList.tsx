'use client';

import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Icon from '../ui/Icon';
import { useToast } from '../ui/Toast';
import { macroColor } from '../../utils/colors';
import type { FoodEntry, ActivityEntry } from '../../types/dashboard';

interface Props {
  eintraege: FoodEntry[];
  aktivitaeten: ActivityEntry[];
  onChanged: () => void;
  onRepeat?: (e: FoodEntry) => void;
}

type Row = { kind: 'essen'; e: FoodEntry } | { kind: 'sport'; e: ActivityEntry };

export default function TodayList({ eintraege, aktivitaeten, onChanged, onRepeat }: Props) {
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<string | null>(null);

  const rows: Row[] = [
    ...eintraege.map((e) => ({ kind: 'essen' as const, e })),
    ...aktivitaeten.map((e) => ({ kind: 'sport' as const, e })),
  ].sort((a, b) => (a.e.zeit || '').localeCompare(b.e.zeit || ''));

  const remove = async (r: Row) => {
    const key = `${r.kind}-${r.e.row}`;
    setBusy(key);
    try {
      const res = await fetch('/api/entry', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sheet: r.kind, row: r.e.row, name: r.e.name, kcal: r.e.kcal }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Eintrag gelöscht');
        onChanged();
      } else {
        toast.error(data.error || 'Löschen fehlgeschlagen');
        if (res.status === 409) onChanged();
      }
    } catch {
      toast.error('Netzwerkfehler');
    }
    setBusy(null);
    setConfirm(null);
  };

  if (rows.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '26px 18px' }}>
        <div className="icon-box" style={{ margin: '0 auto 10px' }}><Icon name="utensils" size={18} /></div>
        <p className="small muted">Noch nichts eingetragen.</p>
        <p className="tiny faint" style={{ marginTop: 4 }}>Tippe auf + oder wähle unten etwas aus „Zuletzt“.</p>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: '4px 16px' }}>
      <div className="list">
        <AnimatePresence initial={false}>
          {rows.map((r) => {
            const key = `${r.kind}-${r.e.row}`;
            const isConfirm = confirm === key;
            return (
              <motion.div
                key={key}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0, paddingTop: 0, paddingBottom: 0 }}
                className="list-item"
                style={{ overflow: 'hidden' }}
              >
                <div className="tiny faint num" style={{ width: 38, flexShrink: 0 }}>{r.e.zeit || '–'}</div>
                <div className="list-item-main">
                  <div className="list-item-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {r.kind === 'sport' && <Icon name="activity" size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} />}
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.e.name}</span>
                  </div>
                  {r.kind === 'essen' ? (
                    <div className="list-item-sub num" style={{ display: 'flex', gap: 10 }}>
                      {r.e.menge !== null && r.e.unit && <span>{fmtAmount(r.e.menge, r.e.unit)}</span>}
                      <span style={{ color: macroColor.protein }}>P {Math.round(r.e.eiweiss)}</span>
                      <span style={{ color: macroColor.carbs }}>C {Math.round(r.e.kh)}</span>
                      <span style={{ color: macroColor.fat }}>F {Math.round(r.e.fett)}</span>
                    </div>
                  ) : (
                    <div className="list-item-sub">Aktivität</div>
                  )}
                </div>
                <div className="num" style={{ fontWeight: 600, fontSize: 14, color: r.kind === 'sport' ? 'var(--accent)' : 'var(--text)', flexShrink: 0 }}>
                  {r.kind === 'sport' ? '+' : ''}{Math.round(r.e.kcal)}
                </div>
                {isConfirm ? (
                  <div className="row" style={{ gap: 4 }}>
                    <button className="btn btn-danger btn-sm" onClick={() => remove(r)} disabled={busy === key}>
                      {busy === key ? <span className="spinner" style={{ width: 14, height: 14 }} /> : 'Löschen'}
                    </button>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setConfirm(null)} aria-label="Abbrechen"><Icon name="x" size={16} /></button>
                  </div>
                ) : (
                  <div className="row" style={{ gap: 2 }}>
                    {r.kind === 'essen' && onRepeat && (
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => onRepeat(r.e)} aria-label="Nochmal eintragen" title="Nochmal eintragen">
                        <Icon name="repeat" size={15} />
                      </button>
                    )}
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setConfirm(key)} aria-label="Löschen" style={{ color: 'var(--text-3)' }}>
                      <Icon name="trash" size={15} />
                    </button>
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

export function fmtAmount(menge: number, unit: string) {
  const m = Number.isInteger(menge) ? menge : Math.round(menge * 10) / 10;
  if (unit === 'g' || unit === 'ml') return `${m} ${unit}`;
  return `${m} ${unit}`;
}
