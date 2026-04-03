export interface FavoritItem {
  name: string;
  kcal: number;
  eiweiss: number;
  fett: number;
  kh: number;
  unit: 'g' | 'ml' | 'Stück' | 'Portion';
  unitWeight?: number; // grams per unit (for Stück/Portion)
}
