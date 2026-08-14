import type { Routine } from '../data';
import { WEEKDAYS, type Weekday } from '../types/schedule';

const JS_DAY_TO_WEEKDAY: Weekday[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const todayWeekday = (): Weekday => JS_DAY_TO_WEEKDAY[new Date().getDay()];

export function findRoutineById(routines: Routine[], templates: Routine[], id: string | undefined): Routine | undefined {
  if (!id) return undefined;
  return routines.find(r => r.id === id) ?? templates.find(r => r.id === id);
}

export { WEEKDAYS };
export type { Weekday };
