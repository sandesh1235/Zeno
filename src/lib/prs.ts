import type { ExerciseHistory, LoggedSet } from '../types/history';
import { estimate1RM } from '../analytics';

export type PRType = 'weight' | '1rm';

export type PersonalRecord = {
  exercise: string;
  type: PRType;
  weight: number;
  reps: number;
  value: number;
  date: string;
};

/**
 * Finds true personal-record events from history.
 * The first-ever set for an exercise establishes a baseline; it is not a PR.
 * Weight PRs and estimated-1RM PRs are tracked independently.
 */
export function getPersonalRecords(history: ExerciseHistory): PersonalRecord[] {
  const records: PersonalRecord[] = [];

  Object.entries(history).forEach(([exercise, entries]) => {
    const ordered = [...entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    let bestWeight = -Infinity;
    let best1RM = -Infinity;

    ordered.forEach(entry => {
      entry.sets.forEach((set: LoggedSet) => {
        const oneRM = estimate1RM(set.weight, set.reps);
        const isWeightPR = bestWeight !== -Infinity && set.weight > bestWeight;
        const is1RMPR = best1RM !== -Infinity && oneRM > best1RM;

        if (isWeightPR) records.push({ exercise, type: 'weight', weight: set.weight, reps: set.reps, value: set.weight, date: entry.date });
        if (is1RMPR) records.push({ exercise, type: '1rm', weight: set.weight, reps: set.reps, value: oneRM, date: entry.date });

        bestWeight = Math.max(bestWeight, set.weight);
        best1RM = Math.max(best1RM, oneRM);
      });
    });
  });

  return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
