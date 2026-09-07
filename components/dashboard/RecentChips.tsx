'use client';

import React from 'react';
import Icon from '../ui/Icon';
import type { RecentFood } from '../../types/dashboard';

interface Props {
  items: RecentFood[];
  onPick: (r: RecentFood) => void;
  onOpenFavorites: () => void;
}

export default function RecentChips({ items, onPick, onOpenFavorites }: Props) {
  return (
    <div>
      <div className="row-between" style={{ marginBottom: 8 }}>
        <span className="section-label" style={{ marginBottom: 0 }}>Zuletzt</span>
        <button className="btn btn-ghost btn-sm" onClick={onOpenFavorites} style={{ height: 28, padding: '0 8px' }}>
          <Icon name="star" size={14} /> Favoriten
        </button>
      </div>
      {items.length === 0 ? (
        <p className="small faint">Deine letzten Einträge erscheinen hier.</p>
      ) : (
        <div className="chip-row">
          {items.map((r) => {
            const grams = r.unit === 'g' || r.unit === 'ml' ? r.menge : r.menge * (r.unitWeight || 0);
            const kcal = Math.round((r.kcal / 100) * grams);
            return (
              <button key={r.name} className="chip" onClick={() => onPick(r)} title={`${kcal} kcal`}>
                <span style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name}</span>
                <span className="tiny faint num">{kcal}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
