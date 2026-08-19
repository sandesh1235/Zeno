import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Routine } from './data';
import type { ExerciseHistory } from './types/history';
import type { WeeklySchedule } from './types/schedule';
export type Profile = { name: string; unit: 'kg' | 'lb'; onboardingDone: boolean; reminder: boolean };
const key = 'zenofit-state-v1';
export type SavedState = { profile: Profile; routines: Routine[]; completed: number; volume: number; records: Record<string, number>; history: ExerciseHistory; schedule: WeeklySchedule };
export const defaultState: SavedState = { profile: { name: '', unit: 'kg', onboardingDone: false, reminder: false }, routines: [], completed: 0, volume: 0, records: {}, history: {}, schedule: {} };
export async function loadState() { const raw = await AsyncStorage.getItem(key); return raw ? { ...defaultState, ...JSON.parse(raw) } as SavedState : defaultState; }
export async function saveState(value: SavedState) { await AsyncStorage.setItem(key, JSON.stringify(value)); }
