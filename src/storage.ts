import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Routine } from './data';
export type Profile = { name: string; unit: 'kg' | 'lb'; onboardingDone: boolean; reminder: boolean };
export type LoggedSet = { exerciseId: string; exerciseName: string; muscle: string; setNumber: number; weightKg: number; reps: number; rpe: number | null; notes: string };
export type WorkoutLog = { id: string; routineId: string; routineName: string; startedAt: number; completedAt: number; durationSeconds: number; notes: string; sets: LoggedSet[] };
const key = 'zenofit-state-v1';
// v1 states saved before `history` existed won't have the field — defaultState below fills it in on load (see loadState), so old local data keeps working without migration.
export type SavedState = { profile: Profile; routines: Routine[]; completed: number; volume: number; records: Record<string, number>; history: WorkoutLog[] };
export const defaultState: SavedState = { profile: { name: '', unit: 'kg', onboardingDone: false, reminder: false }, routines: [], completed: 0, volume: 0, records: {}, history: [] };
export async function loadState() { const raw = await AsyncStorage.getItem(key); return raw ? { ...defaultState, ...JSON.parse(raw) } as SavedState : defaultState; }
export async function saveState(value: SavedState) { await AsyncStorage.setItem(key, JSON.stringify(value)); }
