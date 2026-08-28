import { BakeSession, BakeStep, BakeStage, StageActivityLog } from '../types';

/**
 * v1 → v2 bake data migration.
 *
 * v1 `BakeSession` encoded a fixed five-stage methodology via `currentStage`,
 * a six-key `timers` object, and `foldsCompleted` / `totalFolds`. v2 replaces
 * all of that with a freeform `steps: BakeStep[]` array plus `startedAt` and
 * `roomTempC`. Old saved bakes would crash the v2 views, so on first load we
 * migrate the v1 localStorage keys into versioned v2 keys and leave the
 * originals untouched as a fallback.
 */

export const BAKES_SCHEMA_VERSION = 2;

export const ACTIVE_BAKES_KEY = 'sourdough_active_bakes_v2';
export const BAKE_HISTORY_KEY = 'sourdough_bake_history_v2';

const LEGACY_ACTIVE_BAKES_KEY = 'sourdough_active_bakes';
const LEGACY_BAKE_HISTORY_KEY = 'sourdough_bake_history';

const LEGACY_STAGE_ORDER: BakeStage[] = [
  'autolyse',
  'stretch_folds',
  'bulk_ferment',
  'cold_retard',
  'bake',
];

const LEGACY_STAGE_LABEL: Record<BakeStage, string> = {
  autolyse: 'Autolyse',
  stretch_folds: 'Stretch & folds',
  bulk_ferment: 'Bulk fermentation',
  cold_retard: 'Cold retard',
  bake: 'Bake',
};

// Maps a legacy stage id to its key in the old `timers` object.
const LEGACY_STAGE_TIMER_KEY: Record<BakeStage, string> = {
  autolyse: 'autolyse',
  stretch_folds: 'foldInterval',
  bulk_ferment: 'bulkFerment',
  cold_retard: 'coldRetard',
  bake: 'bakeLidOn',
};

interface LegacyTimer {
  targetEndTime: number | null;
  durationSecs: number;
  remaining: number | null;
  running: boolean;
  done: boolean;
}

// Only the fields the migration reads; the recipe fields carry over via spread.
interface LegacyBake {
  id: number;
  status?: 'active' | 'completed' | 'archived';
  currentStage?: BakeStage;
  roomTemp?: number;
  timers?: Record<string, LegacyTimer>;
  timeline?: StageActivityLog[];
  startedAt?: number;
  [key: string]: unknown;
}

function isLegacyBake(value: unknown): value is LegacyBake {
  return !!value && typeof value === 'object' && 'currentStage' in (value as object);
}

/** Convert one v1 bake object to the v2 `BakeSession` shape. Idempotent for v2 input. */
export function migrateLegacyBake(input: unknown): BakeSession {
  if (!isLegacyBake(input)) {
    // Already v2 (or close enough) — normalise the two required new fields and return.
    const v2 = (input || {}) as Partial<BakeSession> & Record<string, unknown>;
    return {
      ...(v2 as BakeSession),
      startedAt: Number(v2.startedAt) || Date.now(),
      steps: Array.isArray(v2.steps) ? (v2.steps as BakeStep[]) : [],
      timeline: Array.isArray(v2.timeline) ? v2.timeline : [],
    };
  }

  const legacy = input;
  const timeline = Array.isArray(legacy.timeline) ? legacy.timeline : [];
  const earliestTimelineTs = timeline.length
    ? Math.min(...timeline.map((t) => Number(t?.timestamp) || Number.POSITIVE_INFINITY))
    : Number.POSITIVE_INFINITY;
  const startedAt = Number(legacy.startedAt)
    || (Number.isFinite(earliestTimelineTs) ? earliestTimelineTs : Date.now());

  const reachedIdx = legacy.currentStage
    ? LEGACY_STAGE_ORDER.indexOf(legacy.currentStage)
    : -1;
  const bakeIsActive = (legacy.status ?? 'active') === 'active';

  const steps: BakeStep[] = [];
  for (let i = 0; i <= reachedIdx; i++) {
    const stage = LEGACY_STAGE_ORDER[i];
    const timer = legacy.timers?.[LEGACY_STAGE_TIMER_KEY[stage]];
    const isCurrent = i === reachedIdx && bakeIsActive;
    steps.push({
      id: `step-legacy-${legacy.id}-${stage}`,
      name: LEGACY_STAGE_LABEL[stage],
      // v1 has no real per-stage start times; synthesise an ordered sequence.
      startedAt: startedAt + i,
      completedAt: isCurrent ? undefined : (timer?.targetEndTime ?? startedAt + i + 1),
      targetDurationSecs: timer?.durationSecs,
    });
  }

  // Carry every recipe field forward, drop the four v1 methodology fields.
  const rest: Record<string, unknown> = { ...legacy };
  delete rest.currentStage;
  delete rest.roomTemp;
  delete rest.foldsCompleted;
  delete rest.totalFolds;
  delete rest.timers;

  return {
    ...(rest as unknown as BakeSession),
    startedAt,
    roomTempC: typeof legacy.roomTemp === 'number' ? legacy.roomTemp : undefined,
    steps,
    timeline,
  };
}

function migrateKey(legacyKey: string, v2Key: string): void {
  try {
    if (localStorage.getItem(v2Key) !== null) return; // already migrated
    const raw = localStorage.getItem(legacyKey);
    if (raw === null) return; // nothing to migrate (fresh install)

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return;

    const migrated = parsed.map((bake) => migrateLegacyBake(bake));
    localStorage.setItem(v2Key, JSON.stringify(migrated));
  } catch (err) {
    console.warn(`Bake migration for "${legacyKey}" failed; the v2 view will start empty.`, err);
  }
}

/** Run every bake-data migration once. Safe to call on every startup. */
export function runBakeMigrations(): void {
  if (typeof localStorage === 'undefined') return;
  migrateKey(LEGACY_ACTIVE_BAKES_KEY, ACTIVE_BAKES_KEY);
  migrateKey(LEGACY_BAKE_HISTORY_KEY, BAKE_HISTORY_KEY);
}
