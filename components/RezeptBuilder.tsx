'use client';

import React, { useEffect, useState } from 'react';
import Sheet from './ui/Sheet';
import Button from './ui/Button';
import Icon from './ui/Icon';
import { Field, Input } from './ui/Field';
import { useToast } from './ui/Toast';
import NutritionEditor from './food/NutritionEditor';
import { useNutrition } from './food/useNutrition';
import FavoritenModal from './FavoritenModal';
import type { FavoritItem } from '../types/favorit';
import type { Unit } from '../types/dashboard';
import { macroColor } from '../utils/colors';

interface Ingredient {
  id: string;
  name: string;
  kcal: number;
  eiweiss: number;
  fett: number;
  kh: number;
  menge: number;
  unit: Unit;
  unitWeight?: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onUseRecipe: (name: string, totalKcal: number, totalEiweiss: number, totalFett: number, totalKh: number, totalWeight: number) => void;
  zIndex?: number;
}

export default function RezeptBuilder({ open, onClose, onUseRecipe, zIndex = 1000 }: Props) {
  const toast = useToast();
  const n = useNutrition();
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [rezeptName, setRezeptName] = useState('');
  const [showFav, setShowFav] = useState(false);

  const reset = n.reset;
  useEffect(() => { if (open) reset(); }, [open, reset]);

  const totals = ingredients.reduce(
    (acc, i) => ({
      kcal: acc.kcal + i.kcal, eiweiss: acc.eiweiss + i.eiweiss, fett: acc.fett + i.fett, kh: acc.kh + i.kh,
      weight: acc.weight + (i.unit === 'g' || i.unit === 'ml' ? i.menge : i.menge * (i.unitWeight || 0)),
    }),
    { kcal: 0, eiweiss: 0, fett: 0, kh: 0, weight: 0 },
  );

  const addIngredient = () => {
    if (!n.valid) return toast.error('Zutat unvollständig');
    const p = n.payload();
    setIngredients((prev) => [...prev, { id: Date.now().toString(), name: p.name, kcal: p.kcal, eiweiss: p.eiweiss, fett: p.fett, kh: p.kh, menge: p.menge, unit: p.unit, unitWeight: p.unitWeight }]);
    n.reset();
  };

  const useRecipe = () => {
    if (!rezeptName.trim()) return toast.error('Rezeptname fehlt');
    if (ingredients.length === 0) return toast.error('Mindestens eine Zutat hinzufügen');
    if (totals.weight <= 0) return toast.error('Gesamtgewicht ist 0 g');
    onUseRecipe(`Rezept: ${rezeptName.trim()}`, totals.kcal, totals.eiweiss, totals.fett, totals.kh, totals.weight);
    setIngredients([]);
    setRezeptName('');
    n.reset();
  };

  const onFavorite = (item: FavoritItem, menge: number) => {
    n.apply({ name: item.name, kcal: item.kcal, eiweiss: item.eiweiss, fett: item.fett, kh: item.kh, menge, unit: item.unit, unitWeight: item.unitWeight ?? null });
    setShowFav(false);
  };

  return (
    <>
      <Sheet
        open={open}
        onClose={onClose}
        title="Rezept zusammenstellen"
        subtitle="Zutaten addieren, Gesamtwerte übernehmen"
        zIndex={zIndex}
        footer={
          <>
            <div className="num" style={{ flex: 1, alignSelf: 'center', fontSize: 13 }}>
              <strong>{Math.round(totals.kcal)} kcal</strong>
              <span className="faint"> · {Math.round(totals.weight)} g · {ingredients.length} Zutaten</span>
            </div>
            <Button variant="primary" icon="check" onClick={useRecipe} disabled={ingredients.length === 0}>Übernehmen</Button>
          </>
        }
      >
        <Field label="Rezeptname">
          <Input value={rezeptName} onChange={(e) => setRezeptName(e.target.value)} placeholder="z. B. Spaghetti Bolognese" />
        </Field>

        {ingredients.length > 0 && (
          <div className="card-flat" style={{ marginTop: 14, padding: '4px 12px' }}>
            <div className="list">
              {ingredients.map((i) => (
                <div key={i.id} className="list-item" style={{ padding: '10px 0' }}>
                  <div className="list-item-main">
                    <div className="list-item-title">{i.name}</div>
                    <div className="list-item-sub num" style={{ display: 'flex', gap: 8 }}>
                      <span>{i.menge} {i.unit}</span>
                      <span style={{ color: macroColor.protein }}>P {Math.round(i.eiweiss)}</span>
                      <span style={{ color: macroColor.carbs }}>C {Math.round(i.kh)}</span>
                      <span style={{ color: macroColor.fat }}>F {Math.round(i.fett)}</span>
                    </div>
                  </div>
                  <div className="num small" style={{ fontWeight: 600 }}>{Math.round(i.kcal)}</div>
                  <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setIngredients((p) => p.filter((x) => x.id !== i.id))} aria-label="Entfernen" style={{ color: 'var(--text-3)' }}><Icon name="trash" size={15} /></button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="divider" />
        <div className="section-label">Zutat hinzufügen</div>
        <NutritionEditor state={n} onOpenFavorites={() => setShowFav(true)} />
        <Button variant="secondary" block icon="plus" style={{ marginTop: 14 }} onClick={addIngredient} disabled={!n.valid}>Zutat hinzufügen</Button>
      </Sheet>

      <FavoritenModal open={showFav} onClose={() => setShowFav(false)} onSelect={onFavorite} zIndex={zIndex + 10} />
    </>
  );
}
