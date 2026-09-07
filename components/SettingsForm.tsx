'use client';

import React, { useEffect, useState } from 'react';
import Sheet from './ui/Sheet';
import Button from './ui/Button';
import { Field, Input } from './ui/Field';
import { useToast } from './ui/Toast';
import { macroColor } from '../utils/colors';

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export default function SettingsForm({ open, onClose, onSaved }: Props) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [kcal, setKcal] = useState('');
  const [eiweiss, setEiweiss] = useState('');
  const [fett, setFett] = useState('');
  const [kh, setKh] = useState('');
  const [startgewicht, setStartgewicht] = useState('');
  const [zielGewicht, setZielGewicht] = useState('');
  const [tdee, setTdee] = useState('');

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch('/api/settings')
      .then((r) => r.json())
      .then((d) => {
        setKcal(String(d.zielKcal ?? ''));
        setEiweiss(String(d.zielEiweiss ?? ''));
        setFett(String(d.zielFett ?? ''));
        setKh(String(d.zielKh ?? ''));
        setStartgewicht(String(d.startgewicht ?? ''));
        setZielGewicht(d.zielGewicht != null ? String(d.zielGewicht) : '');
        setTdee(d.tdee != null ? String(d.tdee) : '');
      })
      .catch(() => toast.error('Ziele konnten nicht geladen werden'))
      .finally(() => setLoading(false));
  }, [open, toast]);

  const num = (s: string) => parseFloat(s.replace(',', '.'));
  const macroKcal = (num(eiweiss) || 0) * 4 + (num(kh) || 0) * 4 + (num(fett) || 0) * 9;

  const save = async () => {
    if ([kcal, eiweiss, fett, kh].some((v) => isNaN(num(v)))) return toast.error('Bitte alle Ziele als Zahl angeben');
    setSaving(true);
    try {
      const res = await fetch('/api/save-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kcal: num(kcal), kh: num(kh), eiweiss: num(eiweiss), fett: num(fett),
          startgewicht: num(startgewicht) || 0,
          zielGewicht: zielGewicht ? num(zielGewicht) : null,
          tdee: tdee ? num(tdee) : null,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success('Ziele gespeichert');
      onSaved?.();
      onClose();
    } catch {
      toast.error('Speichern fehlgeschlagen');
    }
    setSaving(false);
  };

  return (
    <Sheet open={open} onClose={onClose} title="Ziele" subtitle="Tagesziele und Körperdaten" footer={<Button variant="primary" size="lg" block icon="check" onClick={save} loading={saving} disabled={loading}>Speichern</Button>}>
      {loading ? (
        <div className="stack"><div className="skeleton" style={{ height: 46 }} /><div className="skeleton" style={{ height: 46 }} /><div className="skeleton" style={{ height: 46 }} /></div>
      ) : (
        <div className="stack" style={{ gap: 14 }}>
          <Field label="Kalorienziel pro Tag">
            <Input value={kcal} onChange={(e) => setKcal(e.target.value)} inputMode="decimal" suffix="kcal" style={{ fontSize: 20, height: 54, fontWeight: 600 }} />
          </Field>
          <div className="grid-3">
            <Field label={<span style={{ color: macroColor.protein }}>Protein</span>}>
              <Input value={eiweiss} onChange={(e) => setEiweiss(e.target.value)} inputMode="decimal" suffix="g" />
            </Field>
            <Field label={<span style={{ color: macroColor.carbs }}>Carbs</span>}>
              <Input value={kh} onChange={(e) => setKh(e.target.value)} inputMode="decimal" suffix="g" />
            </Field>
            <Field label={<span style={{ color: macroColor.fat }}>Fett</span>}>
              <Input value={fett} onChange={(e) => setFett(e.target.value)} inputMode="decimal" suffix="g" />
            </Field>
          </div>
          <p className="tiny faint" style={{ marginTop: -6 }}>
            Makros ergeben {Math.round(macroKcal).toLocaleString('de-DE')} kcal{num(kcal) ? ` (${Math.round((macroKcal / num(kcal)) * 100)} % des Ziels)` : ''}.
          </p>
          <div className="divider" style={{ margin: '4px 0' }} />
          <Field label="Täglicher Verbrauch (TDEE)" hint="Grundlage für Bilanz und theoretische Gewichtskurve">
            <Input value={tdee} onChange={(e) => setTdee(e.target.value)} inputMode="decimal" suffix="kcal" />
          </Field>
          <div className="grid-2">
            <Field label="Startgewicht">
              <Input value={startgewicht} onChange={(e) => setStartgewicht(e.target.value)} inputMode="decimal" suffix="kg" />
            </Field>
            <Field label="Zielgewicht">
              <Input value={zielGewicht} onChange={(e) => setZielGewicht(e.target.value)} inputMode="decimal" suffix="kg" placeholder="optional" />
            </Field>
          </div>
        </div>
      )}
    </Sheet>
  );
}
