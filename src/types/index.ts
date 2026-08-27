export type AppTab = 'active' | 'history' | 'diary';

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  signedInAt: number;
}

export interface FlourBlendItem {
  id: string;
  name: string;
  percentage: number;
  grams?: number;
}

export interface StarterFeedEntry {
  id: string;
  timestamp: number;
  dateStr: string;
  timeStr: string;
  seedGrams: number;
  flourGrams: number;
  flourType: string;
  waterGrams: number;
  waterTemp?: string;
  ratio: string;
  notes?: string;
}

export type StarterStatus = 'active_peak' | 'rising' | 'hungry' | 'refrigerated';

export interface StarterProfile {
  id: string;
  name: string;
  flourType: string;
  hydration: number;
  dateCreated: string;
  status: StarterStatus;
  lastFedTimestamp: number | null;
  lastRatio?: string;
  peakTargetTimestamp: number | null;
  feedHistory: StarterFeedEntry[];
}

export interface StageActivityLog {
  id: string;
  timestamp: number;
  timeStr: string;
  stageName: string;
  message: string;
  type: 'start' | 'extend' | 'complete' | 'note';
}

export type BakeStage = 'autolyse' | 'stretch_folds' | 'bulk_ferment' | 'cold_retard' | 'bake';

export interface StageTimerState {
  targetEndTime: number | null;
  durationSecs: number;
  remaining: number | null;
  running: boolean;
  done: boolean;
}

export interface BakeSession {
  id: number;
  date: string;
  time: string;
  title: string;
  status: 'active' | 'completed' | 'archived';
  currentStage: BakeStage;
  starterId?: string;
  starterName?: string;
  totalFlour: number;
  hydration: number;
  saltPct: number;
  starterPct: number;
  starterFlour: number;
  starterWater: number;
  loaves: number;
  flourBlend: FlourBlendItem[];
  roomTemp?: number;
  foldsCompleted: number;
  totalFolds: number;
  timers: {
    autolyse: StageTimerState;
    foldInterval: StageTimerState;
    bulkFerment: StageTimerState;
    coldRetard: StageTimerState;
    bakeLidOn: StageTimerState;
    bakeLidOff: StageTimerState;
  };
  timeline: StageActivityLog[];
  crumbRating?: number;
  tastingNotes?: string;
}
