import React, { useEffect, useState } from 'react';
import {
  Scale,
  Plus,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  Clock,
  Play,
  Thermometer,
  X,
} from 'lucide-react';
import {
  BakeSession,
  BakeStep,
  StageActivityLog,
  StarterProfile,
  UserProfile,
} from '../../types';
import { useTimer } from '../../hooks/useTimer';
import { formatSeconds, formatTimeOnly } from '../../utils/formatters';
import { getFermentationSuggestion, TEMP_GUIDE } from '../../utils/fermentationEngine';
import { playKitchenChime } from '../../utils/audioSynthesizer';
import { computeFormula } from '../../utils/recipeFormula';
import { STEP_PRESETS, CUSTOM_STEP_ID } from '../../data/stepCatalog';
import { NewBakeView } from '../new-bake/NewBakeView';
import { NumField } from '../common/NumField';

interface ActiveBakesViewProps {
  user: UserProfile | null;
  starters: StarterProfile[];
  sessions: BakeSession[];
  onUpdateSession: (session: BakeSession) => void;
  onCreateSession: (session: BakeSession) => void;
  onCompleteSession: (sessionId: number) => void;
  onArchiveSession: (sessionId: number) => void;
  onOpenAuth: () => void;
}

const TEMP_OPTIONS = [...TEMP_GUIDE].sort((a, b) => a.c - b.c);

const clockTime = (ms: number) =>
  new Date(ms).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

const timelineEntry = (
  stageName: string,
  message: string,
  type: StageActivityLog['type'],
): StageActivityLog => {
  const ts = Date.now();
  return {
    id: `tl-${ts}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: ts,
    timeStr: clockTime(ts),
    stageName,
    message,
    type,
  };
};

/** Re-renders on an interval so elapsed / estimate readouts tick. */
function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

// ---------------------------------------------------------------------------

interface StepCountdownProps {
  step: BakeStep;
}

/** Drift-free countdown for a running step that has a timer set. */
const StepCountdown: React.FC<StepCountdownProps> = ({ step }) => {
  const targetSecs = step.targetDurationSecs ?? 0;
  const endsAt = step.startedAt + targetSecs * 1000;
  const { remaining, isDone } = useTimer({
    initialDurationSecs: targetSecs,
    initialTargetEndTime: endsAt,
    initialRunning: endsAt > Date.now(),
  });
  const over = isDone || endsAt <= Date.now();

  return (
    <span
      className={`font-mono text-[12px] whitespace-nowrap tabular-nums ${
        over ? 'text-warning font-bold' : 'text-terracotta'
      }`}
    >
      {over ? 'timer up' : `-${formatSeconds(remaining)}`}
    </span>
  );
};

interface StepRowProps {
  step: BakeStep;
  now: number;
  onComplete: (stepId: string) => void;
}

/**
 * A logged step as it appears in the activity log. Three states: finished (shows
 * its span), running with a timer (counts down), running without one (counts up).
 * Untimed steps still get a Done button so a coil fold can be closed off.
 */
const StepRow: React.FC<StepRowProps> = ({ step, now, onComplete }) => {
  const done = !!step.completedAt;
  const timed = !!step.targetDurationSecs;
  const elapsed = Math.max(0, Math.floor((now - step.startedAt) / 1000));

  return (
    <div className="relative pl-5">
      <div
        className={`absolute left-[-4px] top-[6px] w-2 h-2 rounded-full ring-2 ring-card ${
          done ? 'bg-olive' : 'bg-terracotta'
        }`}
      />
      <div className="flex items-baseline gap-2">
        <span className="font-mono text-[12px] text-olive font-bold tabular-nums flex-shrink-0">
          {clockTime(step.startedAt)}
        </span>
        <span className="font-serif text-[15px] text-ink whitespace-nowrap">{step.name}</span>
        <span className="flex-1 border-b border-dotted border-border-leader relative top-[-3px]" />
        {done ? (
          <span className="font-mono text-[12px] text-muted whitespace-nowrap tabular-nums">
            {clockTime(step.completedAt!)}
          </span>
        ) : (
          <>
            {timed ? (
              <StepCountdown step={step} />
            ) : (
              <span className="font-mono text-[12px] text-muted whitespace-nowrap tabular-nums">
                {formatSeconds(elapsed)}
              </span>
            )}
            <button
              onClick={() => onComplete(step.id)}
              className="font-sans text-[11px] uppercase font-bold tracking-wider text-muted hover:text-ink active:scale-98 transition-all"
            >
              Done
            </button>
          </>
        )}
      </div>
      {step.note && (
        <p className="font-serif italic text-[12px] text-muted mt-0.5">{step.note}</p>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------

interface BakeCardProps {
  session: BakeSession;
  onUpdateSession: (session: BakeSession) => void;
  onCompleteSession: (sessionId: number) => void;
  onArchiveSession: (sessionId: number) => void;
}

/** One row of the merged activity log — either a logged step or a bake event. */
type ActivityItem =
  | { kind: 'step'; at: number; step: BakeStep }
  | { kind: 'event'; at: number; event: StageActivityLog };

const BakeCard: React.FC<BakeCardProps> = ({
  session,
  onUpdateSession,
  onCompleteSession,
  onArchiveSession,
}) => {
  const now = useNow(1000);
  // null = follow the default (open until the first step is logged); once the baker
  // touches the toggle their choice wins for the rest of the session.
  const [recipeOverride, setRecipeOverride] = useState<boolean | null>(null);
  const recipeOpen = recipeOverride ?? session.steps.length === 0;

  const [logging, setLogging] = useState(false);
  const [presetId, setPresetId] = useState<string>(STEP_PRESETS[0].id);
  const [customName, setCustomName] = useState('');
  const [stepTimerMin, setStepTimerMin] = useState<number>(STEP_PRESETS[0].defaultMins ?? 0);
  const [stepNote, setStepNote] = useState('');
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  const preset = STEP_PRESETS.find((p) => p.id === presetId);
  const isCustom = presetId === CUSTOM_STEP_ID;
  // Only steps that are genuinely an interval get a timer field. A coil fold is a
  // moment you record, not a countdown — so the note takes the whole row instead.
  const showTimer = isCustom || !!preset?.defaultMins;
  const pendingName = isCustom ? customName.trim() : preset?.name ?? '';

  const roomTempC = session.roomTempC ?? 23;
  const sugg = getFermentationSuggestion(roomTempC);
  const estTotalSecs = sugg ? sugg.hrs * 3600 : 0;

  // Bulk fermentation is measured from when starter met flour, never from when the
  // recipe was created — an autolyse can sit an hour between the two.
  const doughStartedAt = session.doughStartedAt;
  const bulkElapsedSecs = doughStartedAt
    ? Math.max(0, Math.floor((now - doughStartedAt) / 1000))
    : 0;
  const fermentPct =
    doughStartedAt && estTotalSecs
      ? Math.min(100, Math.max(0, Math.round((bulkElapsedSecs / estTotalSecs) * 100)))
      : 0;
  const estFinish =
    doughStartedAt && estTotalSecs
      ? formatTimeOnly(doughStartedAt + estTotalSecs * 1000)
      : '—';

  const formula = computeFormula({
    totalFlour: session.totalFlour,
    loaves: session.loaves,
    hydration: session.hydration,
    saltPct: session.saltPct,
    starterFlour: session.starterFlour,
    starterWater: session.starterWater,
    flourBlend: session.flourBlend,
  });

  // Steps and events share one chronological list, newest first. Logging a step no
  // longer writes a timeline entry as well — the step *is* the entry.
  const activity: ActivityItem[] = [
    ...session.steps.map((step) => ({ kind: 'step' as const, at: step.startedAt, step })),
    ...session.timeline.map((event) => ({ kind: 'event' as const, at: event.timestamp, event })),
  ].sort((a, b) => b.at - a.at);

  const selectPreset = (id: string) => {
    setPresetId(id);
    const next = STEP_PRESETS.find((p) => p.id === id);
    setStepTimerMin(next?.defaultMins ?? 0);
    if (id !== CUSTOM_STEP_ID) setCustomName('');
  };

  const resetForm = () => {
    setPresetId(STEP_PRESETS[0].id);
    setCustomName('');
    setStepTimerMin(STEP_PRESETS[0].defaultMins ?? 0);
    setStepNote('');
    setLogging(false);
  };

  const addStep = () => {
    const name = pendingName;
    if (!name) return;
    const mins = stepTimerMin;
    const hasTimer = showTimer && Number.isFinite(mins) && mins > 0;
    const step: BakeStep = {
      id: `step-${Date.now()}`,
      name,
      startedAt: Date.now(),
      targetDurationSecs: hasTimer ? Math.round(mins * 60) : undefined,
      note: stepNote.trim() || undefined,
    };
    onUpdateSession({ ...session, steps: [...session.steps, step] });
    resetForm();
  };

  const completeStep = (stepId: string) => {
    onUpdateSession({
      ...session,
      steps: session.steps.map((s) =>
        s.id === stepId ? { ...s, completedAt: Date.now() } : s,
      ),
    });
  };

  const startBulk = () => {
    const at = Date.now();
    onUpdateSession({
      ...session,
      doughStartedAt: at,
      timeline: [
        ...session.timeline,
        timelineEntry('Bulk fermentation', 'Starter added — bulk fermentation started', 'start'),
      ],
    });
  };

  const setRoomTemp = (c: number) => onUpdateSession({ ...session, roomTempC: c });

  return (
    <div className="flex flex-col bg-card rounded-[20px] border border-border-card shadow-[0_8px_24px_rgba(51,48,42,0.06),inset_0_1px_0_rgba(255,255,255,1)] overflow-hidden">
      {/* Header — the meta line gets the full width now that the clock lives in its
          own section, so it no longer wraps into the elapsed readout. */}
      <div className="p-[17px] pb-3 bg-card border-b border-border-card">
        <h2 className="font-serif text-[23px] font-semibold text-ink leading-tight">
          {session.title}
        </h2>
        <p className="font-sans text-xs text-muted mt-1">
          {session.loaves} {session.loaves === 1 ? 'loaf' : 'loaves'} · {session.hydration}% hydration · {session.totalFlour}g flour
        </p>
        <p className="font-mono text-[11px] text-faint uppercase tracking-wider mt-0.5">
          Created {clockTime(session.startedAt)}
        </p>

        <button
          onClick={() => setRecipeOverride(!recipeOpen)}
          className="mt-2.5 font-sans text-[12px] font-semibold text-muted hover:text-terracotta flex items-center gap-1 active:scale-98 transition-all"
        >
          {recipeOpen ? 'Hide' : 'Show'} full recipe
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform ${recipeOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {recipeOpen && (
          <div className="mt-2.5 bg-oat border border-border-field rounded-xl p-3 space-y-2 animate-fadeIn">
            <p className="font-sans text-[11px] text-faint uppercase font-semibold tracking-wider">
              To be added
            </p>
            {formula.flourRows.map((row) => (
              <div key={row.id} className="flex items-baseline w-full">
                <span className="font-serif text-[15px] text-ink whitespace-nowrap">
                  {row.name}
                  <span className="font-sans text-[11px] text-faint ml-1.5">[{row.blendPct}%]</span>
                </span>
                <span className="flex-1 border-b-[1.5px] border-dotted border-border-leader mx-2 relative top-[-4px]" />
                <span className="font-sans text-[15px] font-bold text-ink">
                  {row.weightGrams}
                  <span className="text-faint text-[11px] ml-0.5">g</span>
                </span>
              </div>
            ))}
            <div className="flex items-baseline w-full">
              <span className="font-serif text-[15px] text-ink whitespace-nowrap">
                Starter
                <span className="font-sans text-[11px] text-faint ml-1.5">
                  [{session.starterFlour}g F, {session.starterWater}g W]
                </span>
              </span>
              <span className="flex-1 border-b-[1.5px] border-dotted border-border-leader mx-2 relative top-[-4px]" />
              <span className="font-sans text-[15px] font-bold text-ink">
                {formula.starterTotal}
                <span className="text-faint text-[11px] ml-0.5">g</span>
              </span>
            </div>
            <div className="flex items-baseline w-full">
              <span className="font-serif text-[15px] text-ink whitespace-nowrap">Water</span>
              <span className="flex-1 border-b-[1.5px] border-dotted border-border-leader mx-2 relative top-[-4px]" />
              <span className="font-sans text-[15px] font-bold text-ink">
                {formula.waterToAdd}
                <span className="text-faint text-[11px] ml-0.5">g</span>
              </span>
            </div>
            <div className="flex items-baseline w-full">
              <span className="font-serif text-[15px] text-ink whitespace-nowrap">Salt</span>
              <span className="flex-1 border-b-[1.5px] border-dotted border-border-leader mx-2 relative top-[-4px]" />
              <span className="font-sans text-[15px] font-bold text-ink">
                {formula.saltGrams}
                <span className="text-faint text-[11px] ml-0.5">g</span>
              </span>
            </div>
            <div className="flex items-baseline justify-between pt-1.5 border-t border-border-field">
              <span className="font-serif italic text-[15px] text-ink">Total dough</span>
              <span className="font-sans text-[15px] font-extrabold text-ink">
                {formula.totalDoughWeight} g
              </span>
            </div>
            <p className="font-mono text-[12px] text-muted">
              {session.hydration}% hydration · {session.saltPct}% salt
              {session.starterName ? ` · ${session.starterName}` : ''}
            </p>
          </div>
        )}
      </div>


      {/* Bulk fermentation — the master clock. Nothing ticks until starter meets
          flour, and the elapsed time is shown against the target for this room
          temperature so "am I near the 5.5h mark?" is answerable at a glance. */}
      <div className="p-[17px] space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="font-sans text-[12px] uppercase font-bold text-muted tracking-wider">
            Bulk fermentation
          </h3>
          <div className="flex items-center gap-1.5">
            <Thermometer className="w-3.5 h-3.5 text-terracotta" />
            <span className="font-sans text-[11px] text-faint uppercase tracking-wider">Dough Temp</span>
            <div className="relative">
              <select
                value={roomTempC}
                onChange={(e) => setRoomTemp(Number(e.target.value))}
                className="appearance-none bg-oat border border-border-field rounded-lg pl-2.5 pr-7 py-1 font-mono text-xs font-bold text-ink focus:outline-none focus:ring-2 focus:ring-terracotta/20"
              >
                {TEMP_OPTIONS.map((p) => (
                  <option key={p.c} value={p.c}>
                    {p.c}°C
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-faint absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {!doughStartedAt ? (
          <div className="space-y-2 pt-0.5">
            <button
              onClick={startBulk}
              className="w-full bg-terracotta hover:bg-primary text-white rounded-[14px] py-3 px-4 flex items-center justify-center gap-2 shadow-btnTerracotta active:scale-98 transition-all font-sans font-semibold text-[15px]"
            >
              <Play className="w-4 h-4" fill="currentColor" />
              Starter added — start timer
            </button>
            <p className="font-sans text-[12px] text-muted leading-relaxed">
              Bulk begins when starter meets flour. Autolyse first if you want to — log
              it below, then come back and start the clock.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="font-mono text-[23px] font-bold text-ink tabular-nums leading-none">
                {formatSeconds(bulkElapsedSecs)}
              </span>
              {estTotalSecs > 0 && (
                <span className="font-mono text-[13px] text-faint tabular-nums">
                  of {formatSeconds(estTotalSecs)}
                </span>
              )}
            </div>

            <div className="h-2 bg-oat border border-border-field rounded-full overflow-hidden">
              <div
                className="h-full bg-terracotta rounded-full transition-all"
                style={{ width: `${fermentPct}%` }}
              />
            </div>

            <p className="font-sans text-[12px] text-muted leading-relaxed">
              {sugg ? (
                <>
                  {sugg.hrs}h at {sugg.c}°C · ~{sugg.rise}% rise · ready{' '}
                  <span className="font-mono text-ink">{estFinish}</span> ·{' '}
                  <span className="font-mono font-bold text-terracotta tabular-nums">
                    {fermentPct}%
                  </span>
                </>
              ) : (
                'Set a room temperature to estimate bulk fermentation.'
              )}
            </p>
          </>
        )}
      </div>

      {/* Activity — steps and bake events in one chronological log. A logged step
          IS its timeline entry, so nothing is recorded twice. */}
      <div className="p-[17px] border-t border-border-card space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-sans text-[12px] uppercase font-bold text-muted tracking-wider flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-muted" /> Activity
          </h3>
          {!logging && (
            <button
              onClick={() => setLogging(true)}
              className="font-sans text-[12px] font-bold text-terracotta uppercase tracking-wider flex items-center gap-1 hover:opacity-80 active:scale-98 transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> Log step
            </button>
          )}
        </div>

        {logging && (
          <div className="bg-oat border border-border-field rounded-xl p-3 space-y-2">
            <div className="relative">
              <select
                autoFocus
                value={presetId}
                onChange={(e) => selectPreset(e.target.value)}
                className="w-full appearance-none bg-card border border-border-field rounded-lg px-2.5 py-2 pr-8 font-serif text-sm text-ink focus:outline-none focus:ring-2 focus:ring-terracotta/20"
              >
                {STEP_PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
                <option value={CUSTOM_STEP_ID}>Custom…</option>
              </select>
              <ChevronDown className="w-4 h-4 text-faint absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {isCustom && (
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Step name"
                className="w-full bg-card border border-border-field rounded-lg px-2.5 py-2 font-serif text-sm text-ink focus:outline-none focus:ring-2 focus:ring-terracotta/20"
              />
            )}

            {/* Untimed steps hand the whole row to the note. */}
            <div className="flex gap-2">
              {showTimer && (
                <div className="relative w-24 flex-shrink-0">
                  <NumField
                    value={stepTimerMin}
                    onChange={setStepTimerMin}
                    placeholder="Timer"
                    className="w-full bg-card border border-border-field rounded-lg px-2.5 py-2 font-mono text-xs text-ink text-right pr-9 focus:outline-none focus:ring-2 focus:ring-terracotta/20"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 font-sans text-[11px] text-muted pointer-events-none">
                    min
                  </span>
                </div>
              )}
              <input
                type="text"
                value={stepNote}
                onChange={(e) => setStepNote(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') addStep();
                  if (e.key === 'Escape') resetForm();
                }}
                placeholder="Note (optional)"
                className="flex-1 min-w-0 bg-card border border-border-field rounded-lg px-2.5 py-2 font-serif text-xs text-ink focus:outline-none focus:ring-2 focus:ring-terracotta/20"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={resetForm}
                className="px-3 py-1.5 font-sans text-xs text-muted hover:text-ink"
              >
                Cancel
              </button>
              <button
                onClick={addStep}
                disabled={!pendingName}
                className="px-3 py-1.5 bg-terracotta hover:bg-primary disabled:opacity-40 text-white rounded-lg font-sans text-xs font-semibold active:scale-98 transition-all"
              >
                Add step
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2.5 relative ml-1">
          <div className="absolute left-0 top-2 bottom-2 w-px border-l border-dashed border-border-leader" />

          {activity.map((item) =>
            item.kind === 'step' ? (
              <StepRow key={item.step.id} step={item.step} now={now} onComplete={completeStep} />
            ) : (
              <div key={item.event.id} className="relative pl-5">
                <div className="absolute left-[-3px] top-[7px] w-1.5 h-1.5 rounded-full bg-border-leader ring-2 ring-card" />
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-[12px] text-faint tabular-nums flex-shrink-0">
                    {item.event.timeStr}
                  </span>
                  <span className="font-sans text-[13px] text-muted">{item.event.message}</span>
                </div>
              </div>
            ),
          )}
        </div>
      </div>

      {/* Footer — Discard (distinct from Complete) + Mark complete */}
      <div className="bg-oat border-t border-border-card px-4 py-3">
        {confirmDiscard ? (
          <div className="flex items-center justify-between gap-2">
            <span className="font-sans text-xs text-ink font-semibold">Discard this bake?</span>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDiscard(false)}
                className="font-sans text-xs text-muted hover:text-ink px-2 py-1"
              >
                Keep
              </button>
              <button
                onClick={() => onArchiveSession(session.id)}
                className="font-sans text-xs font-semibold text-white bg-danger hover:opacity-90 rounded-lg px-3 py-1 active:scale-98 transition-all"
              >
                Discard
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <button
              onClick={() => setConfirmDiscard(true)}
              className="font-sans font-semibold text-xs text-muted hover:text-danger flex items-center gap-1 active:scale-98 transition-all"
            >
              <X className="w-3.5 h-3.5" /> Discard
            </button>
            <button
              onClick={() => {
                onCompleteSession(session.id);
                playKitchenChime();
              }}
              className="font-sans font-semibold text-xs text-terracotta hover:opacity-80 flex items-center gap-1 active:scale-98 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" /> Mark bake complete
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------

export const ActiveBakesView: React.FC<ActiveBakesViewProps> = ({
  user,
  starters,
  sessions,
  onUpdateSession,
  onCreateSession,
  onCompleteSession,
  onArchiveSession,
  onOpenAuth,
}) => {
  const [isBuildingRecipe, setIsBuildingRecipe] = useState(false);

  // If user clicked "Start New Bake" or "Start Another Loaf", show the integrated Recipe Builder
  if (isBuildingRecipe) {
    return (
      <div className="space-y-4 max-w-lg mx-auto w-full pb-8 animate-fadeIn">
        <button
          onClick={() => setIsBuildingRecipe(false)}
          className="text-muted hover:text-ink font-sans text-xs font-semibold flex items-center gap-1 mb-1"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Active Bakes
        </button>

        <NewBakeView
          user={user}
          starters={starters}
          onCreateBake={(newSession) => {
            onCreateSession(newSession);
            setIsBuildingRecipe(false);
            playKitchenChime();
          }}
          onOpenAuth={onOpenAuth}
        />
      </div>
    );
  }

  // If no bakes are currently active, show the Empty State container
  if (sessions.length === 0) {
    return (
      <div className="max-w-lg mx-auto w-full py-12 px-6 flex flex-col items-center justify-center bg-card rounded-[20px] border border-border-card shadow-[0_4px_16px_rgba(51,48,42,0.06),inset_0_1px_0_rgba(255,255,255,0.8)] text-center space-y-4 animate-fadeIn">
        <div className="w-16 h-16 rounded-full bg-linen flex items-center justify-center text-terracotta border border-border-field">
          <Scale className="w-7 h-7" strokeWidth={2} />
        </div>
        <h2 className="font-serif text-2xl font-semibold text-ink">No Session Active</h2>
        <p className="font-sans text-xs text-muted max-w-xs leading-relaxed">
          Your proofing baskets are empty. Ready to calculate hydration and start a fresh loaf?
        </p>
        <button
          onClick={() => setIsBuildingRecipe(true)}
          className="bg-terracotta hover:bg-primary text-white font-sans font-semibold text-sm uppercase tracking-wider py-3.5 px-6 rounded-[16px] shadow-btnTerracotta flex items-center gap-2 active:scale-95 transition-all"
        >
          <span>Start New Bake</span>
          <Plus className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-lg mx-auto w-full pb-8 animate-fadeIn">
      {/* Top Action Header: New Loaf Button */}
      <div className="flex justify-between items-center px-1">
        <span className="font-sans text-xs text-muted">
          {sessions.length} Active {sessions.length === 1 ? 'Loaf' : 'Loaves'}
        </span>
        <button
          onClick={() => setIsBuildingRecipe(true)}
          className="text-terracotta font-sans text-xs font-bold uppercase tracking-wider flex items-center gap-1 hover:opacity-80 transition-opacity"
        >
          <Plus className="w-3.5 h-3.5" /> Start Another Loaf
        </button>
      </div>

      {sessions.map((session) => (
        <BakeCard
          key={session.id}
          session={session}
          onUpdateSession={onUpdateSession}
          onCompleteSession={onCompleteSession}
          onArchiveSession={onArchiveSession}
        />
      ))}
    </div>
  );
};
