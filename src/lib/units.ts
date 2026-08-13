export type WeightUnit = 'kg' | 'lb';

const kgToLb = (n: number) => n * 2.20462;

export const toKg = (n: number, unit: WeightUnit) => (unit === 'kg' ? n : n / 2.20462);

export const showWeight = (kg: number, unit: WeightUnit) =>
  `${(unit === 'kg' ? kg : kgToLb(kg)).toFixed(1).replace('.0', '')} ${unit}`;
