'use client';

import React, { useEffect, useState } from 'react';
import Sheet from './ui/Sheet';
import Button from './ui/Button';
import Icon from './ui/Icon';
import { Field, Input } from './ui/Field';
import { useToast } from './ui/Toast';
import { formatISOShort, nowTimeDE, todayISO } from '../lib/date';

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  date: string;
}

export default function SportForm({ open, onClose, onSaved, date }: Props) {
  const toast = useToast();
  const [desc, setDesc] = useState('');
  const [kcal, setKcal] = useState('');
  const [zeit, setZeit] = useState('');
  const [saving, setSaving] = useState(false);
  const [estimating, setEstimating] = useState(false);
  const [gewicht, setGewicht] = useState<number | null>(null);

  useEffect(() => {
    if (!open) return;
    setDesc(''); setKcal(''); setZeit(nowTimeDE());
    fetch('/api/gewicht-latest').then((r) => r.json()).then((d) => { if (d.gewicht) setGewicht(d.gewicht); }).catch(() => {});
  }, [open]);

  const estimate = async () => {
    if (!desc.trim()) return toast.error('Beschreibung fehlt');
    if (!gewicht) return toast.error('Kein Gewicht hinterlegt, bitte erst Gewicht eintragen');
    setEstimating(true);
    try {
      const res = await fetch('/api/sport-gpt', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ beschreibung: desc, gewicht }) });
      const data = await res.json();
      if (!res.ok) throw new Error();
      setKcal(String(data.kcal));
      toast.success('Geschätzt, bitte prüfen');
    } catch {
      toast.error('Schätzung fehlgeschlagen');
    }
    setEstimating(false);
  };

  const save = async () => {
    const k = parseFloat(kcal.replace(',', '.'));
    if (!desc.trim() || isNaN(k)) return toast.error('Beschreibung und kcal angeben');
    setSaving(true);
    try {
      const res = await fetch('/api/add-sport', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ beschreibung: desc.trim(), kcal: k, uhrzeit: zeit, datum: date }) });
      if (!res.ok) throw new Error();
      toast.success('Aktivität eingetragen');
      onSaved();
      onClose();
    } catch {
      toast.error('Speichern fehlgeschlagen');
    }
    setSaving(false);
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Sport eintragen"
      subtitle={date === todayISO() ? 'Heute' : formatISOShort(date)}
      footer={<Button variant="primary" size="lg" block icon="check" onClick={save} loading={saving}>Eintragen</Button>}
    >
      <div className="stack" style={{ gap: 14 }}>
        <Field label="Was hast du gemacht?">
          <div className="row" style={{ alignItems: 'stretch' }}>
            <Input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="z. B. 45 min Joggen" autoFocus onKeyDown={(e) => { if (e.key === 'Enter') estimate(); }} />
            <button className="btn btn-primary btn-icon" style={{ width: 46, height: 46 }} onClick={estimate} disabled={estimating} aria-label="Schätzen">
              {estimating ? <span className="spinner" style={{ width: 16, height: 16 }} /> : <Icon name="sparkles" />}
            </button>
          </div>
          <span className="tiny faint">Schätzung nutzt dein letztes Gewicht{gewicht ? ` (${gewicht} kg)` : ''}.</span>
        </Field>
        <div className="grid-2">
          <Field label="Verbrannt">
            <Input value={kcal} onChange={(e) => setKcal(e.target.value)} inputMode="decimal" suffix="kcal" placeholder="0" />
          </Field>
          <Field label="Uhrzeit">
            <Input type="time" value={zeit} onChange={(e) => setZeit(e.target.value)} />
          </Field>
        </div>
      </div>
    </Sheet>
  );
}
