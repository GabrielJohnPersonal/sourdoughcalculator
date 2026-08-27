import React, { useState } from 'react';
import {
  Scale,
  Plus,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Thermometer,
  Clock,
} from 'lucide-react';
import { BakeSession, BakeStage, StarterProfile, UserProfile } from '../../types';
import { getFermentationSuggestion } from '../../utils/fermentationEngine';
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

export const ActiveBakesView: React.FC<ActiveBakesViewProps> = ({
  user,
  starters,
  sessions,
  onUpdateSession,
  onCreateSession,
  onCompleteSession,
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

  const handleStageChange = (session: BakeSession, newStage: BakeStage) => {
    const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const updated: BakeSession = {
      ...session,
      currentStage: newStage,
      timeline: [
        ...session.timeline,
        {
          id: `tl-${Date.now()}`,
          timestamp: Date.now(),
          timeStr,
          stageName: newStage.replace('_', ' '),
          message: `Advanced to ${newStage.replace('_', ' ')} stage`,
          type: 'start',
        },
      ],
    };
    onUpdateSession(updated);
    playKitchenChime();
  };

  const handleAddExtraTime = (session: BakeSession, minutes: number) => {
    const secsToAdd = minutes * 60;
    const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const currentTimer = session.timers.autolyse;

    const updated: BakeSession = {
      ...session,
      timers: {
        ...session.timers,
        autolyse: {
          ...currentTimer,
          durationSecs: currentTimer.durationSecs + secsToAdd,
          remaining: (currentTimer.remaining || 0) + secsToAdd,
          running: true,
          done: false,
          targetEndTime: Date.now() + ((currentTimer.remaining || 0) + secsToAdd) * 1000,
        },
      },
      timeline: [
        ...session.timeline,
        {
          id: `tl-${Date.now()}`,
          timestamp: Date.now(),
          timeStr,
          stageName: 'Autolyse',
          message: `Autolyse extended (+${minutes}m)`,
          type: 'extend',
        },
      ],
    };
    onUpdateSession(updated);
    playKitchenChime();
  };

  const handleLogFold = (session: BakeSession) => {
    const nextFolds = Math.min(session.totalFolds, session.foldsCompleted + 1);
    const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    playKitchenChime();

    const updated: BakeSession = {
      ...session,
      foldsCompleted: nextFolds,
      timeline: [
        ...session.timeline,
        {
          id: `tl-${Date.now()}`,
          timestamp: Date.now(),
          timeStr,
          stageName: 'Stretch & Folds',
          message: `Stretch & fold ${nextFolds} of ${session.totalFolds} logged`,
          type: 'complete',
        },
      ],
    };
    onUpdateSession(updated);
  };

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

      {sessions.map((session) => {
        const tempSuggestion = session.roomTemp ? getFermentationSuggestion(session.roomTemp) : null;
        const stagesList: { id: BakeStage; label: string }[] = [
          { id: 'autolyse', label: 'Autolyse' },
          { id: 'stretch_folds', label: 'Folds' },
          { id: 'bulk_ferment', label: 'Bulk Rise' },
          { id: 'cold_retard', label: 'Cold Retard' },
          { id: 'bake', label: 'Oven Bake' },
        ];
        const currentStageIndex = stagesList.findIndex((s) => s.id === session.currentStage);

        return (
          <div
            key={session.id}
            className="flex flex-col bg-card rounded-[20px] border border-border-card shadow-[0_8px_24px_rgba(51,48,42,0.06),inset_0_1px_0_rgba(255,255,255,1)] overflow-hidden"
          >
            {/* Header & Stage Progress Stepper */}
            <div className="p-[17px] pb-3 bg-card border-b border-border-card">
              {/* Stepper Dots */}
              <div className="w-full flex items-center gap-1.5 mb-3">
                {stagesList.map((st, i) => (
                  <button
                    key={st.id}
                    onClick={() => handleStageChange(session, st.id)}
                    className={`h-1.5 flex-1 rounded-full transition-all ${
                      i <= currentStageIndex ? 'bg-terracotta' : 'bg-border-card'
                    }`}
                    title={st.label}
                  />
                ))}
              </div>

              <div className="flex justify-between items-start">
                <div>
                  <span className="font-serif italic text-xs uppercase tracking-[0.22em] text-muted block mb-0.5">
                    {stagesList[currentStageIndex]?.label || 'Active Bake'}
                  </span>
                  <h2 className="font-serif text-[22px] font-semibold text-ink leading-tight">
                    {session.title}
                  </h2>
                  <p className="font-sans text-xs text-muted mt-0.5">
                    {session.loaves} loaf · {session.hydration}% hydration · {session.totalFlour}g flour
                  </p>
                </div>

                <span className="bg-linen text-terracotta border border-terracotta/20 px-2.5 py-1 rounded-full font-sans text-[10px] uppercase font-bold tracking-wider">
                  Stage {currentStageIndex + 1}/{stagesList.length}
                </span>
              </div>
            </div>

            {/* Stage Controls & Flexible Timer Prompt */}
            <div className="p-[17px] space-y-5">
              {/* Autolyse Completion Hand-off Prompt */}
              {session.currentStage === 'autolyse' && (
                <div className="bg-oat p-4 rounded-xl border border-border-field space-y-3">
                  <h3 className="font-serif text-base font-semibold text-ink">
                    Autolyse completed. Ready for the next stage?
                  </h3>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleAddExtraTime(session, 15)}
                      className="w-full py-2.5 border-2 border-ink text-ink font-sans font-semibold text-xs uppercase tracking-wider rounded-[11px] hover:bg-linen active:scale-98 transition-all"
                    >
                      + Add 15m extra time
                    </button>
                    <button
                      onClick={() => handleStageChange(session, 'stretch_folds')}
                      className="w-full py-2.5 bg-ink text-onDark font-sans font-semibold text-xs uppercase tracking-wider rounded-[11px] flex items-center justify-center gap-2 shadow-btnInk active:scale-98 transition-all"
                    >
                      <span>Advance to Stretch & Folds</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Stretch & Folds Progress */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="font-sans text-[11px] uppercase font-bold text-muted tracking-wider">
                    Stretch & Folds
                  </h3>
                  <span className="font-mono text-xs font-bold text-terracotta">
                    {session.foldsCompleted} / {session.totalFolds}
                  </span>
                </div>

                {/* Progress Dots */}
                <div className="flex gap-2">
                  {Array.from({ length: session.totalFolds }).map((_, idx) => (
                    <div
                      key={idx}
                      className={`h-2 flex-1 rounded-full transition-all ${
                        idx < session.foldsCompleted
                          ? 'bg-terracotta shadow-sm'
                          : 'bg-border-field border border-border-card'
                      }`}
                    />
                  ))}
                </div>

                {session.foldsCompleted < session.totalFolds && (
                  <button
                    onClick={() => handleLogFold(session)}
                    className="w-full mt-2 py-2 bg-oat hover:bg-linen border border-border-field rounded-[11px] text-xs font-sans font-semibold text-ink flex items-center justify-center gap-1.5 transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4 text-terracotta" />
                    Log Fold #{session.foldsCompleted + 1}
                  </button>
                )}
              </div>

              {/* Bulk Fermentation Engine with Temp Estimation */}
              <div className="bg-linen p-3.5 rounded-xl border border-border-card flex items-center gap-4">
                {/* Circular Progress Indicator */}
                <div className="relative w-14 h-14 flex items-center justify-center flex-shrink-0">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <circle
                      className="text-border-field"
                      strokeWidth="3.5"
                      stroke="currentColor"
                      fill="transparent"
                      r="16"
                      cx="18"
                      cy="18"
                    />
                    <circle
                      className="text-terracotta"
                      strokeWidth="3.5"
                      strokeDasharray="100"
                      strokeDashoffset="45"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="transparent"
                      r="16"
                      cx="18"
                      cy="18"
                    />
                  </svg>
                  <span className="absolute font-mono text-[11px] font-bold text-ink">55%</span>
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-1">
                    <Thermometer className="w-3.5 h-3.5 text-terracotta" />
                    <h4 className="font-serif text-sm font-semibold text-ink">
                      Bulk Fermentation
                    </h4>
                  </div>
                  <p className="font-sans text-xs text-muted mt-0.5">
                    Est. finish at {tempSuggestion ? `~${tempSuggestion.hrs}h (${tempSuggestion.rise}% rise)` : '4:30 PM'}
                  </p>
                </div>
              </div>
            </div>

            {/* Live Kitchen Activity Timeline (Bottom of Card) */}
            <div className="p-[17px] pt-4 border-t border-border-card bg-card/60">
              <h4 className="font-sans text-[10px] text-faint uppercase font-bold tracking-wider mb-3 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-muted" /> Activity Timeline
              </h4>

              <div className="flex flex-col gap-3 relative ml-2">
                <div className="absolute left-0 top-2 bottom-2 w-px border-l border-dashed border-border-leader" />

                {session.timeline.map((item) => (
                  <div key={item.id} className="relative pl-5 flex flex-col">
                    <div className="absolute left-[-4px] top-1.5 w-2 h-2 rounded-full bg-terracotta ring-2 ring-card" />
                    <span className="font-mono text-[11px] font-bold text-olive">
                      {item.timeStr}
                    </span>
                    <span className="font-sans text-[12px] text-muted">
                      {item.message}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer Actions: Complete or View Recipe */}
            <div className="bg-oat border-t border-border-card px-4 py-3 flex justify-between items-center">
              <button
                onClick={() => {
                  onCompleteSession(session.id);
                  playKitchenChime();
                }}
                className="font-sans font-semibold text-xs text-terracotta hover:opacity-80 flex items-center gap-1"
              >
                <CheckCircle2 className="w-4 h-4" /> Mark Bake Complete
              </button>

              <button
                onClick={() => setActiveRecipeModal(session)}
                className="font-sans font-semibold text-xs text-ink hover:text-terracotta flex items-center gap-1"
              >
                View Full Recipe <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}

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
