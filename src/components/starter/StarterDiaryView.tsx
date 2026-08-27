import React, { useState } from 'react';
import {
  Wheat,
  Plus,
  Flame,
  Utensils,
  Calculator,
  Lock,
  X,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { StarterProfile, UserProfile, StarterFeedEntry } from '../../types';
import { calculateLevain } from '../../utils/bakersMath';
import { getRelativeTime } from '../../utils/formatters';

interface StarterDiaryViewProps {
  user: UserProfile | null;
  starters: StarterProfile[];
  onAddStarter: (starter: StarterProfile) => void;
  onLogFeed: (starterId: string, entry: StarterFeedEntry) => void;
  onOpenAuth: () => void;
}

export const StarterDiaryView: React.FC<StarterDiaryViewProps> = ({
  user,
  starters,
  onAddStarter,
  onLogFeed,
  onOpenAuth,
}) => {
  const [selectedStarterForFeed, setSelectedStarterForFeed] = useState<StarterProfile | null>(null);
  const [isAddStarterOpen, setIsAddStarterOpen] = useState(false);
  const [newStarterName, setNewStarterName] = useState('');
  const [newStarterFlour, setNewStarterFlour] = useState('100% Rye');

  // Feed Modal State
  const [seedGrams, setSeedGrams] = useState(25);
  const [flourGrams, setFlourGrams] = useState(50);
  const [waterGrams, setWaterGrams] = useState(50);
  const [feedFlourType, setFeedFlourType] = useState('Dark Rye');
  const [feedNotes, setFeedNotes] = useState('');

  // Target Levain Calculator State
  const [targetLevainWeight, setTargetLevainWeight] = useState(150);

  const levainCalc = calculateLevain({
    targetWeight: targetLevainWeight,
    ratioSeed: 1,
    ratioFlour: 2,
    ratioWater: 2,
  });

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
              <ShieldCheck className="w-4 h-4 text-terracotta" /> Live health status & peak rise countdowns
            </div>
            <div className="flex items-center gap-2 text-ink font-sans text-xs font-semibold">
              <ShieldCheck className="w-4 h-4 text-terracotta" /> 1-tap link to the Recipe Builder
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

  const handleSaveFeed = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStarterForFeed) return;

    // Calculate ratio string
    const minPart = Math.min(seedGrams, flourGrams, waterGrams) || 1;
    const rSeed = Math.round(seedGrams / minPart);
    const rFlour = Math.round(flourGrams / minPart);
    const rWater = Math.round(waterGrams / minPart);
    const ratioStr = `${rSeed}:${rFlour}:${rWater}`;

    const newEntry: StarterFeedEntry = {
      id: `feed-${Date.now()}`,
      timestamp: Date.now(),
      dateStr: 'Today',
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
    setSelectedStarterForFeed(null);
    setFeedNotes('');
  };

  const handleCreateStarter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStarterName.trim()) return;

    const newProfile: StarterProfile = {
      id: `starter-${Date.now()}`,
      name: newStarterName.trim(),
      flourType: newStarterFlour,
      hydration: 100,
      dateCreated: new Date().toISOString().split('T')[0],
      status: 'active_peak',
      lastFedTimestamp: Date.now(),
      lastRatio: '1:2:2',
      peakTargetTimestamp: Date.now() + 4.5 * 3600 * 1000,
      feedHistory: [
        {
          id: `feed-init-${Date.now()}`,
          timestamp: Date.now(),
          dateStr: 'Today',
          timeStr: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          seedGrams: 20,
          flourGrams: 40,
          flourType: newStarterFlour,
          waterGrams: 40,
          ratio: '1:2:2',
          notes: 'Starter initialized.',
        },
      ],
    };

    onAddStarter(newProfile);
    setIsAddStarterOpen(false);
    setNewStarterName('');
  };

  return (
    <div className="space-y-6 max-w-lg mx-auto w-full pb-8">
      {/* Header Actions */}
      <div className="flex justify-between items-center pt-1 px-1">
        <button
          onClick={() => setIsAddStarterOpen(true)}
          className="text-muted hover:text-ink font-sans text-xs font-semibold flex items-center gap-1"
        >
          <Plus className="w-4 h-4" /> New Starter
        </button>

        <button
          onClick={() => setSelectedStarterForFeed(starters[0] || null)}
          className="bg-ink text-onDark shadow-btnInk rounded-[16px] px-4 py-2.5 flex items-center gap-1.5 font-sans text-xs uppercase font-bold tracking-widest transition-transform active:scale-95"
        >
          <span>Log Feed</span>
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Active Starters List */}
      <section className="space-y-4">
        <h2 className="font-serif italic text-xs uppercase tracking-[0.22em] text-muted">
          My Starters
        </h2>

        {starters.map((starter) => {
          const isPeak = starter.status === 'active_peak';
          const relativeFed = starter.lastFedTimestamp ? getRelativeTime(starter.lastFedTimestamp) : 'Never';

          return (
            <div
              key={starter.id}
              className="bg-card rounded-[20px] p-[17px] shadow-[0_2px_12px_rgba(51,48,42,0.06),inset_0_1px_0_rgba(255,255,255,0.8)] border border-border-card relative overflow-hidden flex flex-col gap-4"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-serif text-[22px] font-semibold text-ink">
                    {starter.name}
                  </h3>
                  <p className="font-sans text-xs text-muted mt-0.5">
                    {starter.hydration}% Hydration • {starter.flourType}
                  </p>
                </div>

                <div
                  className={`px-3 py-1 rounded-full flex items-center gap-1.5 border ${
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

              {/* Feed Metrics */}
              <div className="border-t border-dashed border-border-card pt-3 flex justify-between">
                <div className="flex flex-col">
                  <span className="font-sans text-[10px] text-faint uppercase font-bold tracking-wider mb-0.5">
                    Last Fed
                  </span>
                  <span className="font-sans text-sm font-bold text-ink">{relativeFed}</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-sans text-[10px] text-faint uppercase font-bold tracking-wider mb-0.5">
                    Ratio
                  </span>
                  <span className="font-mono text-sm font-bold text-ink">
                    {starter.lastRatio || '1:2:2'}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="font-sans text-[10px] text-faint uppercase font-bold tracking-wider mb-0.5">
                    Status
                  </span>
                  <span
                    className={`font-sans text-sm font-bold ${
                      isPeak ? 'text-olive' : 'text-danger'
                    }`}
                  >
                    {isPeak ? 'Ready' : 'Feed Due'}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-oat border border-border-field rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    isPeak ? 'bg-terracotta w-[85%]' : 'bg-warning w-[25%]'
                  }`}
                />
              </div>
            </div>
          );
        })}
      </section>

      {/* Target Levain Calculator */}
      <section className="space-y-4 pt-2">
        <div className="flex items-center gap-2">
          <Calculator className="w-4 h-4 text-terracotta" />
          <h2 className="font-serif italic text-xs uppercase tracking-[0.22em] text-muted">
            Target Levain Calculator (1:2:2)
          </h2>
        </div>

        <div className="bg-linen rounded-[20px] p-[17px] border border-border-card flex flex-col gap-5 relative overflow-hidden">
          {/* Target Weight Input */}
          <div className="space-y-1.5">
            <label className="font-sans text-[10px] text-faint uppercase font-bold tracking-wider block">
              Target Weight (g)
            </label>
            <div className="relative w-3/5">
              <input
                type="number"
                value={targetLevainWeight}
                onChange={(e) => setTargetLevainWeight(Math.max(0, Number(e.target.value) || 0))}
                className="w-full bg-oat border border-border-field rounded-[11px] px-3 py-2 font-mono text-[17px] font-bold text-ink focus:outline-none focus:ring-2 focus:ring-terracotta/20 text-right pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 font-sans text-xs text-muted">
                g
              </span>
            </div>
          </div>

          {/* Dotted Leader Rows */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-baseline w-full">
              <span className="font-serif text-[15px] text-ink whitespace-nowrap">Starter</span>
              <div className="flex-1 border-b-[1.5px] border-dotted border-border-leader mx-2 relative top-[-4px]" />
              <span className="font-sans text-[15px] font-bold text-ink mr-1">
                {levainCalc.seedGrams}
              </span>
              <span className="font-sans text-[11px] text-faint">g</span>
            </div>

            <div className="flex items-baseline w-full">
              <span className="font-serif text-[15px] text-ink whitespace-nowrap">Flour</span>
              <div className="flex-1 border-b-[1.5px] border-dotted border-border-leader mx-2 relative top-[-4px]" />
              <span className="font-sans text-[15px] font-bold text-ink mr-1">
                {levainCalc.flourGrams}
              </span>
              <span className="font-sans text-[11px] text-faint">g</span>
            </div>

            <div className="flex items-baseline w-full">
              <span className="font-serif text-[15px] text-ink whitespace-nowrap">Water</span>
              <div className="flex-1 border-b-[1.5px] border-dotted border-border-leader mx-2 relative top-[-4px]" />
              <span className="font-sans text-[15px] font-bold text-ink mr-1">
                {levainCalc.waterGrams}
              </span>
              <span className="font-sans text-[11px] text-faint">g</span>
            </div>
          </div>

          {/* Totals Bar */}
          <div className="-mx-[17px] -mb-[17px] bg-terracotta text-onDark p-3.5 px-[17px] flex justify-between items-center">
            <span className="font-serif italic text-sm text-onDark">Total Build</span>
            <div className="flex items-baseline gap-1">
              <span className="font-mono font-bold text-base text-onDark">
                {levainCalc.totalBuildGrams}
              </span>
              <span className="font-sans text-xs text-onDark/75">g</span>
            </div>
          </div>
        </div>
      </section>

      {/* Log Feed Modal */}
      {selectedStarterForFeed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-card max-w-sm w-full rounded-[20px] border border-border-card p-5 space-y-4 shadow-xl">
            <div className="flex justify-between items-start">
              <div>
                <span className="font-serif italic text-xs uppercase text-terracotta">Feed Log</span>
                <h3 className="font-serif text-lg font-semibold text-ink">
                  {selectedStarterForFeed.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedStarterForFeed(null)}
                className="text-muted hover:text-ink"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFeed} className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-faint uppercase font-bold font-sans">Seed (g)</label>
                  <input
                    type="number"
                    value={seedGrams}
                    onChange={(e) => setSeedGrams(Number(e.target.value))}
                    className="w-full bg-oat border border-border-field rounded-[11px] p-2 text-center font-mono font-bold text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] text-faint uppercase font-bold font-sans">Flour (g)</label>
                  <input
                    type="number"
                    value={flourGrams}
                    onChange={(e) => setFlourGrams(Number(e.target.value))}
                    className="w-full bg-oat border border-border-field rounded-[11px] p-2 text-center font-mono font-bold text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] text-faint uppercase font-bold font-sans">Water (g)</label>
                  <input
                    type="number"
                    value={waterGrams}
                    onChange={(e) => setWaterGrams(Number(e.target.value))}
                    className="w-full bg-oat border border-border-field rounded-[11px] p-2 text-center font-mono font-bold text-xs"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-faint uppercase font-bold font-sans">Flour Type</label>
                <input
                  type="text"
                  value={feedFlourType}
                  onChange={(e) => setFeedFlourType(e.target.value)}
                  className="w-full bg-oat border border-border-field rounded-[11px] p-2 text-xs font-sans"
                />
              </div>

              <div>
                <label className="text-[10px] text-faint uppercase font-bold font-sans">Notes / Aroma</label>
                <input
                  type="text"
                  placeholder="e.g. Doubled in 4h, sweet yeasty aroma"
                  value={feedNotes}
                  onChange={(e) => setFeedNotes(e.target.value)}
                  className="w-full bg-oat border border-border-field rounded-[11px] p-2 text-xs font-sans"
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

      {/* Add New Starter Modal */}
      {isAddStarterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-card max-w-sm w-full rounded-[20px] border border-border-card p-5 space-y-4 shadow-xl">
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
                  className="w-full bg-oat border border-border-field rounded-[11px] p-2.5 text-xs font-serif text-ink"
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
                  className="w-full bg-oat border border-border-field rounded-[11px] p-2.5 text-xs font-sans"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-ink text-onDark py-3 rounded-[16px] font-sans font-semibold text-xs shadow-btnInk active:scale-98 transition-all"
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
