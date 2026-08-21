import type { ExerciseHistory, ExerciseHistoryEntry } from '../types/history';
import { getPersonalRecords } from './prs';

export type ComparisonGranularity = 'week' | 'month';
export type PeriodStats = { sessions: number; volume: number; sets: number; prs: number };
export type PeriodComparison = { current: PeriodStats; previous: PeriodStats };

const startOfWeek = (date: Date): Date => {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
};

const periodKey = (date: Date, granularity: ComparisonGranularity): string =>
  granularity === 'week' ? startOfWeek(date).toISOString().slice(0, 10) : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

const previousPeriodStart = (date: Date, granularity: ComparisonGranularity): Date => {
  if (granularity === 'week') { const d = startOfWeek(date); d.setDate(d.getDate() - 7); return d; }
  const d = new Date(date.getFullYear(), date.getMonth() - 1, 1); d.setHours(0, 0, 0, 0); return d;
};

export function getPeriodComparison(history: ExerciseHistory, granularity: ComparisonGranularity, now = new Date()): PeriodComparison {
  const currentKey = periodKey(now, granularity);
  const previousKey = periodKey(previousPeriodStart(now, granularity), granularity);

  const totals: Record<string, { sessions: Set<string>; volume: number; sets: number }> = {
    [currentKey]: { sessions: new Set(), volume: 0, sets: 0 },
    [previousKey]: { sessions: new Set(), volume: 0, sets: 0 },
  };

  Object.values(history).forEach((entries: ExerciseHistoryEntry[]) => {
    entries.forEach(entry => {
      const key = periodKey(new Date(entry.date), granularity);
      const bucket = totals[key];
      if (!bucket) return;
      bucket.sessions.add(new Date(entry.date).toDateString());
      bucket.volume += entry.sets.reduce((sum, set) => sum + set.weight * set.reps, 0);
      bucket.sets += entry.sets.length;
    });
  });

  // Reuses the same chronological PR detection as the Progress screen's PR list, so counts always agree with what's shown there.
  const allPRs = getPersonalRecords(history);
  const prsInPeriod = (key: string) => allPRs.filter(pr => periodKey(new Date(pr.date), granularity) === key).length;

  const toResult = (key: string): PeriodStats => ({
    sessions: totals[key].sessions.size,
    volume: totals[key].volume,
    sets: totals[key].sets,
    prs: prsInPeriod(key),
  });

  return { current: toResult(currentKey), previous: toResult(previousKey) };
}

export function percentageChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
}
