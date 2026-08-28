import React, { useEffect, useState } from 'react';
import {
  Scale,
  Plus,
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  Clock,
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
import { NewBakeView } from '../new-bake/NewBakeView';

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

interface TimedStepRowProps {
  step: BakeStep;
  onComplete: (stepId: string) => void;
}

/** In-progress step that has a timer set — drift-free countdown via useTimer. */
const TimedStepRow: React.FC<TimedStepRowProps> = ({ step, onComplete }) => {
  const targetSecs = step.targetDurationSecs ?? 0;
  const endsAt = step.startedAt + targetSecs * 1000;
  const { remaining, isDone } = useTimer({
    initialDurationSecs: targetSecs,
    initialTargetEndTime: endsAt,
    initialRunning: endsAt > Date.now(),
  });
  const over = isDone || endsAt <= Date.now();

  return (
    <li className="space-y-0.5">
      <div className="flex items-baseline gap-2">
        <span
          className={`w-1.5 h-1.5 rounded-full flex-shrink-0 self-center ${
            over ? 'bg-warning' : 'bg-terracotta'
          }`}
        />
        <span className="font-serif text-[15px] text-ink whitespace-nowrap">{step.name}</span>
        <span className="flex-1 border-b border-dotted border-border-leader" />
        <span
          className={`font-mono text-[11px] whitespace-nowrap tabular-nums ${
            over ? 'text-warning font-bold' : 'text-terracotta'
          }`}
        >
          {over ? 'timer up' : `-${formatSeconds(remaining)}`}
        </span>
        <button
          onClick={() => onComplete(step.id)}
          className="font-sans text-[10px] uppercase font-bold tracking-wider text-muted hover:text-ink active:scale-98 transition-all"
        >
          Done
        </button>
      </div>
      {step.note && (
        <p className="font-serif italic text-[11px] text-muted pl-3.5">{step.note}</p>
      )}
    </li>
  );
};

// ---------------------------------------------------------------------------

interface BakeCardProps {
  session: BakeSession;
  onUpdateSession: (session: BakeSession) => void;
  onCompleteSession: (sessionId: number) => void;
  onArchiveSession: (sessionId: number) => void;
  onViewRecipe: (session: BakeSession) => void;
}

const BakeCard: React.FC<BakeCardProps> = ({
  session,
  onUpdateSession,
  onCompleteSession,
  onArchiveSession,
  onViewRecipe,
}) => {
  const now = useNow(1000);
  const [logging, setLogging] = useState(false);
  const [stepName, setStepName] = useState('');
  const [stepTimerMin, setStepTimerMin] = useState('');
  const [stepNote, setStepNote] = useState('');
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  const elapsedSecs = Math.max(0, Math.floor((now - session.startedAt) / 1000));

  const roomTempC = session.roomTempC ?? 23;
  const sugg = getFermentationSuggestion(roomTempC);
  const estTotalSecs = sugg ? sugg.hrs * 3600 : 0;
  const fermentPct = estTotalSecs
    ? Math.min(100, Math.max(0, Math.round((elapsedSecs / estTotalSecs) * 100)))
    : 0;
  const estFinish = estTotalSecs ? formatTimeOnly(session.startedAt + estTotalSecs * 1000) : '—';

  const resetForm = () => {
    setStepName('');
    setStepTimerMin('');
    setStepNote('');
    setLogging(false);
  };

  const addStep = () => {
    const name = stepName.trim();
    if (!name) return;
    const mins = parseFloat(stepTimerMin);
    const hasTimer = Number.isFinite(mins) && mins > 0;
    const step: BakeStep = {
      id: `step-${Date.now()}`,
      name,
      startedAt: Date.now(),
      targetDurationSecs: hasTimer ? Math.round(mins * 60) : undefined,
      note: stepNote.trim() || undefined,
    };
    onUpdateSession({
      ...session,
      steps: [...session.steps, step],
      timeline: [
        ...session.timeline,
        timelineEntry(
          name,
          hasTimer ? `Started "${name}" · ${mins}m timer` : `Logged "${name}"`,
          'start',
        ),
      ],
    });
    resetForm();
  };

  const completeStep = (stepId: string) => {
    const target = session.steps.find((s) => s.id === stepId);
    onUpdateSession({
      ...session,
      steps: session.steps.map((s) =>
        s.id === stepId ? { ...s, completedAt: Date.now() } : s,
      ),
      timeline: [
        ...session.timeline,
        timelineEntry(target?.name ?? 'Step', `Completed "${target?.name ?? 'step'}"`, 'complete'),
      ],
    });
  };

  const setRoomTemp = (c: number) => onUpdateSession({ ...session, roomTempC: c });

  return (
    <div className="flex flex-col bg-card rounded-[20px] border border-border-card shadow-[0_8px_24px_rgba(51,48,42,0.06),inset_0_1px_0_rgba(255,255,255,1)] overflow-hidden">
      {/* Header — name, start time, ticking elapsed clock */}
      <div className="p-[17px] pb-3 bg-card border-b border-border-card">
        <div className="flex justify-between items-start gap-3">
          <div>
            <h2 className="font-serif text-[22px] font-semibold text-ink leading-tight">
              {session.title}
            </h2>
            <p className="font-sans text-xs text-muted mt-0.5">
              {session.loaves} {session.loaves === 1 ? 'loaf' : 'loaves'} · {session.hydration}% hydration · {session.totalFlour}g flour
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="font-mono text-[10px] text-faint uppercase tracking-wider whitespace-nowrap">
              Started {clockTime(session.startedAt)}
            </div>
            <div className="font-mono text-[13px] font-bold text-ink tabular-nums mt-0.5">
              {formatSeconds(elapsedSecs)}
            </div>
          </div>
        </div>
        <button
          onClick={() => onViewRecipe(session)}
          className="mt-2 font-sans text-[11px] font-semibold text-muted hover:text-terracotta flex items-center gap-0.5 active:scale-98 transition-all"
        >
          View full recipe <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Steps — freeform log with optional per-step timers */}
      <div className="p-[17px] space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-sans text-[11px] uppercase font-bold text-muted tracking-wider">
            Steps
          </h3>
          {!logging && (
            <button
              onClick={() => setLogging(true)}
              className="font-sans text-[11px] font-bold text-terracotta uppercase tracking-wider flex items-center gap-1 hover:opacity-80 active:scale-98 transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> Log step
            </button>
          )}
        </div>

        {logging && (
          <div className="bg-oat border border-border-field rounded-xl p-3 space-y-2">
            <input
              autoFocus
              type="text"
              value={stepName}
              onChange={(e) => setStepName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') addStep();
                if (e.key === 'Escape') resetForm();
              }}
              placeholder="Step name (e.g. Autolyse, Coil fold, Shape)"
              className="w-full bg-card border border-border-field rounded-lg px-2.5 py-2 font-serif text-sm text-ink focus:outline-none focus:ring-2 focus:ring-terracotta/20"
            />
            <div className="flex gap-2">
              <div className="relative w-24 flex-shrink-0">
                <input
                  type="number"
                  min="0"
                  value={stepTimerMin}
                  onChange={(e) => setStepTimerMin(e.target.value)}
                  placeholder="Timer"
                  className="w-full bg-card border border-border-field rounded-lg px-2.5 py-2 font-mono text-xs text-ink text-right pr-9 focus:outline-none focus:ring-2 focus:ring-terracotta/20"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 font-sans text-[10px] text-muted pointer-events-none">
                  min
                </span>
              </div>
              <input
                type="text"
                value={stepNote}
                onChange={(e) => setStepNote(e.target.value)}
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
                disabled={!stepName.trim()}
                className="px-3 py-1.5 bg-terracotta hover:bg-primary disabled:opacity-40 text-white rounded-lg font-sans text-xs font-semibold active:scale-98 transition-all"
              >
                Add step
              </button>
            </div>
          </div>
        )}

        {session.steps.length === 0 && !logging ? (
          <p className="font-sans text-xs text-muted">
            No steps logged yet. Use Log step when you begin one.
          </p>
        ) : (
          <ul className="space-y-2">
            {session.steps.map((step) => {
              if (step.completedAt) {
                return (
                  <li key={step.id} className="space-y-0.5">
                    <div className="flex items-baseline gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-olive flex-shrink-0 self-center" />
                      <span className="font-serif text-[15px] text-ink whitespace-nowrap">
                        {step.name}
                      </span>
                      <span className="flex-1 border-b border-dotted border-border-leader" />
                      <span className="font-mono text-[11px] text-muted whitespace-nowrap">
                        {clockTime(step.startedAt)} – {clockTime(step.completedAt)}
                      </span>
                    </div>
                    {step.note && (
                      <p className="font-serif italic text-[11px] text-muted pl-3.5">{step.note}</p>
                    )}
                  </li>
                );
              }
              if (step.targetDurationSecs) {
                return <TimedStepRow key={step.id} step={step} onComplete={completeStep} />;
              }
              const stepElapsed = Math.max(0, Math.floor((now - step.startedAt) / 1000));
              return (
                <li key={step.id} className="space-y-0.5">
                  <div className="flex items-baseline gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-terracotta flex-shrink-0 self-center" />
                    <span className="font-serif text-[15px] text-ink whitespace-nowrap">
                      {step.name}
                    </span>
                    <span className="flex-1 border-b border-dotted border-border-leader" />
                    <span className="font-mono text-[11px] text-muted whitespace-nowrap tabular-nums">
                      {formatSeconds(stepElapsed)}
                    </span>
                    <button
                      onClick={() => completeStep(step.id)}
                      className="font-sans text-[10px] uppercase font-bold tracking-wider text-muted hover:text-ink active:scale-98 transition-all"
                    >
                      Done
                    </button>
                  </div>
                  {step.note && (
                    <p className="font-serif italic text-[11px] text-muted pl-3.5">{step.note}</p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Bulk fermentation — temperature drives a live estimate and a moving % */}
      <div className="p-[17px] border-t border-border-card space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Thermometer className="w-3.5 h-3.5 text-terracotta" />
            <h3 className="font-sans text-[11px] uppercase font-bold text-muted tracking-wider">
              Bulk fermentation
            </h3>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-sans text-[10px] text-faint uppercase tracking-wider">Room</span>
            <div className="relative">
              <select
                value={sugg ? sugg.c : roomTempC}
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

        <div className="h-2 bg-oat border border-border-field rounded-full overflow-hidden">
          <div
            className="h-full bg-terracotta rounded-full transition-all"
            style={{ width: `${fermentPct}%` }}
          />
        </div>

        <p className="font-sans text-[11px] text-muted leading-relaxed">
          {sugg ? (
            <>
              ≈ {sugg.hrs}h at {sugg.c}°C · ~{sugg.rise}% rise · est. ready{' '}
              <span className="font-mono text-ink">{estFinish}</span> ·{' '}
              <span className="font-mono font-bold text-terracotta tabular-nums">{fermentPct}%</span>
            </>
          ) : (
            'Set a room temperature to estimate bulk fermentation.'
          )}
        </p>
      </div>

      {/* Activity timeline */}
      <div className="p-[17px] pt-4 border-t border-border-card bg-card/60">
        <h4 className="font-sans text-[10px] text-faint uppercase font-bold tracking-wider mb-3 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-muted" /> Activity Timeline
        </h4>

        <div className="flex flex-col gap-3 relative ml-2">
          <div className="absolute left-0 top-2 bottom-2 w-px border-l border-dashed border-border-leader" />

          {session.timeline.map((item) => (
            <div key={item.id} className="relative pl-5 flex flex-col">
              <div className="absolute left-[-4px] top-1.5 w-2 h-2 rounded-full bg-terracotta ring-2 ring-card" />
              <span className="font-mono text-[11px] font-bold text-olive">{item.timeStr}</span>
              <span className="font-sans text-[12px] text-muted">{item.message}</span>
            </div>
          ))}
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
  const [activeRecipeModal, setActiveRecipeModal] = useState<BakeSession | null>(null);

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
          onViewRecipe={setActiveRecipeModal}
        />
      ))}

      {/* Recipe Modal Preview */}
      {activeRecipeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-card max-w-sm w-full rounded-[20px] border border-border-card p-5 space-y-4 shadow-xl">
            <div className="flex justify-between items-start">
              <h3 className="font-serif text-lg font-semibold text-ink">
                {activeRecipeModal.title} Recipe
              </h3>
              <button
                onClick={() => setActiveRecipeModal(null)}
                className="text-muted hover:text-ink text-sm font-sans font-bold"
              >
                ✕
              </button>
            </div>
            <div className="font-sans text-xs space-y-2 text-muted">
              <p>• Total Flour: <strong className="text-ink">{activeRecipeModal.totalFlour}g</strong></p>
              <p>• Hydration: <strong className="text-ink">{activeRecipeModal.hydration}%</strong></p>
              <p>• Starter: <strong className="text-ink">{activeRecipeModal.starterPct}%</strong> ({activeRecipeModal.starterName || 'Manual'})</p>
              <p>• Salt: <strong className="text-ink">{activeRecipeModal.saltPct}%</strong></p>
            </div>
            <button
              onClick={() => setActiveRecipeModal(null)}
              className="w-full bg-ink text-onDark py-2.5 rounded-[11px] font-sans font-semibold text-xs"
            >
              Close Recipe
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
