'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Icon from '../ui/Icon';

interface Props {
  gegessen: number;
  ziel: number;
  aktivitaet: number;
  basisZiel: number;
}

export default function KcalHero({ gegessen, ziel, aktivitaet, basisZiel }: Props) {
  const rest = Math.round(ziel - gegessen);
  const pct = ziel > 0 ? gegessen / ziel : 0;
  const clamped = Math.min(pct, 1);

  const color = pct > 1.1 ? 'var(--danger)' : pct > 1 ? 'var(--warning)' : 'var(--accent)';

  // Half ring geometry
  const r = 84;
  const stroke = 12;
  const cx = 100;
  const cy = 100;
  const circumference = Math.PI * r; // half circle
  const dash = circumference * clamped;

  return (
    <motion.section
      className="card"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      style={{ padding: '18px 18px 14px' }}
    >
      <div className="row-between">
        <span className="section-label" style={{ marginBottom: 0 }}>Kalorien</span>
        <span className={`badge ${pct > 1.1 ? 'badge-danger' : pct >= 0.9 ? 'badge-accent' : ''}`}>
          {Math.round(pct * 100)}%
        </span>
      </div>

      <div style={{ position: 'relative', width: '100%', maxWidth: 260, margin: '6px auto 0' }}>
        <svg viewBox="0 0 200 112" style={{ width: '100%', display: 'block' }}>
          <path
            d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
            fill="none"
            stroke="var(--surface-3)"
            strokeWidth={stroke}
            strokeLinecap="round"
          />
          <motion.path
            d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - dash }}
            transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
          />
        </svg>
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, textAlign: 'center' }}>
          <div className="num" style={{ fontSize: 40, fontWeight: 700, lineHeight: 1, color: rest < 0 ? 'var(--danger)' : 'var(--text)' }}>
            {Math.abs(rest).toLocaleString('de-DE')}
          </div>
          <div className="small faint" style={{ marginTop: 4 }}>
            {rest < 0 ? 'kcal drüber' : 'kcal übrig'}
          </div>
        </div>
      </div>

      <div className="grid-3" style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
        <MiniStat label="Gegessen" value={Math.round(gegessen)} />
        <MiniStat label="Sport" value={Math.round(aktivitaet)} prefix={aktivitaet > 0 ? '+' : ''} icon={aktivitaet > 0 ? 'activity' : undefined} />
        <MiniStat label="Ziel" value={Math.round(ziel)} sub={aktivitaet > 0 ? `${Math.round(basisZiel)} + Sport` : undefined} />
      </div>
    </motion.section>
  );
}

function MiniStat({ label, value, prefix = '', sub, icon }: { label: string; value: number; prefix?: string; sub?: string; icon?: 'activity' }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div className="num" style={{ fontSize: 17, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        {icon && <Icon name={icon} size={13} style={{ color: 'var(--accent)' }} />}
        {prefix}{value.toLocaleString('de-DE')}
      </div>
      <div className="tiny faint">{sub || label}</div>
    </div>
  );
}
