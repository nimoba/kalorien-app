'use client';

import React, { useRef, useState } from 'react';
import Icon, { IconName } from '../ui/Icon';
import { Field, Input, Segmented, Textarea } from '../ui/Field';
import { useToast } from '../ui/Toast';
import BarcodeScanner from '../BarcodeScanner';
import { macroColor } from '../../utils/colors';
import type { NutritionState } from './useNutrition';
import type { Unit } from '../../types/dashboard';

interface Props {
  state: NutritionState;
  onOpenFavorites: () => void;
  onOpenKantine?: () => void;
  onOpenRecipe?: () => void;
  autoFocusAi?: boolean;
}

export default function NutritionEditor({ state, onOpenFavorites, onOpenKantine, onOpenRecipe, autoFocusAi }: Props) {
  const toast = useToast();
  const [aiText, setAiText] = useState('');
  const [busy, setBusy] = useState<null | 'ai' | 'barcode' | 'photo'>(null);
  const [scanning, setScanning] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const estimate = async () => {
    if (!aiText.trim()) return;
    setBusy('ai');
    try {
      const res = await fetch('/api/track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: aiText }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      state.apply({
        name: aiText.trim(), kcal: Number(data.Kalorien), eiweiss: Number(data.Eiweiß), fett: Number(data.Fett), kh: Number(data.Kohlenhydrate),
        menge: data.menge ? Number(data.menge) : 100, unit: (data.unit as Unit) || 'g', unitWeight: data.unitWeight ? Number(data.unitWeight) : null,
      });
      setAiText('');
      toast.success(data.source === 'favoriten' ? 'Aus Favoriten übernommen' : 'Geschätzt, bitte prüfen');
    } catch {
      toast.error('Schätzung fehlgeschlagen');
    }
    setBusy(null);
  };

  const onBarcode = async (code: string) => {
    setScanning(false);
    setBusy('barcode');
    try {
      const res = await fetch(`/api/barcode?code=${encodeURIComponent(code)}&menge=1`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      state.apply({
        name: data.name, kcal: Number(data.Kalorien), eiweiss: Number(data.Eiweiß), fett: Number(data.Fett), kh: Number(data.Kohlenhydrate),
        menge: data.menge ? Number(data.menge) : 100, unit: (data.unit as Unit) || 'g', unitWeight: data.unitWeight ? Number(data.unitWeight) : null,
      });
      toast.success('Produkt gefunden');
    } catch {
      toast.error('Produkt nicht gefunden');
    }
    setBusy(null);
  };

  const onPhoto = (file: File) => {
    if (!file.type.startsWith('image/')) return toast.error('Bitte ein Bild wählen');
    if (file.size > 10 * 1024 * 1024) return toast.error('Bild zu groß (max. 10 MB)');
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result?.toString().split(',')[1];
      if (!base64) return;
      setBusy('photo');
      try {
        const res = await fetch('/api/kalorien-bild', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image: base64 }) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        state.apply({
          name: data.name || 'Foto-Schätzung',
          kcal: Number(data.kcal ?? data.Kalorien ?? 0), eiweiss: Number(data.eiweiss ?? data.Eiweiß ?? 0),
          fett: Number(data.fett ?? data.Fett ?? 0), kh: Number(data.kh ?? data.Kohlenhydrate ?? 0),
          menge: data.menge ? Number(data.menge) : 100, unit: 'g', unitWeight: null,
        });
        toast.success('Foto analysiert, bitte prüfen');
      } catch {
        toast.error('Foto konnte nicht analysiert werden');
      }
      setBusy(null);
    };
    reader.readAsDataURL(file);
  };

  const sources: { label: string; icon: IconName; onClick: () => void; show: boolean }[] = [
    { label: 'Favoriten', icon: 'star', onClick: onOpenFavorites, show: true },
    { label: 'Barcode', icon: 'scan', onClick: () => setScanning((v) => !v), show: true },
    { label: 'Foto', icon: 'camera', onClick: () => fileRef.current?.click(), show: true },
    { label: 'Kantine', icon: 'utensils', onClick: () => onOpenKantine?.(), show: !!onOpenKantine },
    { label: 'Rezept', icon: 'chefHat', onClick: () => onOpenRecipe?.(), show: !!onOpenRecipe },
  ];

  return (
    <div className="stack" style={{ gap: 14 }}>
      {/* AI estimate */}
      <div className="card-flat" style={{ padding: 12 }}>
        <div className="row" style={{ gap: 8, alignItems: 'flex-end' }}>
          <Textarea
            value={aiText}
            onChange={(e) => setAiText(e.target.value)}
            placeholder="Was hast du gegessen? z. B. „2 Eier und Toast mit Butter“"
            rows={2}
            autoFocus={autoFocusAi}
            style={{ minHeight: 56, background: 'var(--surface)' }}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); estimate(); } }}
          />
          <button className="btn btn-primary btn-icon" style={{ width: 46, height: 46 }} onClick={estimate} disabled={busy !== null || !aiText.trim()} aria-label="Schätzen">
            {busy === 'ai' ? <span className="spinner" style={{ width: 16, height: 16 }} /> : <Icon name="sparkles" />}
          </button>
        </div>
      </div>

      {/* Sources */}
      <div className="chip-row">
        {sources.filter((s) => s.show).map((s) => (
          <button key={s.label} className={`chip ${s.label === 'Barcode' && scanning ? 'active' : ''}`} onClick={s.onClick} disabled={busy !== null}>
            {busy === 'barcode' && s.label === 'Barcode' || busy === 'photo' && s.label === 'Foto'
              ? <span className="spinner" style={{ width: 14, height: 14 }} />
              : <Icon name={s.icon} size={15} />}
            {s.label}
          </button>
        ))}
        <input ref={fileRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) onPhoto(f); e.target.value = ''; }} />
      </div>

      {scanning && (
        <div>
          <BarcodeScanner onDetected={onBarcode} />
          <button className="btn btn-secondary btn-sm btn-block" style={{ marginTop: 8 }} onClick={() => setScanning(false)}>Scanner schließen</button>
        </div>
      )}

      {/* Name */}
      <Field label="Name">
        <Input value={state.name} onChange={(e) => state.setName(e.target.value)} placeholder="z. B. Haferflocken" enterKeyHint="next" />
      </Field>

      {/* Unit and amount */}
      <Field label="Einheit">
        <Segmented<Unit>
          value={state.unit}
          onChange={state.changeUnit}
          options={[{ value: 'g', label: 'g' }, { value: 'ml', label: 'ml' }, { value: 'Stück', label: 'Stück' }, { value: 'Portion', label: 'Portion' }]}
        />
      </Field>

      <div className="grid-2">
        <Field label={`Menge`}>
          <Input value={state.menge} onChange={(e) => state.setMenge(e.target.value)} inputMode="decimal" suffix={state.unit} enterKeyHint="next" />
        </Field>
        {!state.isWeightUnit ? (
          <Field label={`Gewicht pro ${state.unit}`}>
            <Input value={state.unitWeight} onChange={(e) => state.setUnitWeight(e.target.value)} inputMode="decimal" suffix="g" placeholder={state.unit === 'Stück' ? '180' : '350'} enterKeyHint="next" />
          </Field>
        ) : (
          <Field label="Entspricht">
            <div className="input" style={{ display: 'flex', alignItems: 'center', color: 'var(--text-2)' }}>{Math.round(state.grams)} g</div>
          </Field>
        )}
      </div>

      {/* Per-100 values */}
      <div>
        <div className="row-between" style={{ marginBottom: 6 }}>
          <label className="label">Nährwerte pro 100 g</label>
          <span className="tiny faint">Ergebnis für {Math.round(state.grams)} g</span>
        </div>
        <div className="grid-4">
          {([
            { key: 'kcal', label: 'kcal', value: state.kcal, set: state.setKcal, total: state.totals.kcal, color: macroColor.kcal },
            { key: 'eiweiss', label: 'Protein', value: state.eiweiss, set: state.setEiweiss, total: state.totals.eiweiss, color: macroColor.protein },
            { key: 'kh', label: 'Carbs', value: state.kh, set: state.setKh, total: state.totals.kh, color: macroColor.carbs },
            { key: 'fett', label: 'Fett', value: state.fett, set: state.setFett, total: state.totals.fett, color: macroColor.fat },
          ] as const).map((m, idx, arr) => (
            <div key={m.key} className="card-flat" style={{ padding: 8, textAlign: 'center' }}>
              <div className="tiny" style={{ color: m.color, fontWeight: 600, marginBottom: 6 }}>{m.label}</div>
              <Input small className="input-center" value={m.value} onChange={(e) => m.set(e.target.value)} inputMode="decimal" enterKeyHint={idx === arr.length - 1 ? 'done' : 'next'} style={{ background: 'var(--surface)' }} />
              <div className="num small" style={{ marginTop: 6, fontWeight: 600 }}>{Math.round(m.total)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
