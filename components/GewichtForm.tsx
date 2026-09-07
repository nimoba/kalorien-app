'use client';

import React, { useEffect, useState } from 'react';
import Sheet from './ui/Sheet';
import Button from './ui/Button';
import { Field, Input } from './ui/Field';
import { useToast } from './ui/Toast';
import { formatISOShort, todayISO } from '../lib/date';

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  date: string;
}

export default function GewichtForm({ open, onClose, onSaved, date }: Props) {
  const toast = useToast();
  const [gewicht, setGewicht] = useState('');
  const [fett, setFett] = useState('');
  const [wasser, setWasser] = useState('');
  const [muskel, setMuskel] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (open) { setGewicht(''); setFett(''); setWasser(''); setMuskel(''); } }, [open]);

  const save = async () => {
    const g = parseFloat(gewicht.replace(',', '.'));
    if (isNaN(g) || g <= 0) return toast.error('Gewicht eingeben');
    setSaving(true);
    try {
      const res = await fetch('/api/save-gewicht', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gewicht: g,
          fett: fett ? parseFloat(fett.replace(',', '.')) : null,
          muskel: muskel ? parseFloat(muskel.replace(',', '.')) : null,
          wasser: wasser ? parseFloat(wasser.replace(',', '.')) : null,
          datum: date,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error();
      toast.success(data.replaced ? 'Gewicht für den Tag aktualisiert' : 'Gewicht gespeichert');
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
      title="Gewicht eintragen"
      subtitle={date === todayISO() ? 'Heute' : formatISOShort(date)}
      footer={<Button variant="primary" size="lg" block icon="check" onClick={save} loading={saving}>Speichern</Button>}
    >
      <div className="stack" style={{ gap: 14 }}>
        <Field label="Gewicht">
          <Input value={gewicht} onChange={(e) => setGewicht(e.target.value)} inputMode="decimal" suffix="kg" placeholder="0,0" autoFocus style={{ fontSize: 22, height: 56, fontWeight: 600 }} />
        </Field>
        <div className="grid-3">
          <Field label="Körperfett">
            <Input value={fett} onChange={(e) => setFett(e.target.value)} inputMode="decimal" suffix="%" placeholder="–" />
          </Field>
          <Field label="Wasser">
            <Input value={wasser} onChange={(e) => setWasser(e.target.value)} inputMode="decimal" suffix="%" placeholder="–" />
          </Field>
          <Field label="Muskeln">
            <Input value={muskel} onChange={(e) => setMuskel(e.target.value)} inputMode="decimal" suffix="%" placeholder="–" />
          </Field>
        </div>
        <p className="tiny faint">Leere Felder übernehmen den letzten bekannten Wert. Ein zweiter Eintrag am selben Tag ersetzt den ersten.</p>
      </div>
    </Sheet>
  );
}
