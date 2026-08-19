export type Exercise = { id: string; name: string; muscle: string; sets: number; reps: string };
export type Routine = { id: string; name: string; focus: string; duration: string; exercises: Exercise[]; template?: boolean };

export const MUSCLE_GROUPS = ['Legs', 'Chest', 'Back', 'Shoulders', 'Arms', 'Core', 'Full Body', 'Cardio'] as const;
export const SET_OPTIONS = [1, 2, 3, 4, 5, 6, 8] as const;
export const REP_OPTIONS = ['5', '6–8', '8–10', '8–12', '10–12', '10–15', '12–15', '15–20', '20+', 'AMRAP'] as const;

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
export const newExercise = (): Exercise => ({ id: `ex-${uid()}`, name: '', muscle: MUSCLE_GROUPS[0], sets: 3, reps: '8–12' });
export const newRoutine = (): Routine => ({ id: `custom-${uid()}`, name: '', focus: 'Custom plan', duration: '45 min', exercises: [], template: false });

export const templates: Routine[] = [
  { id: 'full-body', name: 'Full Body Foundation', focus: 'Beginner · General fitness', duration: '45 min', template: true, exercises: [
    { id: 'squat', name: 'Goblet Squat', muscle: 'Legs', sets: 3, reps: '8–12' }, { id: 'press', name: 'Dumbbell Bench Press', muscle: 'Chest', sets: 3, reps: '8–12' }, { id: 'row', name: 'Seated Cable Row', muscle: 'Back', sets: 3, reps: '10–12' }
  ]},
  { id: 'ppl-push', name: 'Push Day', focus: 'Muscle gain · Push/Pull/Legs', duration: '55 min', template: true, exercises: [
    { id: 'bench', name: 'Barbell Bench Press', muscle: 'Chest', sets: 4, reps: '6–10' }, { id: 'ohp', name: 'Overhead Press', muscle: 'Shoulders', sets: 3, reps: '8–10' }, { id: 'triceps', name: 'Triceps Pushdown', muscle: 'Arms', sets: 3, reps: '10–15' }
  ]},
  { id: 'upper-lower', name: 'Upper Strength', focus: 'Strength · Upper/Lower', duration: '60 min', template: true, exercises: [
    { id: 'pullup', name: 'Lat Pulldown', muscle: 'Back', sets: 4, reps: '6–8' }, { id: 'incline', name: 'Incline Dumbbell Press', muscle: 'Chest', sets: 4, reps: '6–8' }, { id: 'curl', name: 'Hammer Curl', muscle: 'Arms', sets: 3, reps: '8–12' }
  ]}
];
