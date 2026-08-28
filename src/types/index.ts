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

// Legacy fixed methodology — retained only so the v1→v2 migration can name the old stages.
export type BakeStage = 'autolyse' | 'stretch_folds' | 'bulk_ferment' | 'cold_retard' | 'bake';

/**
 * One freeform step the baker logs during a bake. Replaces the old fixed
 * currentStage / timers / folds fields. Name is user-defined; every timing
 * field is optional so a step can be a bare label or a full timed interval.
 */
export interface BakeStep {
  id: string;
  name: string;
  startedAt: number;             // ms epoch when the step began
  completedAt?: number;          // ms epoch when marked done; absent = in progress
  targetDurationSecs?: number;   // optional planned length, for a countdown/estimate
  note?: string;
}

export interface BakeSession {
  id: number;
  date: string;
  time: string;
  title: string;
  status: 'active' | 'completed' | 'archived';
  startedAt: number;             // ms epoch when the bake was created
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
  roomTempC?: number;            // room temperature in °C; feeds the fermentation estimate
  steps: BakeStep[];
  timeline: StageActivityLog[];
  crumbRating?: number;
  tastingNotes?: string;
}
