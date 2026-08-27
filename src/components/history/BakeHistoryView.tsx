import React, { useState, useMemo } from 'react';
import {
  Search,
  SlidersHorizontal,
  Star,
  Copy,
  Lock,
  ShieldCheck,
  X,
  Clock,
  ChevronRight,
  BookOpen,
  CheckCircle2,
} from 'lucide-react';
import { BakeSession, UserProfile } from '../../types';

interface BakeHistoryViewProps {
  user: UserProfile | null;
  history: BakeSession[];
  onCloneBake: (session: BakeSession) => void;
  onUpdateBake?: (updated: BakeSession) => void;
  onOpenAuth: () => void;
}

type SortOption = 'date_desc' | 'date_asc' | 'hydration_desc' | 'rating_desc' | 'flour_desc';

export const BakeHistoryView: React.FC<BakeHistoryViewProps> = ({
  user,
  history,
  onCloneBake,
  onUpdateBake,
  onOpenAuth,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('date_desc');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedBakeForJournal, setSelectedBakeForJournal] = useState<BakeSession | null>(null);

  // Journal edit state
  const [editRating, setEditRating] = useState<number>(5);
  const [editNotes, setEditNotes] = useState<string>('');

  // If unauthenticated guest, show the attractive Gated Lock Screen
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
              Unlock Your Cloud Bake History
            </h2>
            <p className="font-sans text-xs text-muted max-w-xs mx-auto leading-relaxed">
              Keep a permanent record of every loaf, crumb texture ratings, tasting notes, and clone previous successful formulas.
            </p>
          </div>

          <div className="bg-oat p-4 rounded-xl border border-border-field text-left space-y-2">
            <div className="flex items-center gap-2 text-ink font-sans text-xs font-semibold">
              <ShieldCheck className="w-4 h-4 text-terracotta" /> Never lose a successful formula
            </div>
            <div className="flex items-center gap-2 text-ink font-sans text-xs font-semibold">
              <ShieldCheck className="w-4 h-4 text-terracotta" /> Track crumb ratings & oven spring notes
            </div>
            <div className="flex items-center gap-2 text-ink font-sans text-xs font-semibold">
              <ShieldCheck className="w-4 h-4 text-terracotta" /> 1-tap clone past bakes into the calculator
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

  // Multi-factor search & sort
  const filteredHistory = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    let list = history.filter((b) => {
      if (!q) return true;
      const titleMatch = b.title.toLowerCase().includes(q);
      const dateMatch = b.date.toLowerCase().includes(q);
      const starterMatch = b.starterName ? b.starterName.toLowerCase().includes(q) : false;
      const flourMatch = b.flourBlend?.some((f) => f.name.toLowerCase().includes(q)) ?? false;
      const notesMatch = b.tastingNotes ? b.tastingNotes.toLowerCase().includes(q) : false;
      return titleMatch || dateMatch || starterMatch || flourMatch || notesMatch;
    });

    list = [...list].sort((a, b) => {
      if (sortBy === 'hydration_desc') return b.hydration - a.hydration;
      if (sortBy === 'rating_desc') return (b.crumbRating || 0) - (a.crumbRating || 0);
      if (sortBy === 'flour_desc') return b.totalFlour - a.totalFlour;
      if (sortBy === 'date_asc') return a.id - b.id;
      return b.id - a.id; // date_desc default
    });

    return list;
  }, [history, searchTerm, sortBy]);

  const handleOpenJournal = (bake: BakeSession) => {
    setSelectedBakeForJournal(bake);
    setEditRating(bake.crumbRating || 5);
    setEditNotes(bake.tastingNotes || '');
  };

  const handleSaveJournalNotes = () => {
    if (!selectedBakeForJournal) return;
    const updated: BakeSession = {
      ...selectedBakeForJournal,
      crumbRating: editRating,
      tastingNotes: editNotes,
    };
    if (onUpdateBake) {
      onUpdateBake(updated);
    }
    setSelectedBakeForJournal(updated);
  };

  return (
    <div className="space-y-5 max-w-lg mx-auto w-full pb-8 animate-fadeIn">
      {/* Search & Sort Bar */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by loaf, flour, starter, or notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-card border border-border-field rounded-[11px] pl-10 pr-4 py-2.5 font-sans text-xs text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-terracotta/20"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            onClick={() => setIsFilterOpen((prev) => !prev)}
            className={`w-10 h-10 rounded-[11px] border flex items-center justify-center transition-all ${
              isFilterOpen
                ? 'bg-linen border-terracotta text-terracotta shadow-sm'
                : 'bg-card border-border-field text-ink hover:bg-oat'
            }`}
            title="Sort and Filter Bakes"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>

        {/* Sort Controls Drawer */}
        {isFilterOpen && (
          <div className="bg-linen p-3 rounded-xl border border-border-card space-y-2 animate-fadeIn">
            <span className="font-sans text-[10px] text-faint uppercase font-bold tracking-wider block">
              Sort Bakes By
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: 'date_desc' as const, label: '🗓️ Newest First' },
                { id: 'date_asc' as const, label: '🗓️ Oldest First' },
                { id: 'hydration_desc' as const, label: '💧 Hydration (High)' },
                { id: 'rating_desc' as const, label: '⭐ Highest Rating' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setSortBy(opt.id)}
                  className={`py-1.5 px-2 rounded-lg font-sans text-xs text-left transition-all ${
                    sortBy === opt.id
                      ? 'bg-card border border-border-card text-ink font-bold shadow-sm'
                      : 'text-muted hover:text-ink'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* History Cards List */}
      <div className="space-y-4">
        {filteredHistory.length === 0 ? (
          <div className="py-12 text-center space-y-2 bg-card rounded-[20px] border border-border-card p-6">
            <BookOpen className="w-8 h-8 text-muted mx-auto" />
            <h3 className="font-serif text-base font-semibold text-ink">No bakes found</h3>
            <p className="font-sans text-xs text-muted">
              {searchTerm ? 'Try adjusting your search query.' : 'Complete your first bake to see it recorded here!'}
            </p>
          </div>
        ) : (
          filteredHistory.map((item) => (
            <div
              key={item.id}
              onClick={() => handleOpenJournal(item)}
              className="bg-card rounded-[20px] shadow-[0_2px_12px_rgba(51,48,42,0.06),inset_0_1px_0_rgba(255,255,255,0.8)] border border-border-card overflow-hidden cursor-pointer hover:border-terracotta/40 transition-all active:scale-[0.99] group"
            >
              <div className="p-[17px]">
                {/* Title & Star Rating */}
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-serif text-[18px] font-semibold text-ink group-hover:text-terracotta transition-colors">
                        {item.title}
                      </h3>
                      <ChevronRight className="w-4 h-4 text-faint group-hover:text-terracotta transition-colors" />
                    </div>
                    <p className="font-sans text-[10px] text-faint uppercase tracking-wider mt-0.5">
                      {item.date} {item.time ? `• ${item.time}` : ''}
                    </p>
                  </div>

                  {/* 5-star rating */}
                  <div className="flex gap-0.5 text-warning">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < (item.crumbRating || 5)
                            ? 'fill-warning text-warning'
                            : 'text-border-field'
                        }`}
                        strokeWidth={1.5}
                      />
                    ))}
                  </div>
                </div>

                {/* Formula Rows */}
                <div className="flex flex-col gap-2 mb-2">
                  <div className="flex justify-between items-baseline border-b border-dotted border-border-leader pb-1">
                    <span className="font-sans text-xs text-muted">Hydration</span>
                    <span className="font-mono text-xs font-bold text-olive">
                      {item.hydration}%
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline border-b border-dotted border-border-leader pb-1">
                    <span className="font-sans text-xs text-muted">Total Flour</span>
                    <span className="font-sans text-xs font-bold text-ink">
                      {item.totalFlour}g ({item.loaves || 1} {item.loaves === 1 ? 'loaf' : 'loaves'})
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline border-b border-dotted border-border-leader pb-1">
                    <span className="font-sans text-xs text-muted">Starter</span>
                    <span className="font-sans text-xs font-bold text-ink">
                      {item.starterPct}% {item.starterName ? `(${item.starterName})` : ''}
                    </span>
                  </div>
                </div>
              </div>

              {/* Notes & Clone Action Footer */}
              <div className="bg-oat px-[17px] py-3 flex justify-between items-center border-t border-border-card">
                <span className="font-serif italic text-xs text-muted line-clamp-1 flex-1 pr-2">
                  {item.tastingNotes ? `"${item.tastingNotes}"` : 'Tap to add loaf tasting notes & crumb rating...'}
                </span>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloneBake(item);
                  }}
                  className="flex items-center gap-1 font-sans text-xs font-semibold text-terracotta ml-2 whitespace-nowrap active:opacity-70 transition-opacity"
                >
                  <span>Clone</span>
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ================= DETAILED LOAF JOURNAL MODAL ================= */}
      {selectedBakeForJournal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-card max-w-md w-full max-h-[88vh] rounded-[24px] border border-border-card shadow-2xl flex flex-col overflow-hidden animate-scaleUp">
            {/* Modal Header */}
            <div className="p-5 bg-card border-b border-border-card flex justify-between items-start">
              <div>
                <span className="font-serif italic text-xs uppercase text-terracotta">Loaf Journal</span>
                <h3 className="font-serif text-2xl font-bold text-ink mt-0.5">
                  {selectedBakeForJournal.title}
                </h3>
                <p className="font-sans text-xs text-muted">
                  Baked on {selectedBakeForJournal.date} · {selectedBakeForJournal.loaves || 1} loaf
                </p>
              </div>

              <button
                onClick={() => setSelectedBakeForJournal(null)}
                className="text-muted hover:text-ink p-1 rounded-full hover:bg-oat transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Content */}
            <div className="p-5 overflow-y-auto space-y-5 flex-1">
              {/* Crumb & Sensory Rating Section */}
              <div className="bg-linen p-4 rounded-xl border border-border-card space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-sans text-xs font-bold text-ink uppercase tracking-wider">
                    Crumb & Bake Rating
                  </span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setEditRating(star)}
                        className="p-1 text-warning hover:scale-110 transition-transform"
                      >
                        <Star
                          className={`w-5 h-5 ${
                            star <= editRating ? 'fill-warning text-warning' : 'text-border-field'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-sans text-[11px] font-semibold text-muted block">
                    Tasting Notes, Crumb Openness & Crust
                  </label>
                  <textarea
                    rows={3}
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="e.g. Beautiful open custard crumb, crisp blistered crust, balanced mild tang..."
                    className="w-full bg-card border border-border-field rounded-xl p-3 font-serif text-xs text-ink focus:outline-none focus:ring-2 focus:ring-terracotta/20 leading-relaxed resize-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSaveJournalNotes}
                  className="w-full py-2 bg-card hover:bg-oat border border-border-card rounded-lg font-sans text-xs font-semibold text-ink flex items-center justify-center gap-1.5 active:scale-98 transition-all"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-olive" />
                  <span>Save Journal Notes</span>
                </button>
              </div>

              {/* Recipe Formula Breakdown */}
              <div className="space-y-2">
                <h4 className="font-serif italic text-xs uppercase tracking-wider text-muted">
                  Formula Breakdown
                </h4>
                <div className="bg-oat/70 p-3.5 rounded-xl border border-border-field space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted">Hydration</span>
                    <span className="font-mono font-bold text-olive">{selectedBakeForJournal.hydration}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Total Flour</span>
                    <span className="font-mono font-bold text-ink">{selectedBakeForJournal.totalFlour}g</span>
                  </div>
                  {selectedBakeForJournal.flourBlend?.map((f) => (
                    <div key={f.id} className="flex justify-between pl-3 text-[11px] text-faint">
                      <span>• {f.name} ({f.percentage}%)</span>
                      <span className="font-mono">{Math.round((selectedBakeForJournal.totalFlour * f.percentage) / 100)}g</span>
                    </div>
                  ))}
                  <div className="flex justify-between">
                    <span className="text-muted">Starter</span>
                    <span className="font-mono font-bold text-ink">
                      {selectedBakeForJournal.starterPct}% {selectedBakeForJournal.starterName ? `(${selectedBakeForJournal.starterName})` : ''}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Salt</span>
                    <span className="font-mono font-bold text-ink">{selectedBakeForJournal.saltPct}%</span>
                  </div>
                </div>
              </div>

              {/* Archived Timeline */}
              {selectedBakeForJournal.timeline && selectedBakeForJournal.timeline.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-serif italic text-xs uppercase tracking-wider text-muted flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Activity Timeline
                  </h4>
                  <div className="space-y-2 border-l-2 border-border-field pl-3 ml-2">
                    {selectedBakeForJournal.timeline.map((log) => (
                      <div key={log.id} className="space-y-0.5 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-sans font-bold text-ink">{log.stageName}</span>
                          <span className="font-sans text-[10px] text-faint">{log.timeStr}</span>
                        </div>
                        <p className="font-serif text-muted text-[11px]">{log.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Action: Clone */}
            <div className="p-4 bg-oat border-t border-border-card flex gap-2">
              <button
                onClick={() => {
                  const target = selectedBakeForJournal;
                  setSelectedBakeForJournal(null);
                  onCloneBake(target);
                }}
                className="w-full bg-terracotta hover:bg-primary text-white py-3 rounded-[16px] font-sans font-semibold text-xs shadow-btnTerracotta active:scale-98 transition-all flex items-center justify-center gap-1.5"
              >
                <Copy className="w-4 h-4" />
                <span>Clone this Formula to New Bake</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
