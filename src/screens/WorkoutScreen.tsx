import { useEffect, useState } from 'react';
import { Alert, Pressable, SafeAreaView, ScrollView, Text, TextInput, View } from 'react-native';
import type { Routine } from '../data';
import { C } from '../theme';
import { toKg, type WeightUnit } from '../lib/units';
import { styles } from '../styles';

export type ActiveSet = { weight: string; reps: string; rpe: string; done: boolean };

export function Workout({ routine, unit, finish, cancel }: { routine: Routine; unit: WeightUnit; finish: (volume: number, records: Record<string, number>) => void; cancel: () => void }) {
  const [sets, setSets] = useState<Record<string, ActiveSet[]>>(() => Object.fromEntries(routine.exercises.map(e => [e.id, Array.from({ length: e.sets }, () => ({ weight: '', reps: '', rpe: '', done: false }))])));
  const [notes, setNotes] = useState('');
  const [seconds, setSeconds] = useState(0);
  useEffect(() => { const id = setInterval(() => setSeconds(x => x + 1), 1000); return () => clearInterval(id); }, []);
  const edit = (id: string, i: number, field: keyof ActiveSet, value: string | boolean) => setSets(s => ({ ...s, [id]: s[id].map((x, n) => n === i ? { ...x, [field]: value } : x) }));
  const complete = () => {
    let volume = 0; const records: Record<string, number> = {};
    routine.exercises.forEach(e => sets[e.id].forEach(s => {
      if (s.done) {
        const kg = toKg(Number(s.weight) || 0, unit);
        volume += kg * (Number(s.reps) || 0);
        records[e.name] = Math.max(records[e.name] || 0, kg);
      }
    }));
    finish(volume, records);
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
    <ScrollView contentContainerStyle={styles.content}>
      {routine.exercises.map(e => <View key={e.id} style={styles.exercise}>
        <Text style={styles.routineName}>{e.name}</Text>
        <Text style={styles.sub}>{e.muscle} · {e.sets} × {e.reps}</Text>
        <View style={styles.setHeader}>
          <Text>SET</Text><Text>{unit.toUpperCase()}</Text><Text>REPS</Text><Text>RPE</Text><Text>DONE</Text>
        </View>
        {sets[e.id].map((s, i) => <View style={styles.setRow} key={i}>
          <Text style={styles.setNum}>{i + 1}</Text>
          {(['weight', 'reps', 'rpe'] as const).map(f =>
            <TextInput key={f} value={s[f]} onChangeText={v => edit(e.id, i, f, v)}
              keyboardType="decimal-pad" placeholder="–" placeholderTextColor={C.muted}
              style={styles.setInput} />
          )}
          <Pressable onPress={() => edit(e.id, i, 'done', !s.done)} style={[styles.check, s.done && styles.checkOn]}>
            <Text>{s.done ? '✓' : ''}</Text>
          </Pressable>
        </View>)}
      </View>)}
      <Text style={styles.label}>SESSION NOTES</Text>
      <TextInput value={notes} onChangeText={setNotes} placeholder="How did it feel?"
        placeholderTextColor={C.muted} style={[styles.input, styles.notes]} multiline />
      <Pressable style={styles.primary} onPress={complete}><Text style={styles.primaryText}>FINISH WORKOUT</Text></Pressable>
    </ScrollView>
  </SafeAreaView>;
}
