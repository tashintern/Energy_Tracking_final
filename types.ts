export interface Activity {
  id: string;
  title: string;
  startTime: string; // ISO8601
  endTime: string; // ISO8601
  durationMinutes: number;
  energy: number; // -5 to +5
  tags: string; // comma-separated
  starFlow: boolean;
  notes: string;
  createdAt: string; // ISO8601
  updatedAt: string; // ISO8601
  synced: boolean;
}

export interface Preset {
  id: string;
  title: string;
  defaultTags: string;
  defaultEnergy: number;
}

export interface ReminderSettings {
  dailyEnabled: boolean;
  dailyTime: string; // "HH:MM" format
  smartEnabled: boolean;
  smartIntervalHours: number; // in hours
}


export type View = 'timeline' | 'weekly' | 'analytics';

export type ChartWeighting = 'duration' | 'average';

export interface ChartData {
  day: string;
  positive: number;
  negative: number;
  flowActivities: Activity[];
}
