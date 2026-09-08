'use client';

import { useCallback, useMemo, useState } from 'react';
import type { FoodPrefill, Unit } from '../../types/dashboard';

export const parseNum = (v: string) => {
  const n = parseFloat((v || '').replace(',', '.'));
  return isNaN(n) ? 0 : n;
};

const fmt = (n: number) => (Number.isFinite(n) ? String(Math.round(n * 10) / 10) : '');

export function useNutrition() {
  const [name, setName] = useState('');
  const [unit, setUnit] = useState<Unit>('g');
  const [menge, setMenge] = useState('100');
  const [unitWeight, setUnitWeight] = useState('');
  const [kcal, setKcal] = useState('');
  const [eiweiss, setEiweiss] = useState('');
  const [fett, setFett] = useState('');
  const [kh, setKh] = useState('');

  const isWeightUnit = unit === 'g' || unit === 'ml';
  const grams = isWeightUnit ? parseNum(menge) : parseNum(menge) * parseNum(unitWeight);

  const totals = useMemo(() => {
    const f = grams / 100;
    return {
      kcal: parseNum(kcal) * f,
      eiweiss: parseNum(eiweiss) * f,
      fett: parseNum(fett) * f,
      kh: parseNum(kh) * f,
    };
  }, [grams, kcal, eiweiss, fett, kh]);

  const changeUnit = useCallback((u: Unit) => {
    const wasWeight = unit === 'g' || unit === 'ml';
    const isWeight = u === 'g' || u === 'ml';
    setUnit(u);
    if (wasWeight && !isWeight) setMenge('1');
    else if (!wasWeight && isWeight) setMenge('100');
  }, [unit]);

  const apply = useCallback((p: Partial<FoodPrefill>) => {
    if (p.name !== undefined) setName(p.name);
    if (p.kcal !== undefined) setKcal(fmt(p.kcal));
    if (p.eiweiss !== undefined) setEiweiss(fmt(p.eiweiss));
    if (p.fett !== undefined) setFett(fmt(p.fett));
    if (p.kh !== undefined) setKh(fmt(p.kh));
    if (p.unit) setUnit(p.unit);
    if (p.menge !== undefined) setMenge(fmt(p.menge));
    if (p.unitWeight !== undefined) setUnitWeight(p.unitWeight ? fmt(p.unitWeight) : '');
  }, []);

  const reset = useCallback(() => {
    setName(''); setUnit('g'); setMenge('100'); setUnitWeight('');
    setKcal(''); setEiweiss(''); setFett(''); setKh('');
  }, []);

  const valid = name.trim().length > 0 && grams > 0 && (parseNum(kcal) > 0 || parseNum(eiweiss) > 0 || parseNum(fett) > 0 || parseNum(kh) > 0);

  return {
    name, setName, unit, changeUnit, menge, setMenge, unitWeight, setUnitWeight,
    kcal, setKcal, eiweiss, setEiweiss, fett, setFett, kh, setKh,
    isWeightUnit, grams, totals, apply, reset, valid,
    payload: () => ({
      name: name.trim(),
      kcal: totals.kcal, eiweiss: totals.eiweiss, fett: totals.fett, kh: totals.kh,
      unit, menge: parseNum(menge), unitWeight: isWeightUnit ? undefined : parseNum(unitWeight),
      base: { kcal: parseNum(kcal), eiweiss: parseNum(eiweiss), fett: parseNum(fett), kh: parseNum(kh) },
    }),
  };
}

export type NutritionState = ReturnType<typeof useNutrition>;
