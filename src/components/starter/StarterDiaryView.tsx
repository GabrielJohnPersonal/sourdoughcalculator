import React, { useState } from 'react';
import {
  Plus,
  Flame,
  Utensils,
  Lock,
  X,
  ShieldCheck,
  History,
  ChevronRight,
  Trash2,
} from 'lucide-react';
import { StarterProfile, UserProfile, StarterFeedEntry } from '../../types';
import { getRelativeTime } from '../../utils/formatters';

interface StarterDiaryViewProps {
  user: UserProfile | null;
  starters: StarterProfile[];
  onAddStarter: (starter: StarterProfile) => void;
  onDeleteStarter: (starterId: string) => void;
  onLogFeed: (starterId: string, entry: StarterFeedEntry) => void;
  onOpenAuth: () => void;
}

export const StarterDiaryView: React.FC<StarterDiaryViewProps> = ({
  user,
  starters,
  onAddStarter,
  onDeleteStarter,
  onLogFeed,
  onOpenAuth,
}) => {
  const [selectedStarterForFeed, setSelectedStarterForFeed] = useState<StarterProfile | null>(null);
  const [selectedStarterForHistory, setSelectedStarterForHistory] = useState<StarterProfile | null>(null);
  const [isAddStarterOpen, setIsAddStarterOpen] = useState(false);
  const [newStarterName, setNewStarterName] = useState('');
  const [newStarterFlour, setNewStarterFlour] = useState('100% Rye');
  const [newStarterHydration, setNewStarterHydration] = useState(100);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Feed Modal State & Dual Mode
  const [feedMode, setFeedMode] = useState<'ratio' | 'manual'>('ratio');
  const [selectedRatioPreset, setSelectedRatioPreset] = useState<string>('1:2:2');
  const [ratioSeed, setRatioSeed] = useState(1);
  const [ratioFlour, setRatioFlour] = useState(2);
  const [ratioWater, setRatioWater] = useState(2);

  const [seedGrams, setSeedGrams] = useState(25);
  const [flourGrams, setFlourGrams] = useState(50);
  const [waterGrams, setWaterGrams] = useState(50);
  const [feedFlourType, setFeedFlourType] = useState('Dark Rye');
  const [feedNotes, setFeedNotes] = useState('');

  // The starter being fed drives the flour:water split. Falls back to 100%.
  const feedStarterHydration = selectedStarterForFeed?.hydration ?? 100;

  // Ratio presets are now seed:flour only — water follows the starter's hydration,
  // so a 60% starter is fed a 60% flour/water split instead of a forced 50/50.
  const handleRatioPresetChange = (preset: string) => {
    setSelectedRatioPreset(preset);
    const [rS, rF] = preset.split(':').map(Number);
    if (rF > 0) {
      setRatioSeed(rS);
      setRatioFlour(rF);
      setRatioWater(rF); // kept in sync for the live ratio string
      setSeedGrams(Math.round(flourGrams * (rS / rF)));
      setWaterGrams(Math.round(flourGrams * (feedStarterHydration / 100)));
    }
  };

  // Handle flour change in ratio mode
  const handleFlourChangeInRatioMode = (newFlour: number) => {
    setFlourGrams(newFlour);
    if (feedMode === 'ratio' && ratioFlour > 0) {
      setSeedGrams(Math.round(newFlour * (ratioSeed / ratioFlour)));
      setWaterGrams(Math.round(newFlour * (feedStarterHydration / 100)));
    }
  };

  // Auth Guard for Guest Users
  if (!user) {
    return (
      <div className="max-w-lg mx-auto w-full py-8 px-5">
        <div className="bg-card rounded-[20px] border border-border-card shadow-[0_8px_24px_rgba(51,48,42,0.06),inset_0_1px_0_rgba(255,255,255,1)] p-6 text-center space-y-5">
          <div className="w-14 h-14 rounded-full bg-linen flex items-center justify-center text-terracotta border border-border-field mx-auto">
            <Lock className="w-6 h-6" strokeWidth={2} />
          </div>

          <div className="space-y-1.5">
            <span className="font-serif italic text-xs uppercase tracking-[0.22em] text-terracotta">
              Member Feature
            </span>
            <h2 className="font-serif text-2xl font-semibold text-ink">
              Unlock Your Personal Starter Diary
            </h2>
            <p className="font-sans text-xs text-muted max-w-xs mx-auto leading-relaxed">
              Name your sourdough starters, record feedings, track peak rise hours, and calculate levain builds.
            </p>
          </div>

          <div className="bg-oat p-4 rounded-xl border border-border-field text-left space-y-2">
            <div className="flex items-center gap-2 text-ink font-sans text-xs font-semibold">
              <ShieldCheck className="w-4 h-4 text-terracotta" /> Personalize starters with custom human names
            </div>
            <div className="flex items-center gap-2 text-ink font-sans text-xs font-semibold">
              <ShieldCheck className="w-4 h-4 text-terracotta" /> Interactive feeding history log & fermentation notes
            </div>
            <div className="flex items-center gap-2 text-ink font-sans text-xs font-semibold">
              <ShieldCheck className="w-4 h-4 text-terracotta" /> Dual-mode ratio & manual feed calculator
            </div>
          </div>

          <button
            onClick={onOpenAuth}
            className="w-full bg-terracotta hover:bg-primary text-white font-sans font-semibold text-sm py-3.5 px-5 rounded-[16px] shadow-btnTerracotta active:scale-98 transition-all"
          >
            Sign In with Google or Email
          </button>
        </div>
      </div>
    );
  }

  const handleOpenFeedModal = (starter: StarterProfile) => {
    setSelectedStarterForFeed(starter);
    setFeedFlourType(starter.flourType || 'Dark Rye');
    // Seed the calculator from this starter's own hydration, not a forced 1:2:2.
    const flour = 50;
    setFeedMode('ratio');
    setSelectedRatioPreset('1:2');
    setRatioSeed(1);
    setRatioFlour(2);
    setRatioWater(2);
    setFlourGrams(flour);
    setSeedGrams(Math.round(flour * 0.5));
    setWaterGrams(Math.round(flour * (starter.hydration / 100)));
    setFeedNotes('');
  };

  const handleSaveFeed = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStarterForFeed) return;

    // Ratio string is always derived from the actual grams, so a stiff-starter
    // feed records e.g. 1:2:1 rather than the preset's nominal 1:2:2.
    const minPart = Math.min(seedGrams, flourGrams, waterGrams) || 1;
    const rSeed = Math.round(seedGrams / minPart);
    const rFlour = Math.round(flourGrams / minPart);
    const rWater = Math.round(waterGrams / minPart);
    const ratioStr = `${rSeed}:${rFlour}:${rWater}`;

    const newEntry: StarterFeedEntry = {
      id: `feed-${Date.now()}`,
      timestamp: Date.now(),
      dateStr: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      timeStr: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      seedGrams,
      flourGrams,
      flourType: feedFlourType,
      waterGrams,
      waterTemp: '24°C',
      ratio: ratioStr,
      notes: feedNotes || 'Fresh feeding logged.',
    };

    onLogFeed(selectedStarterForFeed.id, newEntry);

    // If currently viewing history of this starter, update view
    if (selectedStarterForHistory?.id === selectedStarterForFeed.id) {
      setSelectedStarterForHistory({
        ...selectedStarterForHistory,
        lastFedTimestamp: Date.now(),
        lastRatio: ratioStr,
        status: 'active_peak',
        feedHistory: [newEntry, ...selectedStarterForHistory.feedHistory],
      });
    }

    setSelectedStarterForFeed(null);
    setFeedNotes('');
  };

  const handleCreateStarter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStarterName.trim()) return;

    const hyd = Math.max(1, newStarterHydration || 100);
    const initFlour = 40;
    const initWater = Math.round(initFlour * (hyd / 100));

    const newProfile: StarterProfile = {
      id: `starter-${Date.now()}`,
      name: newStarterName.trim(),
      flourType: newStarterFlour,
      hydration: hyd,
      dateCreated: new Date().toISOString().split('T')[0],
      status: 'active_peak',
      lastFedTimestamp: Date.now(),
      lastRatio: `1:2:${Math.max(1, Math.round(2 * (hyd / 100)))}`,
      peakTargetTimestamp: Date.now() + 4.5 * 3600 * 1000,
      feedHistory: [
        {
          id: `feed-init-${Date.now()}`,
          timestamp: Date.now(),
          dateStr: 'Today',
          timeStr: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          seedGrams: 20,
          flourGrams: initFlour,
          flourType: newStarterFlour,
          waterGrams: initWater,
          ratio: `1:2:${Math.max(1, Math.round(2 * (hyd / 100)))}`,
          notes: 'Starter initialized.',
        },
      ],
    };

    onAddStarter(newProfile);
    setIsAddStarterOpen(false);
    setNewStarterName('');
    setNewStarterHydration(100);
  };

  const totalFeedBuild = seedGrams + flourGrams + waterGrams;

  return (
    <div className="space-y-6 max-w-lg mx-auto w-full pb-8 animate-fadeIn">
      {/* Header Actions */}
      <div className="flex justify-between items-center pt-1 px-1">
        <button
          onClick={() => setIsAddStarterOpen(true)}
          className="text-muted hover:text-ink font-sans text-xs font-semibold flex items-center gap-1 transition-colors"
        >
          <Plus className="w-4 h-4" /> New Starter
        </button>

        <button
          onClick={() => handleOpenFeedModal(starters[0])}
          className="bg-ink text-onDark shadow-btnInk rounded-[16px] px-4 py-2.5 flex items-center gap-1.5 font-sans text-xs uppercase font-bold tracking-widest transition-transform active:scale-95 hover:opacity-90"
        >
          <span>Log Feed</span>
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Active Starters List */}
      <section className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <h2 className="font-serif italic text-xs uppercase tracking-[0.22em] text-muted">
            My Starters
          </h2>
          <span className="font-sans text-[11px] text-faint">Tap card for history</span>
        </div>

        {starters.map((starter) => {
          const isPeak = starter.status === 'active_peak';
          const relativeFed = starter.lastFedTimestamp ? getRelativeTime(starter.lastFedTimestamp) : 'Never';

          // Honest readiness: elapsed since last feed vs. the projected time to peak.
          const feedProgress = (() => {
            const fed = starter.lastFedTimestamp;
            const peak = starter.peakTargetTimestamp;
            if (!fed) return null;
            if (!peak || peak <= fed) return 1;
            return Math.min(1, Math.max(0, (Date.now() - fed) / (peak - fed)));
          })();
          const pastPeak = feedProgress !== null && feedProgress >= 1;
          const isConfirmingDelete = confirmDeleteId === starter.id;

          return (
            <div
              key={starter.id}
              onClick={() => setSelectedStarterForHistory(starter)}
              className="bg-card rounded-[20px] p-[17px] shadow-[0_2px_12px_rgba(51,48,42,0.06),inset_0_1px_0_rgba(255,255,255,0.8)] border border-border-card relative overflow-hidden flex flex-col gap-3.5 cursor-pointer hover:border-terracotta/40 transition-all active:scale-[0.99] group"
            >
              {/* Name + Feed (top-right) + delete */}
              <div className="flex justify-between items-start gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif text-[22px] font-semibold text-ink group-hover:text-terracotta transition-colors truncate">
                      {starter.name}
                    </h3>
                    <ChevronRight className="w-4 h-4 text-faint group-hover:text-terracotta transition-colors flex-shrink-0" />
                  </div>
                  <p className="font-sans text-xs text-muted mt-0.5">
                    {starter.hydration}% Hydration • {starter.flourType}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenFeedModal(starter);
                    }}
                    className="bg-ink text-onDark shadow-btnInk rounded-[11px] pl-2.5 pr-3 py-1.5 flex items-center gap-1 font-sans text-xs font-bold active:scale-95 hover:opacity-90 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" /> Feed
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmDeleteId(starter.id);
                    }}
                    className="text-disabled hover:text-danger p-1 transition-colors"
                    title="Delete starter"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Feed Metrics */}
              <div className="border-t border-dashed border-border-card pt-3 flex justify-between">
                <div className="flex flex-col">
                  <span className="font-sans text-[10px] text-faint uppercase font-bold tracking-wider mb-0.5">
                    Last Fed
                  </span>
                  <span className="font-sans text-sm font-bold text-ink">{relativeFed}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="font-sans text-[10px] text-faint uppercase font-bold tracking-wider mb-0.5">
                    Last Ratio
                  </span>
                  <span className="font-mono text-sm font-bold text-ink">
                    {starter.lastRatio || '1:2:2'}
                  </span>
                </div>
              </div>

              {/* Bottom bar: honest readiness + status pill (moved down from top-right) */}
              {isConfirmingDelete ? (
                <div
                  className="flex items-center justify-between gap-2 bg-danger/5 border border-danger/20 rounded-xl px-3 py-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="font-sans text-xs text-ink font-semibold truncate">
                    Delete {starter.name}?
                  </span>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(null)}
                      className="font-sans text-xs text-muted hover:text-ink px-2 py-1"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onDeleteStarter(starter.id);
                        setConfirmDeleteId(null);
                      }}
                      className="font-sans text-xs font-semibold text-white bg-danger hover:opacity-90 rounded-lg px-3 py-1 active:scale-98 transition-all"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="bg-oat border border-border-field rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${pastPeak ? 'bg-warning' : 'bg-terracotta'}`}
                        style={{ width: `${(feedProgress ?? 0) * 100}%` }}
                      />
                    </div>
                    <span className="font-sans text-[10px] text-faint mt-1 block">
                      {feedProgress === null
                        ? 'Not fed yet'
                        : pastPeak
                        ? 'Past peak — feed soon'
                        : `${Math.round(feedProgress * 100)}% to peak`}
                    </span>
                  </div>
                  <div
                    className={`px-2.5 py-1 rounded-full flex items-center gap-1.5 border flex-shrink-0 ${
                      isPeak
                        ? 'bg-terracotta/10 text-terracotta border-terracotta/20'
                        : 'bg-warning/10 text-warning border-warning/20'
                    }`}
                  >
                    {isPeak ? (
                      <Flame className="w-3.5 h-3.5" />
                    ) : (
                      <Utensils className="w-3.5 h-3.5" />
                    )}
                    <span className="font-sans text-[10px] uppercase font-bold tracking-wider">
                      {isPeak ? 'Active & Peak' : 'Hungry'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </section>

      {/* ================= STARTER FEEDING HISTORY MODAL ================= */}
      {selectedStarterForHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-card max-w-md w-full max-h-[85vh] rounded-[24px] border border-border-card shadow-2xl flex flex-col overflow-hidden animate-scaleUp">
            {/* Modal Header */}
            <div className="p-5 bg-card border-b border-border-card flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-serif italic text-xs uppercase text-terracotta">Feeding Journal</span>
                  <span className="bg-linen px-2 py-0.5 rounded-full font-mono text-[10px] text-ink font-semibold">
                    {selectedStarterForHistory.feedHistory?.length || 0} Feeds
                  </span>
                </div>
                <h3 className="font-serif text-2xl font-bold text-ink mt-0.5">
                  {selectedStarterForHistory.name}
                </h3>
                <p className="font-sans text-xs text-muted">
                  {selectedStarterForHistory.flourType} · {selectedStarterForHistory.hydration}% Hydration
                </p>
              </div>

              <button
                onClick={() => setSelectedStarterForHistory(null)}
                className="text-muted hover:text-ink p-1 rounded-full hover:bg-oat transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* History Feed List */}
            <div className="p-5 overflow-y-auto space-y-3 flex-1">
              {(!selectedStarterForHistory.feedHistory || selectedStarterForHistory.feedHistory.length === 0) ? (
                <div className="py-8 text-center space-y-2">
                  <History className="w-8 h-8 text-muted mx-auto" />
                  <p className="font-serif text-sm text-ink">No feed history recorded yet.</p>
                  <p className="font-sans text-xs text-muted">Log your first feed below!</p>
                </div>
              ) : (
                selectedStarterForHistory.feedHistory.map((feed) => (
                  <div
                    key={feed.id}
                    className="bg-oat/70 rounded-xl p-3.5 border border-border-field space-y-2"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="font-sans text-xs font-bold text-ink">{feed.dateStr}</span>
                        <span className="font-sans text-[11px] text-faint">({feed.timeStr})</span>
                      </div>
                      <span className="bg-linen border border-border-card text-terracotta font-mono font-bold text-xs px-2.5 py-0.5 rounded-full">
                        {feed.ratio}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center bg-card p-2 rounded-lg border border-border-card/60">
                      <div>
                        <span className="text-[10px] text-faint uppercase font-bold block">Seed</span>
                        <span className="font-mono text-xs font-bold text-ink">{feed.seedGrams}g</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-faint uppercase font-bold block">Flour ({feed.flourType || 'Flour'})</span>
                        <span className="font-mono text-xs font-bold text-ink">{feed.flourGrams}g</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-faint uppercase font-bold block">Water</span>
                        <span className="font-mono text-xs font-bold text-ink">{feed.waterGrams}g</span>
                      </div>
                    </div>

                    {feed.notes && (
                      <p className="font-serif italic text-xs text-muted pl-1 border-l-2 border-terracotta/40">
                        "{feed.notes}"
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer Action */}
            <div className="p-4 bg-oat border-t border-border-card flex gap-2">
              <button
                onClick={() => {
                  const target = selectedStarterForHistory;
                  setSelectedStarterForHistory(null);
                  handleOpenFeedModal(target);
                }}
                className="w-full bg-terracotta hover:bg-primary text-white py-3 rounded-[16px] font-sans font-semibold text-xs shadow-btnTerracotta active:scale-98 transition-all flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Log New Feed for {selectedStarterForHistory.name}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= LOG FEED & DUAL LEVAIN CALCULATOR MODAL ================= */}
      {selectedStarterForFeed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-card max-w-sm w-full rounded-[24px] border border-border-card p-5 space-y-4 shadow-2xl animate-scaleUp">
            <div className="flex justify-between items-start">
              <div>
                <span className="font-serif italic text-xs uppercase text-terracotta">Feed & Levain Calculator</span>
                <h3 className="font-serif text-xl font-semibold text-ink">
                  {selectedStarterForFeed.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedStarterForFeed(null)}
                className="text-muted hover:text-ink p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Feed Mode Switcher (Ratio vs Manual) */}
            <div className="grid grid-cols-2 gap-1 p-1 bg-oat border border-border-field rounded-xl">
              <button
                type="button"
                onClick={() => setFeedMode('ratio')}
                className={`py-1.5 px-2 rounded-lg text-center font-sans text-xs font-semibold transition-all ${
                  feedMode === 'ratio'
                    ? 'bg-card text-ink shadow-sm border border-border-card'
                    : 'text-muted hover:text-ink'
                }`}
              >
                ⚖️ Ratio Mode
              </button>
              <button
                type="button"
                onClick={() => setFeedMode('manual')}
                className={`py-1.5 px-2 rounded-lg text-center font-sans text-xs font-semibold transition-all ${
                  feedMode === 'manual'
                    ? 'bg-card text-ink shadow-sm border border-border-card'
                    : 'text-muted hover:text-ink'
                }`}
              >
                ✍️ Manual Mode
              </button>
            </div>

            <form onSubmit={handleSaveFeed} className="space-y-3.5">
              {/* Ratio Mode Presets — seed:flour; water tracks the starter's hydration */}
              {feedMode === 'ratio' && (
                <div className="space-y-2">
                  <label className="text-[10px] text-faint uppercase font-bold font-sans block">
                    Seed : Flour — water follows {feedStarterHydration}% hydration
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {['1:1', '1:2', '1:3', '1:4'].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => handleRatioPresetChange(preset)}
                        className={`py-1.5 rounded-lg font-mono text-xs font-bold border transition-all ${
                          selectedRatioPreset === preset
                            ? 'bg-linen border-terracotta text-terracotta shadow-sm'
                            : 'bg-oat border-border-field text-muted hover:text-ink'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Feed Grams Grid */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-faint uppercase font-bold font-sans block mb-1">
                    Seed (g)
                  </label>
                  <input
                    type="number"
                    value={seedGrams}
                    disabled={feedMode === 'ratio'}
                    onChange={(e) => setSeedGrams(Math.max(0, Number(e.target.value) || 0))}
                    className={`w-full bg-oat border border-border-field rounded-[11px] p-2 text-center font-mono font-bold text-xs ${
                      feedMode === 'ratio' ? 'opacity-80 bg-linen/70' : ''
                    }`}
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] text-faint uppercase font-bold font-sans block mb-1">
                    Flour (g)
                  </label>
                  <input
                    type="number"
                    value={flourGrams}
                    onChange={(e) => {
                      const val = Math.max(0, Number(e.target.value) || 0);
                      if (feedMode === 'ratio') {
                        handleFlourChangeInRatioMode(val);
                      } else {
                        setFlourGrams(val);
                      }
                    }}
                    className="w-full bg-oat border border-border-field rounded-[11px] p-2 text-center font-mono font-bold text-xs focus:ring-2 focus:ring-terracotta/20"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] text-faint uppercase font-bold font-sans block mb-1">
                    Water (g)
                  </label>
                  <input
                    type="number"
                    value={waterGrams}
                    disabled={feedMode === 'ratio'}
                    onChange={(e) => setWaterGrams(Math.max(0, Number(e.target.value) || 0))}
                    className={`w-full bg-oat border border-border-field rounded-[11px] p-2 text-center font-mono font-bold text-xs ${
                      feedMode === 'ratio' ? 'opacity-80 bg-linen/70' : ''
                    }`}
                    required
                  />
                </div>
              </div>

              {/* Live Build Summary */}
              <div className="bg-linen p-2.5 rounded-xl border border-border-card flex justify-between items-center text-xs">
                <span className="font-serif italic text-muted">Total Levain Build:</span>
                <span className="font-mono font-bold text-terracotta">{totalFeedBuild}g</span>
              </div>

              <div>
                <label className="text-[10px] text-faint uppercase font-bold font-sans block mb-1">Flour Type</label>
                <input
                  type="text"
                  value={feedFlourType}
                  onChange={(e) => setFeedFlourType(e.target.value)}
                  className="w-full bg-oat border border-border-field rounded-[11px] p-2 text-xs font-sans text-ink focus:outline-none"
                  placeholder="e.g. Dark Rye, Bread Flour"
                />
              </div>

              <div>
                <label className="text-[10px] text-faint uppercase font-bold font-sans block mb-1">Notes / Aroma Observations</label>
                <input
                  type="text"
                  placeholder="e.g. Doubled in 4h, fruity sweet aroma"
                  value={feedNotes}
                  onChange={(e) => setFeedNotes(e.target.value)}
                  className="w-full bg-oat border border-border-field rounded-[11px] p-2 text-xs font-sans text-ink focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-terracotta hover:bg-primary text-white py-3 rounded-[16px] font-sans font-semibold text-xs shadow-btnTerracotta active:scale-98 transition-all"
              >
                Save Feed & Refresh Status
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ================= ADD NEW STARTER MODAL ================= */}
      {isAddStarterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-card max-w-sm w-full rounded-[20px] border border-border-card p-5 space-y-4 shadow-xl animate-scaleUp">
            <div className="flex justify-between items-start">
              <h3 className="font-serif text-lg font-semibold text-ink">Name Your Starter</h3>
              <button
                onClick={() => setIsAddStarterOpen(false)}
                className="text-muted hover:text-ink"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStarter} className="space-y-3">
              <div>
                <label className="text-[10px] text-faint uppercase font-bold font-sans">Starter Name</label>
                <input
                  type="text"
                  placeholder="e.g. Doughlene, Clint Yeastwood"
                  value={newStarterName}
                  onChange={(e) => setNewStarterName(e.target.value)}
                  className="w-full bg-oat border border-border-field rounded-[11px] p-2.5 text-xs font-serif text-ink focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] text-faint uppercase font-bold font-sans">Flour Profile</label>
                <input
                  type="text"
                  placeholder="e.g. 100% Dark Rye, AP Blend"
                  value={newStarterFlour}
                  onChange={(e) => setNewStarterFlour(e.target.value)}
                  className="w-full bg-oat border border-border-field rounded-[11px] p-2.5 text-xs font-sans text-ink focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] text-faint uppercase font-bold font-sans">Hydration</label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    value={newStarterHydration}
                    onChange={(e) => setNewStarterHydration(Math.max(0, Number(e.target.value) || 0))}
                    className="w-full bg-oat border border-border-field rounded-[11px] p-2.5 pr-8 text-xs font-mono font-bold text-ink focus:outline-none"
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 font-sans text-xs text-muted">%</span>
                </div>
                <p className="font-serif italic text-[11px] text-muted mt-1">
                  100 = equal flour &amp; water. Lower for a stiff starter (e.g. 60).
                </p>
              </div>

              <button
                type="submit"
                className="w-full bg-ink text-onDark py-3 rounded-[16px] font-sans font-semibold text-xs shadow-btnInk active:scale-98 transition-all hover:opacity-90"
              >
                Create Starter
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
