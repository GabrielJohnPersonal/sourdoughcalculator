import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Plus,
  Flame,
  Utensils,
  Lock,
  X,
  ShieldCheck,
  History,
  ChevronRight,
  ChevronDown,
  Trash2,
  Pencil,
  Check,
} from 'lucide-react';
import { StarterProfile, UserProfile, StarterFeedEntry } from '../../types';
import { getRelativeTime } from '../../utils/formatters';
import { FLOUR_TYPES, OTHER_FLOUR } from '../../data/flourTypes';
import { NumField } from '../common/NumField';

// `dateCreated` is stored as a plain 'YYYY-MM-DD' string. Building the Date from
// its y/m/d parts (rather than `new Date(isoString)`, which parses as UTC
// midnight) keeps the displayed day from shifting in negative-UTC timezones.
const formatDateStarted = (iso: string): string => {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

interface StarterDiaryViewProps {
  user: UserProfile | null;
  starters: StarterProfile[];
  onAddStarter: (starter: StarterProfile) => void;
  onUpdateStarter: (starter: StarterProfile) => void;
  onDeleteStarter: (starterId: string) => void;
  onLogFeed: (starterId: string, entry: StarterFeedEntry) => void;
  onDeleteFeed: (starterId: string, feedId: string) => void;
  onOpenAuth: () => void;
}

/** A <select> of common flour types plus a free-text fallback for anything else. */
const FlourTypeField: React.FC<{
  value: string;
  onChange: (v: string) => void;
  label: string;
}> = ({ value, onChange, label }) => {
  const isKnown = FLOUR_TYPES.includes(value);
  return (
    <div>
      <label className="text-[11px] text-faint uppercase font-bold font-sans block mb-1">
        {label}
      </label>
      <div className="relative">
        <select
          value={isKnown ? value : OTHER_FLOUR}
          onChange={(e) => onChange(e.target.value === OTHER_FLOUR ? '' : e.target.value)}
          className="w-full appearance-none bg-oat border border-border-field rounded-[11px] p-2.5 pr-8 text-xs font-sans text-ink focus:outline-none"
        >
          {FLOUR_TYPES.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
          <option value={OTHER_FLOUR}>Other…</option>
        </select>
        <ChevronDown className="w-3.5 h-3.5 text-faint absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>
      {!isKnown && (
        <input
          type="text"
          autoFocus
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Flour type"
          className="w-full mt-1.5 bg-oat border border-border-field rounded-[11px] p-2.5 text-xs font-sans text-ink focus:outline-none"
        />
      )}
    </div>
  );
};

export const StarterDiaryView: React.FC<StarterDiaryViewProps> = ({
  user,
  starters,
  onAddStarter,
  onUpdateStarter,
  onDeleteStarter,
  onLogFeed,
  onDeleteFeed,
  onOpenAuth,
}) => {
  const [selectedStarterForFeed, setSelectedStarterForFeed] = useState<StarterProfile | null>(null);
  const [selectedStarterForHistory, setSelectedStarterForHistory] = useState<StarterProfile | null>(null);
  const [isAddStarterOpen, setIsAddStarterOpen] = useState(false);
  // Delete lives inside the Feeding Journal modal now — this confirms there, not
  // on the card in the list.
  const [confirmDeleteInModal, setConfirmDeleteInModal] = useState(false);

  // ---- Create Starter: flour + water only. No seed, no typed hydration — a new
  // culture is just flour and water; the ratio between them is all that matters. ----
  const [newStarterName, setNewStarterName] = useState('');
  const [newStarterFlourType, setNewStarterFlourType] = useState(FLOUR_TYPES[0]);
  const [newStarterFlourGrams, setNewStarterFlourGrams] = useState(50);
  const [newRatioFlour, setNewRatioFlour] = useState(1);
  const [newRatioWater, setNewRatioWater] = useState(1);
  const newStarterWaterGrams =
    newRatioFlour > 0 ? Math.round(newStarterFlourGrams * (newRatioWater / newRatioFlour)) : 0;

  // ---- Editing an existing starter's name / flour type, from the pencil in the
  // Feeding Journal modal. ----
  const [isEditingStarter, setIsEditingStarter] = useState(false);
  const [editName, setEditName] = useState('');
  const [editFlourType, setEditFlourType] = useState('');

  // ---- Log Feed modal: seed:flour:water is a real three-part ratio you set, not a
  // percentage. The three part-inputs are always editable — the preset buttons are
  // just quick-fills for them, so an odd ratio like 1:10:10 is one tap plus an edit
  // away rather than unreachable. ----
  const [feedMode, setFeedMode] = useState<'ratio' | 'manual'>('ratio');
  const [feedRatioSeed, setFeedRatioSeed] = useState(1);
  const [feedRatioFlour, setFeedRatioFlour] = useState(2);
  const [feedRatioWater, setFeedRatioWater] = useState(2);

  const [seedGrams, setSeedGrams] = useState(25);
  const [flourGrams, setFlourGrams] = useState(50);
  const [waterGrams, setWaterGrams] = useState(50);
  const [feedFlourType, setFeedFlourType] = useState(FLOUR_TYPES[0]);
  const [feedNotes, setFeedNotes] = useState('');

  const FEED_RATIO_PRESETS: [number, number, number][] = [
    [1, 1, 1],
    [1, 2, 2],
    [1, 3, 3],
    [1, 5, 5],
    [1, 10, 10],
  ];

  const applyFeedRatio = (s: number, f: number, w: number) => {
    setFeedRatioSeed(s);
    setFeedRatioFlour(f);
    setFeedRatioWater(w);
    if (f > 0) {
      setSeedGrams(Math.round(flourGrams * (s / f)));
      setWaterGrams(Math.round(flourGrams * (w / f)));
    }
  };

  // In ratio mode, any of the three gram fields can be the one you actually know
  // — "I want to use 50g of seed" is just as common as "I have 100g of flour" —
  // so editing any one recomputes the other two from the current ratio parts.
  const handleGramsChangeInRatioMode = (field: 'seed' | 'flour' | 'water', newVal: number) => {
    if (field === 'seed') {
      setSeedGrams(newVal);
      if (feedRatioSeed > 0) {
        setFlourGrams(Math.round(newVal * (feedRatioFlour / feedRatioSeed)));
        setWaterGrams(Math.round(newVal * (feedRatioWater / feedRatioSeed)));
      }
    } else if (field === 'flour') {
      setFlourGrams(newVal);
      if (feedRatioFlour > 0) {
        setSeedGrams(Math.round(newVal * (feedRatioSeed / feedRatioFlour)));
        setWaterGrams(Math.round(newVal * (feedRatioWater / feedRatioFlour)));
      }
    } else {
      setWaterGrams(newVal);
      if (feedRatioWater > 0) {
        setSeedGrams(Math.round(newVal * (feedRatioSeed / feedRatioWater)));
        setFlourGrams(Math.round(newVal * (feedRatioFlour / feedRatioWater)));
      }
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
    setFeedFlourType(starter.flourType || FLOUR_TYPES[0]);
    setFeedMode('ratio');
    const flour = 50;
    setFlourGrams(flour);
    applyFeedRatio(1, 2, 2);
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
    const derivedHydration = flourGrams > 0 ? Math.round((waterGrams / flourGrams) * 100) : selectedStarterForFeed.hydration;

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
      notes: feedNotes.trim() || undefined,
    };

    onLogFeed(selectedStarterForFeed.id, newEntry);

    // If currently viewing history of this starter, update view
    if (selectedStarterForHistory?.id === selectedStarterForFeed.id) {
      setSelectedStarterForHistory({
        ...selectedStarterForHistory,
        lastFedTimestamp: Date.now(),
        lastRatio: ratioStr,
        hydration: derivedHydration,
        status: 'active_peak',
        feedHistory: [newEntry, ...selectedStarterForHistory.feedHistory],
      });
    }

    setSelectedStarterForFeed(null);
    setFeedNotes('');
  };

  const handleCreateStarter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStarterName.trim() || !newStarterFlourType.trim()) return;

    const ratioStr = `${newRatioFlour}:${newRatioWater}`;
    const hyd = newRatioFlour > 0 ? Math.round((newRatioWater / newRatioFlour) * 100) : 100;

    const newProfile: StarterProfile = {
      id: `starter-${Date.now()}`,
      name: newStarterName.trim(),
      flourType: newStarterFlourType.trim(),
      hydration: hyd,
      dateCreated: new Date().toISOString().split('T')[0],
      status: 'active_peak',
      lastFedTimestamp: Date.now(),
      lastRatio: ratioStr,
      peakTargetTimestamp: Date.now() + 4.5 * 3600 * 1000,
      feedHistory: [
        {
          id: `feed-init-${Date.now()}`,
          timestamp: Date.now(),
          dateStr: 'Today',
          timeStr: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          seedGrams: 0,
          flourGrams: newStarterFlourGrams,
          flourType: newStarterFlourType.trim(),
          waterGrams: newStarterWaterGrams,
          ratio: ratioStr,
          notes: 'Starter created — flour and water only, no seed culture yet.',
        },
      ],
    };

    onAddStarter(newProfile);
    setIsAddStarterOpen(false);
    setNewStarterName('');
    setNewStarterFlourType(FLOUR_TYPES[0]);
    setNewStarterFlourGrams(50);
    setNewRatioFlour(1);
    setNewRatioWater(1);
  };

  const openEditStarter = (starter: StarterProfile) => {
    setEditName(starter.name);
    setEditFlourType(starter.flourType);
    setIsEditingStarter(true);
  };

  const handleSaveStarterEdit = () => {
    if (!selectedStarterForHistory || !editName.trim() || !editFlourType.trim()) return;
    const updated: StarterProfile = {
      ...selectedStarterForHistory,
      name: editName.trim(),
      flourType: editFlourType.trim(),
    };
    onUpdateStarter(updated);
    setSelectedStarterForHistory(updated);
    setIsEditingStarter(false);
  };

  const handleDeleteFeed = (feedId: string) => {
    if (!selectedStarterForHistory) return;
    onDeleteFeed(selectedStarterForHistory.id, feedId);
    setSelectedStarterForHistory({
      ...selectedStarterForHistory,
      feedHistory: selectedStarterForHistory.feedHistory.filter((f) => f.id !== feedId),
    });
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

        {starters.length > 0 && (
          <button
            onClick={() => handleOpenFeedModal(starters[0])}
            className="bg-ink text-onDark shadow-btnInk rounded-[16px] px-4 py-2.5 flex items-center gap-1.5 font-sans text-xs uppercase font-bold tracking-widest transition-transform active:scale-95 hover:opacity-90"
          >
            <span>Log Feed</span>
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Active Starters List */}
      <section className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <h2 className="font-sans text-sm font-bold text-ink">My Starters</h2>
          <span className="font-sans text-[12px] text-faint">Tap card for history</span>
        </div>

        {starters.length === 0 && (
          <div className="bg-card rounded-[20px] border border-dashed border-border-field p-6 text-center space-y-2">
            <p className="font-serif text-sm text-ink">No starters yet.</p>
            <p className="font-sans text-xs text-muted">Tap "New Starter" above to begin your first culture.</p>
          </div>
        )}

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

          return (
            <div
              key={starter.id}
              onClick={() => setSelectedStarterForHistory(starter)}
              className="bg-card rounded-[20px] p-[17px] shadow-[0_2px_12px_rgba(51,48,42,0.06),inset_0_1px_0_rgba(255,255,255,0.8)] border border-border-card relative overflow-hidden flex flex-col gap-3.5 cursor-pointer hover:border-terracotta/40 transition-all active:scale-[0.99] group"
            >
              {/* Name + Feed. Edit and delete now live inside the Feeding Journal
                  modal (tap the card to open it), not out here on the list. */}
              <div className="flex justify-between items-start gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif text-[23px] font-semibold text-ink group-hover:text-terracotta transition-colors truncate">
                      {starter.name}
                    </h3>
                    <ChevronRight className="w-4 h-4 text-faint group-hover:text-terracotta transition-colors flex-shrink-0" />
                  </div>
                  <p className="font-sans text-xs text-muted mt-0.5">{starter.flourType}</p>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenFeedModal(starter);
                  }}
                  className="bg-ink text-onDark shadow-btnInk rounded-[11px] pl-2.5 pr-3 py-1.5 flex items-center gap-1 font-sans text-xs font-bold active:scale-95 hover:opacity-90 transition-all flex-shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" /> Feed
                </button>
              </div>

              {/* Feed Metrics */}
              <div className="border-t border-dashed border-border-card pt-3 flex justify-between">
                <div className="flex flex-col">
                  <span className="font-sans text-[11px] text-faint uppercase font-bold tracking-wider mb-0.5">
                    Last Fed
                  </span>
                  <span className="font-sans text-sm font-bold text-ink">{relativeFed}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="font-sans text-[11px] text-faint uppercase font-bold tracking-wider mb-0.5">
                    Last Ratio
                  </span>
                  <span className="font-mono text-sm font-bold text-ink">
                    {starter.lastRatio || '1:2:2'}
                  </span>
                </div>
              </div>

              {/* Bottom bar: honest readiness + status pill */}
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="bg-oat border border-border-field rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${pastPeak ? 'bg-warning' : 'bg-terracotta'}`}
                      style={{ width: `${(feedProgress ?? 0) * 100}%` }}
                    />
                  </div>
                  <span className="font-sans text-[11px] text-faint mt-1 block">
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
                  <span className="font-sans text-[11px] uppercase font-bold tracking-wider">
                    {isPeak ? 'Active & Peak' : 'Hungry'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* ================= STARTER FEEDING HISTORY MODAL =================
          Portalled to document.body — see the note on the create-starter modal
          below for why: the view root's `animate-fadeIn` leaves a stray transform
          behind, which breaks `position: fixed` for anything nested inside it. */}
      {selectedStarterForHistory && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-card max-w-md w-full max-h-[85vh] rounded-[24px] border border-border-card shadow-2xl flex flex-col overflow-hidden animate-scaleUp">
            {/* Modal Header — badge/count on the left, edit + delete + close all
                together on the top line, on the right. */}
            <div className="p-5 bg-card border-b border-border-card space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="font-serif italic text-xs uppercase text-terracotta">Feeding Journal</span>
                  <span className="bg-linen px-2 py-0.5 rounded-full font-mono text-[11px] text-ink font-semibold">
                    {selectedStarterForHistory.feedHistory?.length || 0} Feeds
                  </span>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => openEditStarter(selectedStarterForHistory)}
                    className="text-muted hover:text-terracotta p-1.5 rounded-full hover:bg-oat transition-colors"
                    title="Edit starter"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setConfirmDeleteInModal(true)}
                    className="text-disabled hover:text-danger p-1.5 rounded-full hover:bg-oat transition-colors"
                    title="Delete starter"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedStarterForHistory(null);
                      setIsEditingStarter(false);
                      setConfirmDeleteInModal(false);
                    }}
                    className="text-muted hover:text-ink p-1.5 rounded-full hover:bg-oat transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {confirmDeleteInModal ? (
                <div className="flex items-center justify-between gap-2 bg-danger/5 border border-danger/20 rounded-xl px-3 py-2">
                  <span className="font-sans text-xs text-ink font-semibold">
                    Delete {selectedStarterForHistory.name}? This can't be undone.
                  </span>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteInModal(false)}
                      className="font-sans text-xs text-muted hover:text-ink px-2 py-1"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onDeleteStarter(selectedStarterForHistory.id);
                        setConfirmDeleteInModal(false);
                        setSelectedStarterForHistory(null);
                      }}
                      className="font-sans text-xs font-semibold text-white bg-danger hover:opacity-90 rounded-lg px-3 py-1 active:scale-98 transition-all"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ) : isEditingStarter ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    autoFocus
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-oat border border-border-field rounded-[11px] p-2 font-serif text-base font-bold text-ink focus:outline-none"
                  />
                  <FlourTypeField value={editFlourType} onChange={setEditFlourType} label="Flour Type" />
                  <div className="flex gap-2 justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => setIsEditingStarter(false)}
                      className="font-sans text-xs text-muted hover:text-ink px-2 py-1.5"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveStarterEdit}
                      className="flex items-center gap-1 font-sans text-xs font-semibold text-white bg-ink hover:opacity-90 rounded-lg px-3 py-1.5 active:scale-98 transition-all"
                    >
                      <Check className="w-3.5 h-3.5" /> Save
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <h3 className="font-serif text-2xl font-bold text-ink truncate">
                    {selectedStarterForHistory.name}
                  </h3>
                  <p className="font-sans text-xs text-faint mt-0.5">
                    Started {formatDateStarted(selectedStarterForHistory.dateCreated)}
                  </p>
                  <p className="font-sans text-xs text-muted">{selectedStarterForHistory.flourType}</p>
                </div>
              )}
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
                        <span className="font-sans text-[12px] text-faint">({feed.timeStr})</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="bg-linen border border-border-card text-terracotta font-mono font-bold text-xs px-2.5 py-0.5 rounded-full">
                          {feed.ratio}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteFeed(feed.id)}
                          className="text-disabled hover:text-danger p-0.5 transition-colors"
                          title="Delete entry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center bg-card p-2 rounded-lg border border-border-card/60">
                      <div>
                        <span className="text-[11px] text-faint uppercase font-bold block">Seed</span>
                        <span className="font-mono text-xs font-bold text-ink">{feed.seedGrams}g</span>
                      </div>
                      <div>
                        <span className="text-[11px] text-faint uppercase font-bold block">Flour</span>
                        <span className="font-mono text-xs font-bold text-ink">{feed.flourGrams}g</span>
                      </div>
                      <div>
                        <span className="text-[11px] text-faint uppercase font-bold block">Water</span>
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
                  setIsEditingStarter(false);
                  handleOpenFeedModal(target);
                }}
                className="w-full bg-terracotta hover:bg-primary text-white py-3 rounded-[16px] font-sans font-semibold text-xs shadow-btnTerracotta active:scale-98 transition-all flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Log New Feed for {selectedStarterForHistory.name}</span>
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}

      {/* ================= LOG FEED & DUAL LEVAIN CALCULATOR MODAL ================= */}
      {selectedStarterForFeed && createPortal(
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
              {/* Ratio Mode — seed:flour:water is a real ratio you set. Presets are
                  quick-fills for the three boxes below; type any numbers directly
                  for anything a preset doesn't cover, like 1:10:10. */}
              {feedMode === 'ratio' && (
                <div className="space-y-2">
                  <label className="text-[11px] text-faint uppercase font-bold font-sans block">
                    Seed : Flour : Water
                  </label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {FEED_RATIO_PRESETS.map(([s, f, w]) => {
                      const active = feedRatioSeed === s && feedRatioFlour === f && feedRatioWater === w;
                      return (
                        <button
                          key={`${s}:${f}:${w}`}
                          type="button"
                          onClick={() => applyFeedRatio(s, f, w)}
                          className={`py-1.5 rounded-lg font-mono text-[11px] font-bold border transition-all ${
                            active
                              ? 'bg-linen border-terracotta text-terracotta shadow-sm'
                              : 'bg-oat border-border-field text-muted hover:text-ink'
                          }`}
                        >
                          {s}:{f}:{w}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-1.5 justify-center pt-0.5">
                    <NumField
                      value={feedRatioSeed}
                      onChange={(n) => applyFeedRatio(n, feedRatioFlour, feedRatioWater)}
                      className="w-14 bg-oat border border-border-field rounded-lg p-1.5 text-center font-mono text-xs font-bold"
                    />
                    <span className="font-mono text-muted">:</span>
                    <NumField
                      value={feedRatioFlour}
                      onChange={(n) => applyFeedRatio(feedRatioSeed, n, feedRatioWater)}
                      className="w-14 bg-oat border border-border-field rounded-lg p-1.5 text-center font-mono text-xs font-bold"
                    />
                    <span className="font-mono text-muted">:</span>
                    <NumField
                      value={feedRatioWater}
                      onChange={(n) => applyFeedRatio(feedRatioSeed, feedRatioFlour, n)}
                      className="w-14 bg-oat border border-border-field rounded-lg p-1.5 text-center font-mono text-xs font-bold"
                    />
                  </div>
                </div>
              )}

              {/* Feed Grams Grid */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] text-faint uppercase font-bold font-sans block mb-1">
                    Seed (g)
                  </label>
                  <NumField
                    value={seedGrams}
                    onChange={(n) =>
                      feedMode === 'ratio' ? handleGramsChangeInRatioMode('seed', n) : setSeedGrams(n)
                    }
                    className="w-full bg-oat border border-border-field rounded-[11px] p-2 text-center font-mono font-bold text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] text-faint uppercase font-bold font-sans block mb-1">
                    Flour (g)
                  </label>
                  <NumField
                    value={flourGrams}
                    onChange={(n) =>
                      feedMode === 'ratio' ? handleGramsChangeInRatioMode('flour', n) : setFlourGrams(n)
                    }
                    className="w-full bg-oat border border-border-field rounded-[11px] p-2 text-center font-mono font-bold text-xs focus:ring-2 focus:ring-terracotta/20"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] text-faint uppercase font-bold font-sans block mb-1">
                    Water (g)
                  </label>
                  <NumField
                    value={waterGrams}
                    onChange={(n) =>
                      feedMode === 'ratio' ? handleGramsChangeInRatioMode('water', n) : setWaterGrams(n)
                    }
                    className="w-full bg-oat border border-border-field rounded-[11px] p-2 text-center font-mono font-bold text-xs"
                    required
                  />
                </div>
              </div>

              {/* Live Build Summary */}
              <div className="bg-linen p-2.5 rounded-xl border border-border-card flex justify-between items-center text-xs">
                <span className="font-serif italic text-muted">Total Levain Build:</span>
                <span className="font-mono font-bold text-terracotta">{totalFeedBuild}g</span>
              </div>

              <FlourTypeField value={feedFlourType} onChange={setFeedFlourType} label="Flour Type" />

              <div>
                <label className="text-[11px] text-faint uppercase font-bold font-sans block mb-1">Notes / Aroma Observations</label>
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
        </div>,
        document.body,
      )}

      {/* ================= ADD NEW STARTER MODAL =================
          Portalled to document.body: the outer view wrapper above carries
          `animate-fadeIn`, whose keyframe ends on `transform: scale(1)`. With the
          animation `forwards`-filled, that transform never returns to `none`, so
          the wrapper permanently becomes the containing block for `position:
          fixed` descendants — this modal would anchor to that small content box
          instead of the viewport (off-screen, backdrop not covering the screen).
          Mounting at document.body sidesteps it entirely. */}
      {isAddStarterOpen && createPortal(
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
                <label className="text-[11px] text-faint uppercase font-bold font-sans">Starter Name</label>
                <input
                  type="text"
                  placeholder="e.g. Doughlene, Clint Yeastwood"
                  value={newStarterName}
                  onChange={(e) => setNewStarterName(e.target.value)}
                  className="w-full bg-oat border border-border-field rounded-[11px] p-2.5 text-xs font-serif text-ink focus:outline-none"
                  required
                />
              </div>

              <FlourTypeField value={newStarterFlourType} onChange={setNewStarterFlourType} label="Flour Type" />

              {/* First feed is just flour and water — no seed culture exists yet. */}
              <div>
                <label className="text-[11px] text-faint uppercase font-bold font-sans block mb-1">
                  Flour for First Feed (g)
                </label>
                <NumField
                  value={newStarterFlourGrams}
                  onChange={setNewStarterFlourGrams}
                  min={1}
                  className="w-full bg-oat border border-border-field rounded-[11px] p-2.5 text-xs font-mono font-bold text-ink focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] text-faint uppercase font-bold font-sans block mb-1">
                  Flour : Water Ratio
                </label>
                <div className="grid grid-cols-3 gap-1.5 mb-1.5">
                  {([[1, 1], [2, 3], [1, 2]] as [number, number][]).map(([f, w]) => {
                    const active = newRatioFlour === f && newRatioWater === w;
                    return (
                      <button
                        key={`${f}:${w}`}
                        type="button"
                        onClick={() => {
                          setNewRatioFlour(f);
                          setNewRatioWater(w);
                        }}
                        className={`py-1.5 rounded-lg font-mono text-xs font-bold border transition-all ${
                          active
                            ? 'bg-linen border-terracotta text-terracotta shadow-sm'
                            : 'bg-oat border-border-field text-muted hover:text-ink'
                        }`}
                      >
                        {f}:{w}
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center gap-1.5 justify-center">
                  <NumField
                    value={newRatioFlour}
                    onChange={setNewRatioFlour}
                    className="w-14 bg-oat border border-border-field rounded-lg p-1.5 text-center font-mono text-xs font-bold"
                  />
                  <span className="font-mono text-muted">:</span>
                  <NumField
                    value={newRatioWater}
                    onChange={setNewRatioWater}
                    className="w-14 bg-oat border border-border-field rounded-lg p-1.5 text-center font-mono text-xs font-bold"
                  />
                </div>
                <p className="font-serif italic text-[12px] text-muted mt-1.5 text-center">
                  → {newStarterFlourGrams}g flour + {newStarterWaterGrams}g water
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
        </div>,
        document.body,
      )}
    </div>
  );
};
