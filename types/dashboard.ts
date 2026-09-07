export type Unit = 'g' | 'ml' | 'Stück' | 'Portion';

export interface FoodEntry {
  row: number;
  datum: string;
  zeit: string;
  name: string;
  kcal: number;
  eiweiss: number;
  fett: number;
  kh: number;
  menge: number | null;
  unit: Unit | null;
  unitWeight: number | null;
}

export interface ActivityEntry {
  row: number;
  datum: string;
  zeit: string;
  name: string;
  kcal: number;
}

export interface RecentFood {
  name: string;
  kcal: number;
  eiweiss: number;
  fett: number;
  kh: number;
  menge: number;
  unit: Unit;
  unitWeight: number | null;
}

/** Values used to prefill the food form. Nutrition values are per 100 g. */
export interface FoodPrefill {
  name: string;
  kcal: number;
  eiweiss: number;
  fett: number;
  kh: number;
  menge: number;
  unit: Unit;
  unitWeight?: number | null;
}

export interface DashboardData {
  date: string;
  isToday: boolean;
  ziele: {
    kcal: number; kh: number; eiweiss: number; fett: number;
    startgewicht: number; zielGewicht: number | null; tdee: number;
  };
  tag: {
    datum: string;
    kcal: number; eiweiss: number; fett: number; kh: number;
    aktivitaet: number;
    zielKcal: number; zielEiweiss: number; zielFett: number; zielKh: number;
    eintraege: FoodEntry[];
    aktivitaeten: ActivityEntry[];
  };
  recent: RecentFood[];
  woche: {
    avgKcal: number;
    avgProtein: number;
    bilanz: number;
    geloggteTage: number;
    streak: number;
    totalDays: number;
    tage: { datum: string; kcal: number; ziel: number; geloggt: boolean }[];
  };
  gewicht: { wert: number; datum: string; delta7: number | null } | null;
}
