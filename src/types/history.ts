export type LoggedSet = { weight: number; reps: number; rpe: number | null };

export type ExerciseHistoryEntry = {
  date: string;
  routineId: string;
  sets: LoggedSet[];
};

export type ExerciseHistory = Record<string, ExerciseHistoryEntry[]>;
