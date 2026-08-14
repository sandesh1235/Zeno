import { MUSCLE_GROUPS, type Exercise, type Routine } from '../data';
import { WEEKDAYS, type Weekday, type WeeklySchedule } from '../types/schedule';

const REQUIRED_COLUMNS = ['Day', 'PlanName', 'ExerciseName'] as const;

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') { current += '"'; i++; } else { inQuotes = false; }
      } else current += char;
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      cells.push(current); current = '';
    } else {
      current += char;
    }
  }
  cells.push(current);
  return cells.map(c => c.trim());
}

export type CsvImportResult = { routines: Routine[]; schedule: WeeklySchedule };

type Group = { day: Weekday; planName: string; focus: string; duration: string; exercises: Exercise[] };

export function parseScheduleCsv(text: string): CsvImportResult {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length < 2) throw new Error('CSV must have a header row and at least one data row.');

  const header = parseCsvLine(lines[0]);
  for (const col of REQUIRED_COLUMNS) {
    if (!header.includes(col)) throw new Error(`Missing required column "${col}".`);
  }
  const idx = (name: string) => header.indexOf(name);
  const dayIdx = idx('Day'), planIdx = idx('PlanName'), focusIdx = idx('Focus'), durationIdx = idx('Duration'),
    exerciseIdx = idx('ExerciseName'), muscleIdx = idx('Muscle'), setsIdx = idx('Sets'), repsIdx = idx('Reps');

  const groups = new Map<string, Group>();
  const dayToGroupKey = new Map<Weekday, string>();

  for (let i = 1; i < lines.length; i++) {
    const row = parseCsvLine(lines[i]);
    const rowNum = i + 1;

    const dayRaw = row[dayIdx] ?? '';
    const day = WEEKDAYS.find(d => d.toLowerCase() === dayRaw.toLowerCase());
    if (!day) throw new Error(`Row ${rowNum}: "${dayRaw}" is not a valid weekday (Monday–Sunday).`);

    const planName = (row[planIdx] ?? '').trim();
    if (!planName) throw new Error(`Row ${rowNum}: PlanName is required.`);

    const exerciseName = (row[exerciseIdx] ?? '').trim();
    if (!exerciseName) throw new Error(`Row ${rowNum}: ExerciseName is required.`);

    const key = `${day}|${planName}`;
    const existingKeyForDay = dayToGroupKey.get(day);
    if (existingKeyForDay && existingKeyForDay !== key) {
      const existingPlanName = existingKeyForDay.split('|')[1];
      throw new Error(`Row ${rowNum}: ${day} is assigned to both "${existingPlanName}" and "${planName}" — each day can only have one plan.`);
    }
    dayToGroupKey.set(day, key);

    if (!groups.has(key)) {
      groups.set(key, {
        day, planName,
        focus: (focusIdx >= 0 ? row[focusIdx] : '') || 'Custom plan',
        duration: (durationIdx >= 0 ? row[durationIdx] : '') || '45 min',
        exercises: [],
      });
    }

    const setsRaw = setsIdx >= 0 ? row[setsIdx] : '';
    const sets = Math.max(1, parseInt(setsRaw, 10) || 3);
    const muscle = (muscleIdx >= 0 ? row[muscleIdx] : '').trim() || MUSCLE_GROUPS[0];

    groups.get(key)!.exercises.push({
      id: `ex-${uid()}`,
      name: exerciseName,
      muscle,
      sets,
      reps: (repsIdx >= 0 ? row[repsIdx] : '') || '8–12',
    });
  }

  const routines: Routine[] = [];
  const schedule: WeeklySchedule = {};
  for (const group of groups.values()) {
    const id = `custom-${uid()}`;
    routines.push({ id, name: group.planName, focus: group.focus, duration: group.duration, exercises: group.exercises, template: false });
    schedule[group.day] = id;
  }

  return { routines, schedule };
}
