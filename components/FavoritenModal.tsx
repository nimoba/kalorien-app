'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Sheet from './ui/Sheet';
import Icon from './ui/Icon';
import { Input } from './ui/Field';
import { EmptyState } from './ui/Card';
import { useToast } from './ui/Toast';
import type { FavoritItem } from '../types/favorit';

export type { FavoritItem };

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (item: FavoritItem, menge: number) => void;
  zIndex?: number;
}

const defaultMenge = (item: FavoritItem) => (item.unit === 'Stück' || item.unit === 'Portion' ? 1 : 100);

export default function FavoritenModal({ open, onClose, onSelect, zIndex }: Props) {
  const toast = useToast();
  const [favoriten, setFavoriten] = useState<FavoritItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [mengen, setMengen] = useState<Record<string, string>>({});
  const [confirm, setConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/favoriten');
      const data = await res.json();
      if (res.ok) { setFavoriten(data); setLoaded(true); }
    } catch {
      toast.error('Favoriten konnten nicht geladen werden');
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => { if (open && !loaded) load(); }, [open, loaded, load]);
  useEffect(() => { if (open) { setSearch(''); setConfirm(null); } }, [open]);

  const filtered = useMemo(() => {
    const t = search.trim().toLowerCase();
    return t ? favoriten.filter((f) => f.name.toLowerCase().includes(t)) : favoriten;
  }, [favoriten, search]);

  const remove = async (name: string) => {
    setDeleting(name);
    try {
      const res = await fetch('/api/favoriten', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
      if (!res.ok) throw new Error();
      setFavoriten((prev) => prev.filter((f) => f.name !== name));
      toast.success('Favorit entfernt');
    } catch {
      toast.error('Löschen fehlgeschlagen');
    }
    setDeleting(null);
    setConfirm(null);
  };

  return (
    <Sheet open={open} onClose={onClose} title="Favoriten" subtitle={`${favoriten.length} gespeichert`} zIndex={zIndex}>
      <Input prefixIcon="search" placeholder="Suchen…" value={search} onChange={(e) => setSearch(e.target.value)} autoFocus />
      <div style={{ marginTop: 10 }}>
        {loading ? (
          <div className="stack"><div className="skeleton" style={{ height: 56 }} /><div className="skeleton" style={{ height: 56 }} /><div className="skeleton" style={{ height: 56 }} /></div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={<Icon name="star" size={24} />} text={search ? 'Nichts gefunden' : 'Noch keine Favoriten. Beim Eintragen den Stern setzen.'} />
        ) : (
          <div className="list">
            {filtered.map((item) => {
              const mengeStr = mengen[item.name] ?? String(defaultMenge(item));
              const menge = parseFloat(mengeStr.replace(',', '.')) || 0;
              const grams = item.unit === 'g' || item.unit === 'ml' ? menge : menge * (item.unitWeight || 0);
              const kcal = Math.round((item.kcal / 100) * grams);
              const isConfirm = confirm === item.name;
              return (
                <div key={item.name} className="list-item">
                  <button
                    className="list-item-main"
                    style={{ background: 'none', border: 'none', textAlign: 'left', padding: 0, cursor: 'pointer' }}
                    onClick={() => onSelect(item, menge || defaultMenge(item))}
                  >
                    <div className="list-item-title" style={{ textTransform: 'capitalize' }}>{item.name}</div>
                    <div className="list-item-sub num">
                      {Math.round(item.kcal)} kcal / {item.unit === 'g' || item.unit === 'ml' ? `100 ${item.unit}` : `100 g`}
                      {item.unitWeight ? ` · 1 ${item.unit} ≈ ${item.unitWeight} g` : ''}
                    </div>
                  </button>
                  {isConfirm ? (
                    <div className="row" style={{ gap: 4 }}>
                      <button className="btn btn-danger btn-sm" onClick={() => remove(item.name)} disabled={deleting === item.name}>
                        {deleting === item.name ? <span className="spinner" style={{ width: 14, height: 14 }} /> : 'Löschen'}
                      </button>
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setConfirm(null)}><Icon name="x" size={16} /></button>
                    </div>
                  ) : (
                    <>
                      <div style={{ width: 88, flexShrink: 0 }}>
                        <Input small className="input-center" value={mengeStr} onChange={(e) => setMengen((m) => ({ ...m, [item.name]: e.target.value }))} inputMode="decimal" suffix={item.unit} />
                      </div>
                      <div className="num small" style={{ width: 44, textAlign: 'right', fontWeight: 600 }}>{kcal}</div>
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setConfirm(item.name)} aria-label="Entfernen" style={{ color: 'var(--text-3)' }}>
                        <Icon name="trash" size={15} />
                      </button>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Sheet>
  );
}
