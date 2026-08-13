import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, SafeAreaView, ScrollView, Text, TextInput, View } from 'react-native';
import type { Routine } from '../data';
import { C } from '../theme';
import type { WeightUnit } from '../lib/units';
import { styles } from '../styles';
import { ExerciseCard } from '../components/workout/ExerciseCard';
import { ProgressBar } from '../components/workout/ProgressBar';
import { appendHistoryEntry, getExerciseSummary, getPrefillForSet } from '../lib/workoutHistory';
import type { ExerciseHistory, LoggedSet } from '../types/history';

export type ActiveSet = { weight: string; reps: string; rpe: string; done: boolean };

const seedSet = (history: ExerciseHistory, exerciseName: string, setIndex: number): ActiveSet => {
  const prefill = getPrefillForSet(history, exerciseName, setIndex);
  if (!prefill) return { weight: '', reps: '', rpe: '', done: false };
  return { weight: String(prefill.weight), reps: String(prefill.reps), rpe: prefill.rpe === null ? '' : String(prefill.rpe), done: false };
};

export function Workout({ routine, unit, history, finish, cancel }: {
  routine: Routine;
  unit: WeightUnit;
  history: ExerciseHistory;
  finish: (volume: number, records: Record<string, number>, history: ExerciseHistory) => void;
  cancel: () => void;
}) {
  const [sets, setSets] = useState<Record<string, ActiveSet[]>>(() => Object.fromEntries(routine.exercises.map(e => [e.id, Array.from({ length: e.sets }, (_, i) => seedSet(history, e.name, i))])));
  const summaries = useMemo(() => Object.fromEntries(routine.exercises.map(e => [e.id, getExerciseSummary(history, e.name)])), [routine, history]);
  const completedExercises = useMemo(() => routine.exercises.filter(e => sets[e.id].every(s => s.done)).length, [routine, sets]);
  const [notes, setNotes] = useState('');
  const [seconds, setSeconds] = useState(0);
  useEffect(() => { const id = setInterval(() => setSeconds(x => x + 1), 1000); return () => clearInterval(id); }, []);
  const edit = (id: string, i: number, field: keyof ActiveSet, value: string | boolean) => setSets(s => ({ ...s, [id]: s[id].map((x, n) => n === i ? { ...x, [field]: value } : x) }));
  const complete = () => {
    let volume = 0; const records: Record<string, number> = {};
    let nextHistory = history;
    routine.exercises.forEach(e => {
      const doneSets: LoggedSet[] = [];
      sets[e.id].forEach(s => {
        if (s.done) {
          const kg = Number(s.weight) || 0;
          const reps = Number(s.reps) || 0;
          volume += kg * reps;
          records[e.name] = Math.max(records[e.name] || 0, kg);
          doneSets.push({ weight: kg, reps, rpe: s.rpe === '' ? null : Number(s.rpe) });
        }
      });
      if (doneSets.length > 0) nextHistory = appendHistoryEntry(nextHistory, e.name, { date: new Date().toISOString(), routineId: routine.id, sets: doneSets });
    });
    finish(volume, records, nextHistory);
  };

  return <SafeAreaView style={styles.screen}>
    <View style={styles.workHeader}>
      <Pressable onPress={() => Alert.alert('Discard workout?', 'Your logged sets will be lost.', [{ text: 'Keep training' }, { text: 'Discard', style: 'destructive', onPress: cancel }])}>
        <Text style={styles.back}>‹</Text>
      </Pressable>
      <View>
        <Text style={styles.workTitle}>{routine.name}</Text>
        <Text style={styles.timer}>{String(Math.floor(seconds / 60)).padStart(2, '0')}:{String(seconds % 60).padStart(2, '0')}</Text>
      </View>
      <Text style={styles.live}>LIVE</Text>
    </View>
    <ProgressBar completed={completedExercises} total={routine.exercises.length} />
    <ScrollView contentContainerStyle={styles.content}>
      {routine.exercises.map(e => <ExerciseCard key={e.id} exercise={e} unit={unit} sets={sets[e.id]} summary={summaries[e.id]} onEditSet={(i, field, value) => edit(e.id, i, field, value)} />)}
      <Text style={styles.label}>SESSION NOTES</Text>
      <TextInput value={notes} onChangeText={setNotes} placeholder="How did it feel?"
        placeholderTextColor={C.muted} style={[styles.input, styles.notes]} multiline />
      <Pressable style={styles.primary} onPress={complete}><Text style={styles.primaryText}>FINISH WORKOUT</Text></Pressable>
    </ScrollView>
  </SafeAreaView>;
}
