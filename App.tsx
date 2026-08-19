import { useEffect, useMemo, useState } from 'react';
import { Alert, Modal, Pressable, SafeAreaView, ScrollView, StatusBar, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import * as Notifications from 'expo-notifications';
import { templates, newExercise, newRoutine, MUSCLE_GROUPS, SET_OPTIONS, REP_OPTIONS, type Exercise, type Routine } from './src/data';
import { defaultState, loadState, saveState, type SavedState } from './src/storage';
import { supabase } from './src/supabase';

type Tab = 'Home' | 'Plans' | 'Progress' | 'Profile';
type ActiveSet = { weight: string; reps: string; rpe: string; done: boolean };
const C = { bg: '#101514', panel: '#19211f', panel2: '#222d29', text: '#f2f7f4', muted: '#9aa9a2', lime: '#c5f25e', danger: '#ff7c74' };
const kgToLb = (n: number) => n * 2.20462;
const toKg = (n: number, unit: 'kg' | 'lb') => unit === 'kg' ? n : n / 2.20462;
const showWeight = (kg: number, unit: 'kg' | 'lb') => `${(unit === 'kg' ? kg : kgToLb(kg)).toFixed(1).replace('.0', '')} ${unit}`;

export default function App() {
  const [state, setState] = useState<SavedState>(defaultState);
  const [ready, setReady] = useState(false); const [tab, setTab] = useState<Tab>('Home');
  const [active, setActive] = useState<Routine | null>(null); const [plansOpen, setPlansOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  useEffect(() => { loadState().then(v => { setState(v); setReady(true); }); }, []);
  useEffect(() => { if (ready) saveState(state); }, [state, ready]);
  const update = (patch: Partial<SavedState>) => setState(s => ({ ...s, ...patch }));
  const startRoutine = (r: Routine) => { if (r.exercises.length === 0) { Alert.alert('Add exercises first', "This plan doesn't have any exercises yet. Edit it to add some."); return; } setActive(r); };
  const addRoutine = (r: Routine) => update({ routines: [...state.routines, r] });
  const updateRoutine = (r: Routine) => update({ routines: state.routines.map(x => x.id === r.id ? r : x) });
  const deleteRoutine = (id: string) => update({ routines: state.routines.filter(x => x.id !== id) });
  if (!ready) return <SafeAreaView style={styles.screen}><Text style={styles.brand}>ZENO<Text style={styles.brandAccent}>FIT</Text></Text></SafeAreaView>;
  if (!state.profile.onboardingDone) return <Onboarding done={(name, unit) => update({ profile: { ...state.profile, name, unit, onboardingDone: true } })} />;
  if (active) return <Workout routine={active} unit={state.profile.unit} finish={(volume, records) => { update({ completed: state.completed + 1, volume: state.volume + volume, records: { ...state.records, ...records } }); setActive(null); setTab('Progress'); }} cancel={() => setActive(null)} />;
  return <SafeAreaView style={styles.screen}><StatusBar barStyle="light-content" />
    <View style={styles.header}><Text style={styles.brand}>ZENO<Text style={styles.brandAccent}>FIT</Text></Text><Pressable onPress={() => setTab('Profile')}><Text style={styles.avatar}>{state.profile.name.slice(0, 1).toUpperCase() || 'Z'}</Text></Pressable></View>
    {tab === 'Home' && <Home state={state} start={startRoutine} browse={() => setTab('Plans')} />}
    {tab === 'Plans' && <Plans routines={state.routines} start={startRoutine} add={addRoutine} updateRoutine={updateRoutine} deleteRoutine={deleteRoutine} />}
    {tab === 'Progress' && <Progress state={state} />}
    {tab === 'Profile' && <Profile state={state} update={update} openAuth={() => setAuthOpen(true)} />}
    <View style={styles.tabs}>{(['Home', 'Plans', 'Progress', 'Profile'] as Tab[]).map(x => <Pressable key={x} style={styles.tab} onPress={() => setTab(x)}><Text style={[styles.tabIcon, tab === x && styles.tabActive]}>{x === 'Home' ? '⌂' : x === 'Plans' ? '▤' : x === 'Progress' ? '↗' : '◉'}</Text><Text style={[styles.tabLabel, tab === x && styles.tabActive]}>{x}</Text></Pressable>)}</View>
    <Auth visible={authOpen} close={() => setAuthOpen(false)} />
  </SafeAreaView>;
}

function Onboarding({ done }: { done: (name: string, unit: 'kg' | 'lb') => void }) { const [name, setName] = useState(''); const [unit, setUnit] = useState<'kg' | 'lb'>('kg'); return <SafeAreaView style={styles.screen}><View style={styles.onboard}><Text style={styles.brand}>ZENO<Text style={styles.brandAccent}>FIT</Text></Text><Text style={styles.hero}>Train with intention.</Text><Text style={styles.sub}>Your routines, lifts, and progress—made simple.</Text><Text style={styles.label}>WHAT SHOULD WE CALL YOU?</Text><TextInput value={name} onChangeText={setName} placeholder="Your name" placeholderTextColor={C.muted} style={styles.input} /><Text style={styles.label}>PREFERRED UNIT</Text><View style={styles.row}>{(['kg', 'lb'] as const).map(u => <Pressable key={u} onPress={() => setUnit(u)} style={[styles.choice, unit === u && styles.choiceOn]}><Text style={styles.choiceText}>{u.toUpperCase()}</Text></Pressable>)}</View><Pressable style={styles.primary} onPress={() => done(name.trim() || 'Athlete', unit)}><Text style={styles.primaryText}>START TRAINING →</Text></Pressable><Text style={styles.fine}>You can update units and reminders anytime.</Text></View></SafeAreaView> }

function Home({ state, start, browse }: { state: SavedState; start: (r: Routine) => void; browse: () => void }) { const suggested = state.routines[0] || templates[0]; return <ScrollView contentContainerStyle={styles.content}><Text style={styles.eyebrow}>READY WHEN YOU ARE</Text><Text style={styles.title}>Hey, {state.profile.name}.</Text><View style={styles.feature}><Text style={styles.featureLabel}>TODAY'S SESSION</Text><Text style={styles.featureTitle}>{suggested.name}</Text><Text style={styles.sub}>{suggested.exercises.length} exercises · {suggested.duration}</Text><Pressable style={styles.primary} onPress={() => start(suggested)}><Text style={styles.primaryText}>START WORKOUT</Text></Pressable></View><Text style={styles.section}>Your week</Text><View style={styles.stats}><Stat value={String(state.completed)} label="Workouts" /><Stat value={`${Math.round(state.volume / 1000 * 10) / 10}k`} label="Volume (kg)" /><Stat value={String(Object.keys(state.records).length)} label="Records" /></View><Pressable style={styles.secondary} onPress={browse}><Text style={styles.secondaryText}>Browse workout plans</Text><Text style={styles.secondaryText}>→</Text></Pressable></ScrollView> }
function Stat({ value, label }: { value: string; label: string }) { return <View style={styles.stat}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View> }

function Plans({ routines, start, add, updateRoutine, deleteRoutine }: { routines: Routine[]; start: (r: Routine) => void; add: (r: Routine) => void; updateRoutine: (r: Routine) => void; deleteRoutine: (id: string) => void }) {
  const [editorVisible, setEditorVisible] = useState(false);
  const [editing, setEditing] = useState<Routine | null>(null);

  const openNew = () => { setEditing(null); setEditorVisible(true); };
  const openEdit = (r: Routine) => { setEditing(r); setEditorVisible(true); };
  const onSave = (r: Routine) => { if (editing) updateRoutine(r); else add(r); };
  const duplicateTemplate = (t: Routine) => add({ ...t, id: `custom-${Date.now()}`, name: `${t.name} (copy)`, template: false });
  const confirmDelete = (r: Routine) => Alert.alert('Delete plan?', `"${r.name}" will be removed permanently.`, [{ text: 'Cancel' }, { text: 'Delete', style: 'destructive', onPress: () => deleteRoutine(r.id) }]);

  return <ScrollView contentContainerStyle={styles.content}>
    <View style={styles.titleRow}><View><Text style={styles.eyebrow}>YOUR TRAINING</Text><Text style={styles.title}>Workout plans</Text></View><Pressable style={styles.add} onPress={openNew}><Text style={styles.addText}>＋</Text></Pressable></View>

    {routines.length > 0 && <Text style={styles.section}>MY PLANS</Text>}
    {routines.map(r => <View style={styles.routine} key={r.id}>
      <View style={styles.routineTop}><View><Text style={styles.routineName}>{r.name}</Text><Text style={styles.sub}>{r.focus}</Text></View><Text style={styles.duration}>{r.duration}</Text></View>
      <Text style={styles.exercisePreview}>{r.exercises.length ? r.exercises.map(e => e.name).join(' · ') : 'No exercises yet — tap Edit to add some'}</Text>
      <View style={styles.row}>
        <Pressable style={[styles.secondary, styles.flex1]} onPress={() => start(r)}><Text style={styles.secondaryText}>Start</Text></Pressable>
        <Pressable style={[styles.secondary, styles.flex1]} onPress={() => openEdit(r)}><Text style={styles.secondaryText}>Edit</Text></Pressable>
        <Pressable style={[styles.secondary, styles.flex1]} onPress={() => confirmDelete(r)}><Text style={[styles.secondaryText, styles.dangerText]}>Delete</Text></Pressable>
      </View>
    </View>)}

    <Text style={styles.section}>TEMPLATES</Text>
    {templates.map(t => <View style={styles.routine} key={t.id}>
      <View style={styles.routineTop}><View><Text style={styles.routineName}>{t.name}</Text><Text style={styles.sub}>{t.focus}</Text></View><Text style={styles.duration}>{t.duration}</Text></View>
      <Text style={styles.exercisePreview}>{t.exercises.map(e => e.name).join(' · ')}</Text>
      <View style={styles.row}>
        <Pressable style={[styles.secondary, styles.flex1]} onPress={() => start(t)}><Text style={styles.secondaryText}>Start</Text></Pressable>
        <Pressable style={[styles.secondary, styles.flex1]} onPress={() => duplicateTemplate(t)}><Text style={styles.secondaryText}>Customize</Text></Pressable>
      </View>
    </View>)}

    <PlanEditor visible={editorVisible} initial={editing} close={() => setEditorVisible(false)} save={onSave} />
  </ScrollView>;
}

function PlanEditor({ visible, initial, close, save }: { visible: boolean; initial: Routine | null; close: () => void; save: (r: Routine) => void }) {
  const [name, setName] = useState(''); const [focus, setFocus] = useState(''); const [duration, setDuration] = useState('45 min');
  const [exercises, setExercises] = useState<Exercise[]>([]);

  useEffect(() => {
    if (!visible) return;
    const base = initial ?? newRoutine();
    setName(initial ? base.name : ''); setFocus(base.focus); setDuration(base.duration); setExercises(base.exercises);
  }, [visible, initial]);

  const addEx = () => setExercises(ex => [...ex, newExercise()]);
  const updateEx = (id: string, patch: Partial<Exercise>) => setExercises(ex => ex.map(e => e.id === id ? { ...e, ...patch } : e));
  const removeEx = (id: string) => setExercises(ex => ex.filter(e => e.id !== id));
  const moveEx = (id: string, dir: -1 | 1) => setExercises(ex => {
    const i = ex.findIndex(e => e.id === id); const j = i + dir;
    if (j < 0 || j >= ex.length) return ex;
    const copy = [...ex]; [copy[i], copy[j]] = [copy[j], copy[i]]; return copy;
  });

  const canSave = name.trim().length > 0 && exercises.length > 0 && exercises.every(e => e.name.trim().length > 0);
  const onSave = () => { save({ id: initial?.id ?? newRoutine().id, name: name.trim(), focus: focus.trim() || 'Custom plan', duration: duration.trim() || '45 min', exercises, template: false }); close(); };

  return <Modal visible={visible} animationType="slide" onRequestClose={close}>
    <SafeAreaView style={styles.screen}>
      <View style={styles.workHeader}>
        <Pressable onPress={close}><Text style={styles.back}>‹</Text></Pressable>
        <Text style={styles.workTitle}>{initial ? 'Edit plan' : 'New plan'}</Text>
        <Pressable onPress={onSave} disabled={!canSave}><Text style={[styles.secondaryText, styles.saveText, !canSave && styles.saveTextDisabled]}>SAVE</Text></Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.label}>PLAN NAME</Text>
        <TextInput value={name} onChangeText={setName} placeholder="e.g. Leg Day" placeholderTextColor={C.muted} style={styles.input} />
        <Text style={styles.label}>FOCUS</Text>
        <TextInput value={focus} onChangeText={setFocus} placeholder="e.g. Strength · Lower body" placeholderTextColor={C.muted} style={styles.input} />
        <Text style={styles.label}>DURATION</Text>
        <TextInput value={duration} onChangeText={setDuration} placeholder="e.g. 45 min" placeholderTextColor={C.muted} style={styles.input} />

        <View style={styles.titleRow}><Text style={styles.section}>Exercises</Text><Pressable style={styles.add} onPress={addEx}><Text style={styles.addText}>＋</Text></Pressable></View>

        {exercises.length === 0 && <View style={styles.empty}><Text style={styles.emptyIcon}>＋</Text><Text style={styles.routineName}>No exercises yet</Text><Text style={styles.sub}>Tap the + button to add your first exercise.</Text></View>}

        {exercises.map((e, i) => <ExerciseRow key={e.id} exercise={e} onChange={patch => updateEx(e.id, patch)} onRemove={() => removeEx(e.id)} onMove={dir => moveEx(e.id, dir)} isFirst={i === 0} isLast={i === exercises.length - 1} />)}
      </ScrollView>
    </SafeAreaView>
  </Modal>;
}

function ExerciseRow({ exercise, onChange, onRemove, onMove, isFirst, isLast }: { exercise: Exercise; onChange: (patch: Partial<Exercise>) => void; onRemove: () => void; onMove: (dir: -1 | 1) => void; isFirst: boolean; isLast: boolean }) {
  return <View style={styles.exerciseEdit}>
    <View style={styles.exerciseEditTop}>
      <TextInput value={exercise.name} onChangeText={name => onChange({ name })} placeholder="Exercise name" placeholderTextColor={C.muted} style={[styles.input, styles.flex1]} />
      <Pressable onPress={onRemove} style={styles.removeBtn}><Text style={styles.removeBtnText}>✕</Text></Pressable>
    </View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.muscleChips}>
      {MUSCLE_GROUPS.map(m => <Pressable key={m} onPress={() => onChange({ muscle: m })} style={[styles.muscleChip, exercise.muscle === m && styles.muscleChipOn]}><Text style={[styles.muscleChipText, exercise.muscle === m && styles.muscleChipTextOn]}>{m}</Text></Pressable>)}
    </ScrollView>
    <Text style={styles.miniLabel}>SETS</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.muscleChips}>
      {SET_OPTIONS.map(n => <Pressable key={n} onPress={() => onChange({ sets: n })} style={[styles.muscleChip, exercise.sets === n && styles.muscleChipOn]}><Text style={[styles.muscleChipText, exercise.sets === n && styles.muscleChipTextOn]}>{n}</Text></Pressable>)}
    </ScrollView>
    <Text style={styles.miniLabel}>REPS</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.muscleChips}>
      {REP_OPTIONS.map(r => <Pressable key={r} onPress={() => onChange({ reps: r })} style={[styles.muscleChip, exercise.reps === r && styles.muscleChipOn]}><Text style={[styles.muscleChipText, exercise.reps === r && styles.muscleChipTextOn]}>{r}</Text></Pressable>)}
    </ScrollView>
    <View style={styles.moveRow}>
      <Pressable disabled={isFirst} onPress={() => onMove(-1)} style={[styles.moveBtn, isFirst && styles.moveBtnDisabled]}><Text style={styles.moveBtnText}>↑ Move up</Text></Pressable>
      <Pressable disabled={isLast} onPress={() => onMove(1)} style={[styles.moveBtn, isLast && styles.moveBtnDisabled]}><Text style={styles.moveBtnText}>↓ Move down</Text></Pressable>
    </View>
  </View>;
}

function Workout({ routine, unit, finish, cancel }: { routine: Routine; unit: 'kg' | 'lb'; finish: (volume: number, records: Record<string, number>) => void; cancel: () => void }) { const [sets, setSets] = useState<Record<string, ActiveSet[]>>(() => Object.fromEntries(routine.exercises.map(e => [e.id, Array.from({ length: e.sets }, () => ({ weight: '', reps: '', rpe: '', done: false }))]))); const [notes, setNotes] = useState(''); const [seconds, setSeconds] = useState(0); useEffect(() => { const id = setInterval(() => setSeconds(x => x + 1), 1000); return () => clearInterval(id); }, []); const edit = (id: string, i: number, field: keyof ActiveSet, value: string | boolean) => setSets(s => ({ ...s, [id]: s[id].map((x, n) => n === i ? { ...x, [field]: value } : x) })); const complete = () => { let volume = 0; const records: Record<string, number> = {}; routine.exercises.forEach(e => sets[e.id].forEach(s => { if (s.done) { const kg = toKg(Number(s.weight) || 0, unit); volume += kg * (Number(s.reps) || 0); records[e.name] = Math.max(records[e.name] || 0, kg); }})); finish(volume, records); };
 return <SafeAreaView style={styles.screen}><View style={styles.workHeader}><Pressable onPress={() => Alert.alert('Discard workout?', 'Your logged sets will be lost.', [{ text: 'Keep training' }, { text: 'Discard', style: 'destructive', onPress: cancel }])}><Text style={styles.back}>‹</Text></Pressable><View><Text style={styles.workTitle}>{routine.name}</Text><Text style={styles.timer}>{String(Math.floor(seconds / 60)).padStart(2, '0')}:{String(seconds % 60).padStart(2, '0')}</Text></View><Text style={styles.live}>LIVE</Text></View><ScrollView contentContainerStyle={styles.content}>{routine.exercises.map(e => <View key={e.id} style={styles.exercise}><Text style={styles.routineName}>{e.name}</Text><Text style={styles.sub}>{e.muscle} · {e.sets} × {e.reps}</Text><View style={styles.setHeader}><Text>SET</Text><Text>{unit.toUpperCase()}</Text><Text>REPS</Text><Text>RPE</Text><Text>DONE</Text></View>{sets[e.id].map((s, i) => <View style={styles.setRow} key={i}><Text style={styles.setNum}>{i + 1}</Text>{(['weight', 'reps', 'rpe'] as const).map(f => <TextInput key={f} value={s[f]} onChangeText={v => edit(e.id, i, f, v)} keyboardType="decimal-pad" placeholder="–" placeholderTextColor={C.muted} style={styles.setInput} />)}<Pressable onPress={() => edit(e.id, i, 'done', !s.done)} style={[styles.check, s.done && styles.checkOn]}><Text>{s.done ? '✓' : ''}</Text></Pressable></View>)}</View>)}<Text style={styles.label}>SESSION NOTES</Text><TextInput value={notes} onChangeText={setNotes} placeholder="How did it feel?" placeholderTextColor={C.muted} style={[styles.input, styles.notes]} multiline /><Pressable style={styles.primary} onPress={complete}><Text style={styles.primaryText}>FINISH WORKOUT</Text></Pressable></ScrollView></SafeAreaView> }

function Progress({ state }: { state: SavedState }) { const entries = Object.entries(state.records); return <ScrollView contentContainerStyle={styles.content}><Text style={styles.eyebrow}>YOUR RESULTS</Text><Text style={styles.title}>Progress</Text><View style={styles.stats}><Stat value={String(state.completed)} label="Sessions" /><Stat value={`${Math.round(state.volume).toLocaleString()}`} label="Volume (kg)" /><Stat value={String(entries.length)} label="PRs" /></View><Text style={styles.section}>Personal records</Text>{entries.length ? entries.map(([name, kg]) => <View style={styles.record} key={name}><View><Text style={styles.routineName}>{name}</Text><Text style={styles.sub}>Best lifted weight</Text></View><Text style={styles.recordValue}>{showWeight(kg, state.profile.unit)}</Text></View>) : <View style={styles.empty}><Text style={styles.emptyIcon}>↗</Text><Text style={styles.routineName}>Your progress starts here</Text><Text style={styles.sub}>Complete a workout to see your strength trends and personal records.</Text></View>}<Text style={styles.section}>Strength trends</Text><View style={styles.chart}><Text style={styles.sub}>Charts will build from completed workout history.</Text><View style={styles.chartLine}><View style={[styles.bar, { height: 22 }]} /><View style={[styles.bar, { height: 42 }]} /><View style={[styles.bar, { height: 30 }]} /><View style={[styles.bar, { height: 62 }]} /><View style={[styles.bar, { height: 78 }]} /></View></View></ScrollView> }

function Profile({ state, update, openAuth }: { state: SavedState; update: (p: Partial<SavedState>) => void; openAuth: () => void }) { const profile = state.profile; const toggleReminder = async (on: boolean) => { if (on) { await Notifications.requestPermissionsAsync(); await Notifications.cancelAllScheduledNotificationsAsync(); await Notifications.scheduleNotificationAsync({ content: { title: 'Time to train', body: 'Your next workout is waiting.' }, trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: 18, minute: 0 } as Notifications.NotificationTriggerInput }); } else await Notifications.cancelAllScheduledNotificationsAsync(); update({ profile: { ...profile, reminder: on } }); }; return <ScrollView contentContainerStyle={styles.content}><Text style={styles.eyebrow}>ACCOUNT</Text><Text style={styles.title}>{profile.name}</Text><Text style={styles.section}>Preferences</Text><View style={styles.setting}><View><Text style={styles.routineName}>Weight unit</Text><Text style={styles.sub}>Display weights in your preferred unit</Text></View><View style={styles.unitToggle}>{(['kg', 'lb'] as const).map(u => <Pressable key={u} onPress={() => update({ profile: { ...profile, unit: u } })}><Text style={[styles.unit, profile.unit === u && styles.unitOn]}>{u.toUpperCase()}</Text></Pressable>)}</View></View><View style={styles.setting}><View><Text style={styles.routineName}>Workout reminder</Text><Text style={styles.sub}>Daily at 6:00 PM</Text></View><Switch value={profile.reminder} onValueChange={toggleReminder} trackColor={{ true: C.lime }} /></View><Text style={styles.section}>Cloud sync</Text><View style={styles.sync}><Text style={styles.sub}>{supabase ? 'Sign in to secure your training history.' : 'Demo mode — add Supabase keys to enable cloud sync.'}</Text><Pressable style={styles.secondary} onPress={openAuth}><Text style={styles.secondaryText}>{supabase ? 'Sign in or create account' : 'View connection setup'}</Text><Text style={styles.secondaryText}>→</Text></Pressable></View></ScrollView> }
function Auth({ visible, close }: { visible: boolean; close: () => void }) { const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [busy, setBusy] = useState(false); const submit = async (signup: boolean) => { if (!supabase) return Alert.alert('Cloud sync setup', 'Copy .env.example to .env and add your Supabase project URL and anonymous key. Then restart Expo.'); setBusy(true); const res = signup ? await supabase.auth.signUp({ email, password }) : await supabase.auth.signInWithPassword({ email, password }); setBusy(false); if (res.error) Alert.alert('Could not continue', res.error.message); else { Alert.alert(signup ? 'Check your inbox' : 'Signed in', signup ? 'Confirm your email to finish setting up your account.' : 'Your cloud session is active.'); close(); } }; return <Modal visible={visible} transparent animationType="slide"><View style={styles.modalShade}><View style={styles.modal}><Text style={styles.modalTitle}>Cloud sync</Text><TextInput autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} placeholder="Email" placeholderTextColor={C.muted} style={styles.input}/><TextInput secureTextEntry value={password} onChangeText={setPassword} placeholder="Password (6+ characters)" placeholderTextColor={C.muted} style={styles.input}/><Pressable style={styles.primary} onPress={() => submit(false)} disabled={busy}><Text style={styles.primaryText}>SIGN IN</Text></Pressable><Pressable onPress={() => submit(true)}><Text style={styles.link}>Create an account</Text></Pressable><Pressable onPress={close}><Text style={styles.cancelText}>Close</Text></Pressable></View></View></Modal> }

const styles = StyleSheet.create({ screen:{flex:1,backgroundColor:C.bg}, content:{padding:20,paddingBottom:105,gap:16}, header:{paddingHorizontal:20,paddingTop:12,paddingBottom:8,flexDirection:'row',justifyContent:'space-between',alignItems:'center'}, brand:{fontSize:20,fontWeight:'900',letterSpacing:1.5,color:C.text},brandAccent:{color:C.lime},avatar:{backgroundColor:C.panel2,color:C.lime,width:34,height:34,textAlign:'center',paddingTop:7,borderRadius:17,fontWeight:'800'},eyebrow:{fontSize:11,fontWeight:'800',letterSpacing:1.5,color:C.lime},title:{fontSize:32,fontWeight:'800',color:C.text},hero:{fontSize:40,fontWeight:'900',color:C.text,lineHeight:46},sub:{fontSize:14,color:C.muted,lineHeight:20},label:{fontSize:11,fontWeight:'800',letterSpacing:1.2,color:C.muted,marginTop:12},feature:{backgroundColor:C.panel,borderRadius:22,padding:22,gap:8},featureLabel:{color:C.lime,fontWeight:'800',fontSize:11,letterSpacing:1.2},featureTitle:{fontSize:26,fontWeight:'800',color:C.text},primary:{backgroundColor:C.lime,borderRadius:14,paddingVertical:15,alignItems:'center',marginTop:12},primaryText:{fontSize:13,fontWeight:'900',color:'#101514',letterSpacing:.8},section:{fontSize:17,fontWeight:'800',color:C.text,marginTop:12},stats:{flexDirection:'row',gap:10},stat:{flex:1,backgroundColor:C.panel,borderRadius:16,padding:14},statValue:{color:C.lime,fontSize:21,fontWeight:'900'},statLabel:{color:C.muted,fontSize:11,marginTop:3},secondary:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',borderRadius:13,padding:15,backgroundColor:C.panel2,marginTop:6},secondaryText:{color:C.text,fontSize:14,fontWeight:'700'},tabs:{position:'absolute',bottom:0,left:0,right:0,backgroundColor:'#151c1a',borderTopWidth:1,borderTopColor:'#26332e',height:73,flexDirection:'row',paddingTop:8},tab:{flex:1,alignItems:'center',gap:3},tabIcon:{color:C.muted,fontSize:20},tabLabel:{color:C.muted,fontSize:10,fontWeight:'700'},tabActive:{color:C.lime},onboard:{flex:1,justifyContent:'center',padding:28,gap:13},input:{borderWidth:1,borderColor:'#34423c',borderRadius:12,color:C.text,fontSize:16,padding:14,marginTop:6},row:{flexDirection:'row',gap:10},choice:{flex:1,padding:14,borderRadius:12,alignItems:'center',backgroundColor:C.panel2},choiceOn:{backgroundColor:C.lime},choiceText:{color:C.text,fontWeight:'800'},fine:{color:C.muted,textAlign:'center',fontSize:12},titleRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},add:{width:42,height:42,borderRadius:21,backgroundColor:C.lime,alignItems:'center',justifyContent:'center'},addText:{fontSize:25,fontWeight:'500',color:C.bg},routine:{padding:17,borderRadius:18,gap:6,backgroundColor:C.panel},routineTop:{flexDirection:'row',justifyContent:'space-between',gap:10},routineName:{fontSize:17,color:C.text,fontWeight:'800'},duration:{fontSize:12,color:C.lime,fontWeight:'700'},exercisePreview:{fontSize:12,color:C.muted,marginTop:4},modalShade:{flex:1,justifyContent:'flex-end',backgroundColor:'#000a'},modal:{backgroundColor:C.panel,borderTopLeftRadius:25,borderTopRightRadius:25,padding:24,gap:10},modalTitle:{color:C.text,fontSize:24,fontWeight:'900'},cancelText:{color:C.muted,textAlign:'center',fontWeight:'700',paddingTop:12},link:{color:C.lime,textAlign:'center',fontWeight:'800',paddingTop:6},workHeader:{padding:20,flexDirection:'row',alignItems:'center',justifyContent:'space-between',borderBottomWidth:1,borderColor:'#26332e'},back:{fontSize:40,color:C.text,lineHeight:35},workTitle:{color:C.text,fontSize:16,fontWeight:'800'},timer:{color:C.muted,fontSize:12,textAlign:'center'},live:{color:C.lime,fontWeight:'900',fontSize:11},exercise:{backgroundColor:C.panel,borderRadius:18,padding:15,gap:7},setHeader:{flexDirection:'row',alignItems:'center',marginTop:8,paddingLeft:5},setRow:{flexDirection:'row',alignItems:'center',gap:5},setNum:{width:32,textAlign:'center',color:C.muted,fontWeight:'800'},setInput:{width:54,backgroundColor:C.panel2,borderRadius:8,color:C.text,textAlign:'center',paddingVertical:9},check:{marginLeft:2,width:33,height:33,borderRadius:8,backgroundColor:C.panel2,alignItems:'center',justifyContent:'center'},checkOn:{backgroundColor:C.lime},notes:{height:85,textAlignVertical:'top'},record:{padding:17,backgroundColor:C.panel,borderRadius:15,flexDirection:'row',justifyContent:'space-between',alignItems:'center'},recordValue:{color:C.lime,fontSize:18,fontWeight:'900'},empty:{backgroundColor:C.panel,borderRadius:18,padding:25,gap:6,alignItems:'center'},emptyIcon:{fontSize:32,color:C.lime},chart:{backgroundColor:C.panel,borderRadius:18,padding:18,gap:12},chartLine:{height:90,flexDirection:'row',alignItems:'flex-end',justifyContent:'space-around'},bar:{width:26,borderRadius:6,backgroundColor:C.lime},setting:{backgroundColor:C.panel,borderRadius:16,padding:16,flexDirection:'row',justifyContent:'space-between',alignItems:'center'},unitToggle:{flexDirection:'row',gap:5},unit:{color:C.muted,fontWeight:'800',padding:7},unitOn:{backgroundColor:C.lime,color:C.bg,borderRadius:7},sync:{backgroundColor:C.panel,borderRadius:16,padding:16,gap:8},
  flex1:{flex:1}, dangerText:{color:C.danger}, saveText:{fontSize:13,fontWeight:'900',letterSpacing:.8}, saveTextDisabled:{opacity:0.35},
  exerciseEdit:{backgroundColor:C.panel,borderRadius:18,padding:15,gap:10,marginBottom:4},
  exerciseEditTop:{flexDirection:'row',alignItems:'center',gap:8},
  removeBtn:{width:38,height:38,borderRadius:10,backgroundColor:C.panel2,alignItems:'center',justifyContent:'center'},
  removeBtnText:{color:C.danger,fontSize:16,fontWeight:'800'},
  miniLabel:{fontSize:10,fontWeight:'800',letterSpacing:1,color:C.muted,marginTop:2},
  muscleChips:{gap:8,paddingVertical:2},
  muscleChip:{paddingHorizontal:13,paddingVertical:8,borderRadius:10,backgroundColor:C.panel2},
  muscleChipOn:{backgroundColor:C.lime},
  muscleChipText:{color:C.muted,fontSize:12,fontWeight:'700'},
  muscleChipTextOn:{color:C.bg},
  moveRow:{flexDirection:'row',gap:8},
  moveBtn:{flex:1,backgroundColor:C.panel2,borderRadius:10,paddingVertical:9,alignItems:'center'},
  moveBtnDisabled:{opacity:0.3},
  moveBtnText:{color:C.text,fontSize:12,fontWeight:'700'}
});
