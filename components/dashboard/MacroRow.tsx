'use client';

import React from 'react';
import { macroColor } from '../../utils/colors';

interface Props {
  eiweiss: number; zielEiweiss: number;
  kh: number; zielKh: number;
  fett: number; zielFett: number;
}

export default function MacroRow(p: Props) {
  const items = [
    { label: 'Protein', value: p.eiweiss, ziel: p.zielEiweiss, color: macroColor.protein },
    { label: 'Carbs', value: p.kh, ziel: p.zielKh, color: macroColor.carbs },
    { label: 'Fett', value: p.fett, ziel: p.zielFett, color: macroColor.fat },
  ];
  return (
    <div className="grid-3">
      {items.map((m) => {
        const pct = m.ziel > 0 ? m.value / m.ziel : 0;
        const rest = Math.round(m.ziel - m.value);
        const over = pct > 1.1;
        return (
          <div key={m.label} className="card" style={{ padding: '14px 14px 12px' }}>
            <div className="tiny" style={{ color: m.color, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{m.label}</div>
            <div className="num" style={{ fontSize: 20, fontWeight: 700, marginTop: 4, lineHeight: 1.1 }}>
              {Math.round(m.value)}<span className="small faint" style={{ fontWeight: 500 }}> / {Math.round(m.ziel)} g</span>
            </div>
            <div className="bar" style={{ marginTop: 10 }}>
              <span style={{ width: `${Math.min(pct * 100, 100)}%`, background: over ? 'var(--danger)' : m.color }} />
            </div>
            <div className="tiny" style={{ marginTop: 6, color: over ? 'var(--danger)' : 'var(--text-3)' }}>
              {rest >= 0 ? `noch ${rest} g` : `${Math.abs(rest)} g drüber`}
            </div>
          </div>
        );
      })}
    </div>
  );
}
