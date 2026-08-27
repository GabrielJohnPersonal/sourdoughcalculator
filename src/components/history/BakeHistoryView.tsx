import React, { useState } from 'react';
import { Search, SlidersHorizontal, Star, Copy, Lock, ShieldCheck } from 'lucide-react';
import { BakeSession, UserProfile } from '../../types';

interface BakeHistoryViewProps {
  user: UserProfile | null;
  history: BakeSession[];
  onCloneBake: (session: BakeSession) => void;
  onOpenAuth: () => void;
}

export const BakeHistoryView: React.FC<BakeHistoryViewProps> = ({
  user,
  history,
  onCloneBake,
  onOpenAuth,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

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

  const filteredHistory = history.filter((b) =>
    b.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-5 max-w-lg mx-auto w-full pb-8">
      {/* Search & Filter Bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search past bakes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-card border border-border-field rounded-[11px] pl-10 pr-4 py-2.5 font-sans text-xs text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-terracotta/20"
          />
        </div>
        <button className="w-10 h-10 rounded-[11px] bg-card border border-border-field flex items-center justify-center text-ink active:scale-95 transition-transform hover:bg-oat">
          <SlidersHorizontal className="w-4 h-4 text-muted" />
        </button>
      </div>

      {/* History Cards List */}
      <div className="space-y-4">
        {filteredHistory.map((item) => (
          <div
            key={item.id}
            className="bg-card rounded-[20px] shadow-[0_2px_12px_rgba(51,48,42,0.06),inset_0_1px_0_rgba(255,255,255,0.8)] border border-border-card overflow-hidden"
          >
            <div className="p-[17px]">
              {/* Title & Star Rating */}
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-serif text-[17px] font-semibold text-ink">
                    {item.title}
                  </h3>
                  <p className="font-sans text-[10px] text-faint uppercase tracking-wider mt-0.5">
                    {item.date}
                  </p>
                </div>

                {/* 5-star rating */}
                <div className="flex gap-0.5 text-warning">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < (item.crumbRating || 4)
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
                    {item.totalFlour}g
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
              <span className="font-serif italic text-xs text-muted line-clamp-1">
                {item.tastingNotes ? `"${item.tastingNotes}"` : 'Classic bake.'}
              </span>

              <button
                onClick={() => onCloneBake(item)}
                className="flex items-center gap-1 font-sans text-xs font-semibold text-terracotta ml-3 whitespace-nowrap active:opacity-70 transition-opacity"
              >
                <span>Clone</span>
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
