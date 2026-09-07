'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Sheet from './ui/Sheet';
import Icon from './ui/Icon';
import { EmptyState } from './ui/Card';
import { ErrorState } from './ui/Page';

export interface KantineDish {
  id: number;
  category: string;
  name: string;
  kcal: number;
  eiweiss: number;
  fett: number;
  kh: number;
  gewicht: number;
  preis: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (dish: KantineDish) => void;
  zIndex?: number;
}

export default function KantineModal({ open, onClose, onSelect, zIndex }: Props) {
  const [dishes, setDishes] = useState<KantineDish[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMenu = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/kantine');
      const data = await res.json();
      if (res.ok) setDishes(data.dishes || []);
      else setError(data.error || 'Speiseplan konnte nicht geladen werden');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Netzwerkfehler');
    }
    setLoading(false);
  }, []);

  useEffect(() => { if (open) loadMenu(); }, [open, loadMenu]);

  return (
    <Sheet open={open} onClose={onClose} title="Kantine heute" subtitle="PwC Frankfurt Tower" zIndex={zIndex}>
      {loading ? (
        <div className="stack"><div className="skeleton" style={{ height: 64 }} /><div className="skeleton" style={{ height: 64 }} /><div className="skeleton" style={{ height: 64 }} /></div>
      ) : error ? (
        <ErrorState text={error} onRetry={loadMenu} />
      ) : dishes.length === 0 ? (
        <EmptyState icon={<Icon name="utensils" size={24} />} text="Heute kein Speiseplan verfügbar" />
      ) : (
        <div className="list">
          {dishes.map((dish) => (
            <div key={dish.id || dish.name} className="list-item">
              <div className="list-item-main">
                {dish.category && <div className="tiny faint" style={{ textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>{dish.category}</div>}
                <div className="list-item-title" style={{ whiteSpace: 'normal' }}>{dish.name}</div>
                <div className="list-item-sub num" style={{ display: 'flex', gap: 10 }}>
                  {dish.kcal > 0 && <span style={{ color: 'var(--accent)' }}>{Math.round((dish.kcal * dish.gewicht) / 100)} kcal</span>}
                  {dish.gewicht > 0 && <span>{dish.gewicht} g</span>}
                  {dish.preis > 0 && <span>{dish.preis.toFixed(2).replace('.', ',')} €</span>}
                </div>
              </div>
              <button className="btn btn-secondary btn-icon" onClick={() => onSelect(dish)} aria-label="Übernehmen"><Icon name="plus" /></button>
            </div>
          ))}
        </div>
      )}
    </Sheet>
  );
}
