'use client';

import React, { useEffect, useState } from 'react';
import Sheet from './ui/Sheet';
import Button from './ui/Button';
import Icon from './ui/Icon';
import { Input } from './ui/Field';
import { useToast } from './ui/Toast';
import NutritionEditor from './food/NutritionEditor';
import { useNutrition } from './food/useNutrition';
import FavoritenModal from './FavoritenModal';
import KantineModal, { KantineDish } from './KantineModal';
import RezeptBuilder from './RezeptBuilder';
import type { FavoritItem } from '../types/favorit';
import type { FoodPrefill } from '../types/dashboard';
import { formatISOShort, todayISO, nowTimeDE } from '../lib/date';

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  date: string;
  prefill?: FoodPrefill | null;
}

export default function FoodSheet({ open, onClose, onSaved, date, prefill }: Props) {
  const toast = useToast();
  const n = useNutrition();
  const [saving, setSaving] = useState(false);
  const [favorit, setFavorit] = useState(false);
  const [zeit, setZeit] = useState('');
  const [showFav, setShowFav] = useState(false);
  const [showKantine, setShowKantine] = useState(false);
  const [showRezept, setShowRezept] = useState(false);

  useEffect(() => {
    if (!open) return;
    n.reset();
    setFavorit(false);
    setZeit(nowTimeDE());
    if (prefill) n.apply(prefill);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const save = async () => {
    if (!n.valid) return toast.error('Name und Nährwerte fehlen');
    setSaving(true);
    const p = n.payload();
    try {
      const res = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...p, uhrzeit: zeit || undefined, datum: date, favorit }),
      });
      if (!res.ok) throw new Error();
      toast.success(date === todayISO() ? `${p.name} eingetragen` : `Für ${formatISOShort(date)} eingetragen`);
      onSaved();
      onClose();
    } catch {
      toast.error('Speichern fehlgeschlagen');
    }
    setSaving(false);
  };

  const onFavorite = (item: FavoritItem, menge: number) => {
    n.apply({ name: item.name, kcal: item.kcal, eiweiss: item.eiweiss, fett: item.fett, kh: item.kh, menge, unit: item.unit, unitWeight: item.unitWeight ?? null });
    setShowFav(false);
  };

  const onKantine = (dish: KantineDish) => {
    n.apply({ name: dish.name, kcal: dish.kcal, eiweiss: dish.eiweiss, fett: dish.fett, kh: dish.kh, unit: 'g', unitWeight: null, menge: dish.gewicht > 0 ? dish.gewicht : 100 });
    setShowKantine(false);
  };

  const onRecipe = (name: string, kcal: number, eiweiss: number, fett: number, kh: number, weight: number) => {
    const f = weight > 0 ? 100 / weight : 0;
    n.apply({ name, kcal: kcal * f, eiweiss: eiweiss * f, fett: fett * f, kh: kh * f, unit: 'g', unitWeight: null, menge: weight });
    setShowRezept(false);
  };

  return (
    <>
      <Sheet
        open={open}
        onClose={onClose}
        title="Essen eintragen"
        subtitle={date === todayISO() ? 'Heute' : formatISOShort(date)}
        footer={
          <>
            <div className="num" style={{ flex: 1, alignSelf: 'center', fontSize: 14 }}>
              <strong>{Math.round(n.totals.kcal)} kcal</strong>
              <span className="faint"> · P {Math.round(n.totals.eiweiss)} · C {Math.round(n.totals.kh)} · F {Math.round(n.totals.fett)}</span>
            </div>
            <Button variant="primary" size="lg" icon="check" onClick={save} loading={saving} disabled={!n.valid}>Eintragen</Button>
          </>
        }
      >
        <NutritionEditor state={n} onOpenFavorites={() => setShowFav(true)} onOpenKantine={() => setShowKantine(true)} onOpenRecipe={() => setShowRezept(true)} autoFocusAi={!prefill} />

        <div className="grid-2" style={{ marginTop: 14 }}>
          <div className="field">
            <label className="label">Uhrzeit</label>
            <Input type="time" value={zeit} onChange={(e) => setZeit(e.target.value)} />
          </div>
          <div className="field">
            <label className="label">Favorit</label>
            <button
              type="button"
              className={`btn ${favorit ? 'btn-primary' : 'btn-secondary'}`}
              style={{ height: 46, justifyContent: 'flex-start' }}
              onClick={() => setFavorit((v) => !v)}
            >
              <Icon name="star" size={16} filled={favorit} /> {favorit ? 'Wird gespeichert' : 'Als Favorit'}
            </button>
          </div>
        </div>
      </Sheet>

      <FavoritenModal open={showFav} onClose={() => setShowFav(false)} onSelect={onFavorite} zIndex={1010} />
      <KantineModal open={showKantine} onClose={() => setShowKantine(false)} onSelect={onKantine} zIndex={1010} />
      <RezeptBuilder open={showRezept} onClose={() => setShowRezept(false)} onUseRecipe={onRecipe} zIndex={1010} />
    </>
  );
}
