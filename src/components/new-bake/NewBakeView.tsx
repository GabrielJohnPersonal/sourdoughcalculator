import React, { useState, useMemo } from 'react';
import {
  Lock,
  Plus,
  X,
  ArrowRight,
  Droplets,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import { FlourBlendItem, StarterProfile, UserProfile, BakeSession } from '../../types';

interface NewBakeViewProps {
  user: UserProfile | null;
  starters: StarterProfile[];
  onCreateBake: (session: BakeSession) => void;
  onOpenAuth: () => void;
}

export const NewBakeView: React.FC<NewBakeViewProps> = ({
  user,
  starters,
  onCreateBake,
  onOpenAuth,
}) => {
  // ================= SECTION 1: TARGET BANNETON SIZE =================
  const [loafSizePreset, setLoafSizePreset] = useState<'small' | 'medium' | 'large' | 'custom'>('large');
  const [totalFlour, setTotalFlour] = useState<number>(500);
  const [loaves, setLoaves] = useState<number>(1);
  const [hydration, setHydration] = useState<number>(75);
  const [saltPct, setSaltPct] = useState<number>(2.0);

  // ================= SECTION 2: STARTER INPUT =================
  const [starterInputMode, setStarterInputMode] = useState<'diary' | 'grams' | 'manual'>('diary');
  const [selectedStarterId, setSelectedStarterId] = useState<string>(starters[0]?.id || 'starter-1');
  const [starterTotalGrams, setStarterTotalGrams] = useState<number>(100);
  const [manualStarterFlour, setManualStarterFlour] = useState<number>(50);
  const [manualStarterWater, setManualStarterWater] = useState<number>(50);

  // ================= SECTION 3: FLOUR BLEND =================
  const [flourBlend, setFlourBlend] = useState<FlourBlendItem[]>([
    { id: '1', name: 'Bread Flour', percentage: 80 },
    { id: '2', name: 'Whole Wheat', percentage: 20 },
  ]);

  const handleSelectSizePreset = (preset: 'small' | 'medium' | 'large' | 'custom') => {
    setLoafSizePreset(preset);
    if (preset === 'small') setTotalFlour(300);
    else if (preset === 'medium') setTotalFlour(400);
    else if (preset === 'large') setTotalFlour(500);
  };

  const selectedStarter = useMemo(() => {
    return starters.find((s) => s.id === selectedStarterId) || starters[0];
  }, [starters, selectedStarterId]);

  // ================= CALCULATION ENGINE =================
  let computedStarterFlour = 0;
  let computedStarterWater = 0;
  let computedTotalStarter = 0;

  if (starterInputMode === 'diary') {
    const hyd = selectedStarter ? selectedStarter.hydration : 100;
    computedTotalStarter = starterTotalGrams * loaves;
    computedStarterFlour = Math.round(computedTotalStarter / (1 + hyd / 100));
    computedStarterWater = computedTotalStarter - computedStarterFlour;
  } else if (starterInputMode === 'grams') {
    computedTotalStarter = starterTotalGrams * loaves;
    computedStarterFlour = Math.round(computedTotalStarter / 2);
    computedStarterWater = computedTotalStarter - computedStarterFlour;
  } else if (starterInputMode === 'manual') {
    computedStarterFlour = manualStarterFlour * loaves;
    computedStarterWater = manualStarterWater * loaves;
    computedTotalStarter = computedStarterFlour + computedStarterWater;
  }

  const totalWaterGrams = Math.round((totalFlour * hydration) / 100) * loaves;
  const totalSaltGrams = Math.round((totalFlour * saltPct) / 100 * 10) / 10 * loaves;

  const mainFlourTotal = Math.max(0, totalFlour * loaves - computedStarterFlour);
  const mainWaterGrams = Math.max(0, totalWaterGrams - computedStarterWater);

  const totalBlendPct = flourBlend.reduce((acc, item) => acc + (Number(item.percentage) || 0), 0) || 100;
  const itemizedFlourRows = flourBlend.map((item) => {
    const itemPct = (Number(item.percentage) || 0) / totalBlendPct;
    const weightGrams = Math.round(mainFlourTotal * itemPct);
    const bakersPercentage = totalFlour > 0 ? Math.round((weightGrams / (totalFlour * loaves)) * 1000) / 10 : 0;
    return {
      id: item.id,
      name: `${item.name} (${item.percentage}%)`,
      weightGrams,
      bakersPercentage,
    };
  });

  const totalDoughWeight = totalFlour * loaves + totalWaterGrams + totalSaltGrams;
  const totalDoughPercentage = totalFlour > 0 ? Math.round((totalDoughWeight / (totalFlour * loaves)) * 1000) / 10 : 0;

  const handleAddFlour = () => {
    const newId = String(Date.now());
    setFlourBlend((prev) => [...prev, { id: newId, name: 'Dark Rye', percentage: 10 }]);
  };

  const handleRemoveFlour = (id: string) => {
    if (flourBlend.length <= 1) return;
    setFlourBlend((prev) => prev.filter((item) => item.id !== id));
  };

  const handleUpdateFlour = (id: string, field: 'name' | 'percentage', val: string | number) => {
    setFlourBlend((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, [field]: field === 'percentage' ? Number(val) || 0 : val } : item
      )
    );
  };

  const handleCreateSession = () => {
    const newSession: BakeSession = {
      id: Date.now(),
      date: 'Today',
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      title: starterInputMode === 'diary' && selectedStarter ? `${selectedStarter.name} Loaf` : 'Country Sourdough',
      status: 'active',
      currentStage: 'autolyse',
      starterId: starterInputMode === 'diary' ? selectedStarter?.id : undefined,
      starterName: starterInputMode === 'diary' ? selectedStarter?.name : undefined,
      totalFlour,
      hydration,
      saltPct,
      starterPct: Math.round((computedTotalStarter / (totalFlour * loaves)) * 100),
      starterFlour: computedStarterFlour,
      starterWater: computedStarterWater,
      loaves,
      flourBlend,
      roomTemp: 23,
      foldsCompleted: 0,
      totalFolds: 4,
      timers: {
        autolyse: { targetEndTime: Date.now() + 1800 * 1000, durationSecs: 1800, remaining: 1800, running: true, done: false },
        foldInterval: { targetEndTime: null, durationSecs: 1800, remaining: 1800, running: false, done: false },
        bulkFerment: { targetEndTime: null, durationSecs: 28800, remaining: 28800, running: false, done: false },
        coldRetard: { targetEndTime: null, durationSecs: 43200, remaining: null, running: false, done: false },
        bakeLidOn: { targetEndTime: null, durationSecs: 1200, remaining: null, running: false, done: false },
        bakeLidOff: { targetEndTime: null, durationSecs: 1200, remaining: null, running: false, done: false },
      },
      timeline: [
        {
          id: `tl-${Date.now()}`,
          timestamp: Date.now(),
          timeStr: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          stageName: 'Setup',
          message: `Created recipe with ${hydration}% hydration and ${loaves} loaf`,
          type: 'start',
        },
      ],
    };

    onCreateBake(newSession);
  };

  return (
    <div className="space-y-5 max-w-lg mx-auto w-full pb-8 animate-fadeIn">
      {/* ================= SECTION 1: TARGET BANNETON SIZE ================= */}
      <div className="bg-card shadow-card border border-border-card rounded-[20px] p-[17px] space-y-4">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-terracotta/10 text-terracotta flex items-center justify-center font-serif text-xs font-bold">1</span>
          <h2 className="font-serif text-[17px] font-semibold text-ink">Target Banneton Size</h2>
        </div>

        {/* Banneton Size Chips */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { id: 'small' as const, label: 'Small', sub: '300g flour' },
            { id: 'medium' as const, label: 'Medium', sub: '400g flour' },
            { id: 'large' as const, label: 'Large', sub: '500g flour' },
            { id: 'custom' as const, label: 'Custom', sub: 'enter g' },
          ].map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => handleSelectSizePreset(chip.id)}
              className={`py-2 px-1 rounded-[11px] border text-center transition-all active:scale-95 flex flex-col items-center justify-center ${
                loafSizePreset === chip.id
                  ? 'bg-linen border-terracotta text-ink font-bold shadow-sm'
                  : 'bg-oat border-border-field text-muted hover:text-ink'
              }`}
            >
              <span className="font-sans text-xs">{chip.label}</span>
              <span className="font-sans text-[9px] text-faint">{chip.sub}</span>
            </button>
          ))}
        </div>

        {/* Conditional Total Flour Field (Only visible when Custom is active) */}
        {loafSizePreset === 'custom' && (
          <div className="space-y-1.5 pt-1 animate-fadeIn">
            <label className="font-sans text-[10px] text-faint uppercase font-semibold tracking-wider block">
              Custom Total Flour (g)
            </label>
            <div className="relative">
              <input
                type="number"
                value={totalFlour}
                onChange={(e) => setTotalFlour(Math.max(0, Number(e.target.value) || 0))}
                className="w-full bg-oat border border-border-field rounded-[11px] px-3 py-2 font-mono text-[17px] font-bold text-ink focus:outline-none focus:ring-2 focus:ring-terracotta/20 text-right pr-10"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 font-sans text-xs text-muted">g</span>
            </div>
          </div>
        )}

        <div className="h-px bg-border-leader/40 w-full" />

        {/* Single Unified Row: Loaves, Hydration & Salt */}
        <div className="grid grid-cols-3 gap-3 pt-1">
          {/* Loaves */}
          <div className="space-y-1.5">
            <label className="font-sans text-[10px] text-faint uppercase font-semibold tracking-wider block text-center">
              Loaves
            </label>
            <div className="flex items-center bg-oat border border-border-field rounded-[11px] px-1.5 py-1.5">
              <button
                onClick={() => setLoaves((prev) => Math.max(1, prev - 1))}
                className="w-6 h-6 flex items-center justify-center font-bold text-muted hover:text-ink"
              >
                -
              </button>
              <span className="flex-1 text-center font-mono font-bold text-[16px] text-ink">{loaves}</span>
              <button
                onClick={() => setLoaves((prev) => prev + 1)}
                className="w-6 h-6 flex items-center justify-center font-bold text-muted hover:text-ink"
              >
                +
              </button>
            </div>
          </div>

          {/* Hydration */}
          <div className="space-y-1.5">
            <label className="font-sans text-[10px] text-faint uppercase font-semibold tracking-wider flex items-center justify-center gap-1">
              <Droplets className="w-3 h-3 text-terracotta" /> Hydration
            </label>
            <div className="relative">
              <input
                type="number"
                value={hydration}
                onChange={(e) => setHydration(Number(e.target.value) || 0)}
                className="w-full bg-oat border border-border-field rounded-[11px] px-2 py-2 font-mono font-bold text-[16px] text-ink focus:outline-none text-center pr-5"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 font-mono text-xs text-muted">%</span>
            </div>
          </div>

          {/* Salt */}
          <div className="space-y-1.5">
            <label className="font-sans text-[10px] text-faint uppercase font-semibold tracking-wider flex items-center justify-center gap-1">
              <Sparkles className="w-3 h-3 text-terracotta" /> Salt
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                value={saltPct}
                onChange={(e) => setSaltPct(Number(e.target.value) || 0)}
                className="w-full bg-oat border border-border-field rounded-[11px] px-2 py-2 font-mono font-bold text-[16px] text-ink focus:outline-none text-center pr-5"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 font-mono text-xs text-muted">%</span>
            </div>
          </div>
        </div>
      </div>

      {/* ================= SECTION 2: STARTER INPUT ================= */}
      <div className="bg-card shadow-card border border-border-card rounded-[20px] p-[17px] space-y-4">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-terracotta/10 text-terracotta flex items-center justify-center font-serif text-xs font-bold">2</span>
          <h2 className="font-serif text-[17px] font-semibold text-ink">Starter Input</h2>
        </div>

        {/* 3 Input Mode Tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-oat border border-border-field rounded-xl">
          {[
            { id: 'diary' as const, label: 'From Diary' },
            { id: 'grams' as const, label: 'Total Starter' },
            { id: 'manual' as const, label: 'Flour & Water' },
          ].map((mode) => (
            <button
              key={mode.id}
              type="button"
              onClick={() => {
                if (!user && mode.id === 'diary') {
                  onOpenAuth();
                  return;
                }
                setStarterInputMode(mode.id);
              }}
              className={`py-2 px-1 rounded-lg text-center font-sans text-xs transition-all active:scale-95 ${
                starterInputMode === mode.id
                  ? 'bg-card text-ink font-bold shadow-sm border border-border-card'
                  : 'text-muted hover:text-ink'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>

        {/* MODE A: PULL FROM DIARY */}
        {starterInputMode === 'diary' && (
          <div className="space-y-3">
            {!user ? (
              <div
                onClick={onOpenAuth}
                className="bg-linen border border-dashed border-border-field rounded-[11px] p-2.5 flex items-start gap-2 cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5 text-terracotta flex-shrink-0 mt-0.5" />
                <p className="text-muted font-sans text-[12px] leading-tight">
                  <span className="font-bold text-ink">Starter Diary sync is a member feature.</span> Sign in to choose your saved starters.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="font-sans text-[10px] text-faint uppercase font-semibold tracking-wider block">
                    Choose Saved Starter
                  </label>
                  <div className="relative">
                    <select
                      value={selectedStarterId}
                      onChange={(e) => setSelectedStarterId(e.target.value)}
                      className="w-full appearance-none bg-oat border border-border-field rounded-[11px] px-3 py-2.5 font-sans font-medium text-xs text-ink focus:outline-none focus:ring-2 focus:ring-terracotta/20 pr-8"
                    >
                      {starters.map((s) => (
                        <option key={s.id} value={s.id}>
                          🫙 {s.name} — {s.hydration}% Hydration ({s.status === 'active_peak' ? 'Active & Peak' : 'Hungry'})
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-faint absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {selectedStarter && (
                  <div className="bg-linen rounded-xl p-3.5 border border-border-card space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-serif font-bold text-ink text-base">{selectedStarter.name}</h4>
                        <p className="font-sans text-xs text-muted">{selectedStarter.hydration}% Hydration · {selectedStarter.flourType}</p>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full font-sans text-[10px] uppercase font-bold tracking-wider border ${
                        selectedStarter.status === 'active_peak'
                          ? 'bg-terracotta/10 text-terracotta border-terracotta/20'
                          : 'bg-warning/10 text-warning border-warning/20'
                      }`}>
                        {selectedStarter.status === 'active_peak' ? 'Active & Peak' : 'Hungry'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-t border-dashed border-border-leader/50 pt-2.5">
                      <span className="font-sans text-xs text-muted font-medium">Starter amount to use:</span>
                      <div className="relative w-28">
                        <input
                          type="number"
                          value={starterTotalGrams}
                          onChange={(e) => setStarterTotalGrams(Math.max(0, Number(e.target.value) || 0))}
                          className="w-full bg-oat border border-border-field rounded-lg px-2 py-1 font-mono font-bold text-sm text-ink text-right pr-6 focus:outline-none"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 font-sans text-xs text-muted">g</span>
                      </div>
                    </div>

                    <div className="bg-card/70 px-3 py-1.5 rounded-lg text-center font-sans text-[11px] text-terracotta font-semibold">
                      ✓ Using {selectedStarter.name} ({starterTotalGrams}g total starter)
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* MODE B: TOTAL STARTER WEIGHT */}
        {starterInputMode === 'grams' && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="font-sans text-[10px] text-faint uppercase font-semibold tracking-wider block">
                Total Starter / Levain to Use (g)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={starterTotalGrams}
                  onChange={(e) => setStarterTotalGrams(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full bg-oat border border-border-field rounded-[11px] px-3 py-2 font-mono text-[16px] font-bold text-ink focus:outline-none text-right pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 font-sans text-xs text-muted">g</span>
              </div>
            </div>
            <p className="font-serif italic text-xs text-muted">
              Assumes standard 100% hydration starter (50% flour / 50% water).
            </p>
          </div>
        )}

        {/* MODE C: MANUAL STARTER FLOUR & WATER */}
        {starterInputMode === 'manual' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="font-sans text-[10px] text-faint uppercase font-semibold tracking-wider block">
                  Starter Flour (g)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={manualStarterFlour}
                    onChange={(e) => setManualStarterFlour(Math.max(0, Number(e.target.value) || 0))}
                    className="w-full bg-oat border border-border-field rounded-[11px] px-3 py-2 font-mono text-[16px] font-bold text-ink focus:outline-none text-right pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 font-sans text-xs text-muted">g</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-sans text-[10px] text-faint uppercase font-semibold tracking-wider block">
                  Starter Water (g)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={manualStarterWater}
                    onChange={(e) => setManualStarterWater(Math.max(0, Number(e.target.value) || 0))}
                    className="w-full bg-oat border border-border-field rounded-[11px] px-3 py-2 font-mono text-[16px] font-bold text-ink focus:outline-none text-right pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 font-sans text-xs text-muted">g</span>
                </div>
              </div>
            </div>
            <p className="font-serif italic text-xs text-muted">
              Total starter: {manualStarterFlour + manualStarterWater}g ({Math.round((manualStarterWater / (manualStarterFlour || 1)) * 100)}% hydration).
            </p>
          </div>
        )}
      </div>

      {/* ================= SECTION 3: FLOUR BLEND BUILDER ================= */}
      <div className="space-y-3">
        <div className="flex justify-between items-center px-1">
          <h2 className="font-serif italic text-xs uppercase tracking-[0.22em] text-ink">Flour Blend</h2>
          {totalBlendPct !== 100 && (
            <span className="font-sans text-[10px] text-warning bg-warning/10 px-2 py-0.5 rounded-full font-bold">
              Total: {totalBlendPct}%
            </span>
          )}
        </div>

        <div className="bg-card rounded-[20px] shadow-sm border border-border-card p-4 space-y-3">
          {flourBlend.map((item) => (
            <div key={item.id} className="flex items-center gap-3">
              <input
                type="text"
                value={item.name}
                onChange={(e) => handleUpdateFlour(item.id, 'name', e.target.value)}
                className="flex-1 bg-oat border border-border-field rounded-lg px-3 py-2 font-serif text-sm text-ink focus:outline-none"
              />
              <div className="w-24 relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={item.percentage}
                  onChange={(e) => handleUpdateFlour(item.id, 'percentage', e.target.value)}
                  className="w-full bg-oat border border-border-field rounded-[11px] px-2 py-2 font-mono font-bold text-sm text-ink text-center pr-6 focus:outline-none"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 font-mono text-xs text-muted">%</span>
              </div>
              <button
                onClick={() => handleRemoveFlour(item.id)}
                disabled={flourBlend.length <= 1}
                className="text-disabled hover:text-danger p-1 disabled:opacity-30"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}

          <button
            onClick={handleAddFlour}
            className="w-full py-2 bg-oat border border-dashed border-border-field rounded-xl font-sans text-xs font-bold text-terracotta uppercase tracking-wider flex items-center justify-center gap-1 hover:bg-linen"
          >
            <Plus className="w-3.5 h-3.5" /> Add Flour Type
          </button>
        </div>
      </div>

      {/* ================= SECTION 4: LIVE FORMULA TABLE ================= */}
      <div className="space-y-3 pt-1">
        <div className="flex justify-between items-center px-1">
          <h2 className="font-serif italic text-xs uppercase tracking-[0.22em] text-ink">Live Formula Breakdown</h2>
          {loaves > 1 && <span className="font-mono text-xs text-terracotta font-semibold">× {loaves} Loaves</span>}
        </div>

        <div className="bg-card rounded-[20px] shadow-card border border-border-card overflow-hidden">
          <div className="p-[17px] space-y-3">
            {itemizedFlourRows.map((row) => (
              <div key={row.id} className="flex items-baseline w-full">
                <span className="font-serif text-[15px] text-ink whitespace-nowrap">{row.name}</span>
                <div className="flex-1 border-b-[1.5px] border-dotted border-border-leader mx-2 relative top-[-4px]" />
                <div className="flex items-baseline gap-2 text-right min-w-[85px]">
                  <span className="font-sans text-[15px] font-bold text-ink">{row.weightGrams}<span className="text-faint text-[10px] ml-0.5">g</span></span>
                  <span className="font-mono text-[12px] text-muted w-10">{row.bakersPercentage}%</span>
                </div>
              </div>
            ))}

            <div className="flex items-baseline w-full">
              <span className="font-serif text-[15px] text-ink whitespace-nowrap">Starter Flour</span>
              <div className="flex-1 border-b-[1.5px] border-dotted border-border-leader mx-2 relative top-[-4px]" />
              <div className="flex items-baseline gap-2 text-right min-w-[85px]">
                <span className="font-sans text-[15px] font-bold text-ink">{computedStarterFlour}<span className="text-faint text-[10px] ml-0.5">g</span></span>
                <span className="font-mono text-[12px] text-muted w-10">{totalFlour > 0 ? Math.round((computedStarterFlour / (totalFlour * loaves)) * 1000) / 10 : 0}%</span>
              </div>
            </div>

            <div className="flex items-baseline w-full">
              <span className="font-serif text-[15px] text-ink whitespace-nowrap">Main Water</span>
              <div className="flex-1 border-b-[1.5px] border-dotted border-border-leader mx-2 relative top-[-4px]" />
              <div className="flex items-baseline gap-2 text-right min-w-[85px]">
                <span className="font-sans text-[15px] font-bold text-ink">{mainWaterGrams}<span className="text-faint text-[10px] ml-0.5">g</span></span>
                <span className="font-mono text-[12px] text-muted w-10">{totalFlour > 0 ? Math.round((mainWaterGrams / (totalFlour * loaves)) * 1000) / 10 : 0}%</span>
              </div>
            </div>

            <div className="flex items-baseline w-full">
              <span className="font-serif text-[15px] text-ink whitespace-nowrap">Starter Water</span>
              <div className="flex-1 border-b-[1.5px] border-dotted border-border-leader mx-2 relative top-[-4px]" />
              <div className="flex items-baseline gap-2 text-right min-w-[85px]">
                <span className="font-sans text-[15px] font-bold text-ink">{computedStarterWater}<span className="text-faint text-[10px] ml-0.5">g</span></span>
                <span className="font-mono text-[12px] text-muted w-10">{totalFlour > 0 ? Math.round((computedStarterWater / (totalFlour * loaves)) * 1000) / 10 : 0}%</span>
              </div>
            </div>

            <div className="flex items-baseline w-full">
              <span className="font-serif text-[15px] text-ink whitespace-nowrap">Salt</span>
              <div className="flex-1 border-b-[1.5px] border-dotted border-border-leader mx-2 relative top-[-4px]" />
              <div className="flex items-baseline gap-2 text-right min-w-[85px]">
                <span className="font-sans text-[15px] font-bold text-ink">{totalSaltGrams}<span className="text-faint text-[10px] ml-0.5">g</span></span>
                <span className="font-mono text-[12px] text-muted w-10">{saltPct}%</span>
              </div>
            </div>
          </div>

          <div className="bg-terracotta px-[17px] py-3.5 flex justify-between items-center text-onDark">
            <span className="font-serif italic text-[15px] text-onDark">Total dough</span>
            <div className="flex items-baseline gap-3">
              <span className="font-sans text-[17px] font-extrabold text-onDark">{totalDoughWeight} g</span>
              <span className="font-mono text-[13px] text-onDark/85">{totalDoughPercentage} %</span>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Action Button */}
      <div className="pt-2 pb-6">
        <button
          onClick={handleCreateSession}
          className="w-full bg-terracotta hover:bg-primary text-white rounded-[16px] py-3.5 px-5 flex items-center justify-center gap-2 shadow-btnTerracotta active:scale-98 transition-all font-sans font-semibold text-[15px]"
        >
          <span>Create Bake Session</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
