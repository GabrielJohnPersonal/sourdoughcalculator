import React, { useState } from 'react';
import { Scale, Wheat, ScrollText, Sparkles, X, ArrowRight, ShieldCheck } from 'lucide-react';
import { AppTab, UserProfile } from '../../types';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAction: (tab: AppTab) => void;
  onSignIn: (user: UserProfile) => void;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({
  isOpen,
  onClose,
  onSelectAction,
  onSignIn,
}) => {
  const [email, setEmail] = useState('');
  const [authStep, setAuthStep] = useState<'welcome' | 'email'>('welcome');

  if (!isOpen) return null;

  const handleGoogleSignIn = () => {
    // NOTE: this is still a local mock — no real OAuth. Placeholder identity only.
    onSignIn({
      id: 'usr-google',
      email: 'baker@example.com',
      name: 'Baker',
      signedInAt: Date.now(),
    });
    onClose();
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    onSignIn({
      id: 'usr-email',
      email: email.trim(),
      name: email.split('@')[0],
      signedInAt: Date.now(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-card w-full max-w-md rounded-[20px] border border-border-card shadow-[0_16px_36px_rgba(51,48,42,0.15)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 pb-3 flex justify-between items-start border-b border-border-field/40">
          <div>
            <span className="font-serif italic text-xs uppercase tracking-[0.22em] text-terracotta block mb-1">
              Sourdough Calculator
            </span>
            <h2 className="font-serif text-[22px] font-semibold text-ink leading-tight">
              Hey, welcome to your sourdough calculator
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-muted hover:text-ink p-1 rounded-full hover:bg-oat transition-colors"
          >
            <X className="w-5 h-5" strokeWidth={2} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Sign In Options Card */}
          <div className="bg-linen p-4 rounded-xl border border-border-card space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-terracotta" strokeWidth={2} />
              <h3 className="font-sans text-xs uppercase font-bold text-ink tracking-wider">
                Member Cloud Sync & Starter Diary
              </h3>
            </div>
            <p className="font-sans text-xs text-muted leading-relaxed">
              Sign in to save your named starters, track feeding health, and keep permanent crumb journals.
            </p>

            {authStep === 'welcome' ? (
              <div className="space-y-2 pt-1">
                <button
                  onClick={handleGoogleSignIn}
                  className="w-full bg-card hover:bg-oat border border-border-field text-ink font-sans font-semibold text-xs py-2.5 px-4 rounded-[11px] shadow-sm flex items-center justify-center gap-2 transition-all active:scale-98"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.17 0 9.99 0 12s.45 3.83 1.25 5.42l4.03-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                  Continue with Google
                </button>
                <button
                  onClick={() => setAuthStep('email')}
                  className="w-full text-center font-sans text-xs text-muted hover:text-terracotta underline py-1"
                >
                  Or sign in with email address
                </button>
              </div>
            ) : (
              <form onSubmit={handleEmailSubmit} className="space-y-2 pt-1">
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-oat border border-border-field rounded-[11px] px-3 py-2 text-xs font-sans text-ink focus:outline-none focus:border-terracotta"
                  required
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setAuthStep('welcome')}
                    className="px-3 py-1.5 text-xs text-muted font-sans"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-ink text-onDark py-1.5 px-3 rounded-[11px] font-sans font-semibold text-xs"
                  >
                    Confirm Email
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Quick Action Launchpad */}
          <div className="space-y-2.5">
            <span className="font-sans text-[10px] uppercase font-bold text-faint tracking-wider block">
              Choose an action to get started:
            </span>

            <button
              onClick={() => {
                onSelectAction('active');
                onClose();
              }}
              className="w-full bg-oat hover:bg-linen border border-border-field rounded-xl p-3 flex items-center justify-between text-left transition-all active:scale-98"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-card border border-border-card flex items-center justify-center text-terracotta">
                  <Scale className="w-4 h-4" strokeWidth={2} />
                </div>
                <div>
                  <h4 className="font-serif font-semibold text-sm text-ink">Start a New Bake</h4>
                  <p className="font-sans text-xs text-muted">Calculate hydration, flour blends & salt</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-faint" />
            </button>

            <button
              onClick={() => {
                onSelectAction('diary');
                onClose();
              }}
              className="w-full bg-oat hover:bg-linen border border-border-field rounded-xl p-3 flex items-center justify-between text-left transition-all active:scale-98"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-card border border-border-card flex items-center justify-center text-terracotta">
                  <Wheat className="w-4 h-4" strokeWidth={2} />
                </div>
                <div>
                  <h4 className="font-serif font-semibold text-sm text-ink">Starter Diary</h4>
                  <p className="font-sans text-xs text-muted">Track named starters & levain feeding ratios</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-faint" />
            </button>

            <button
              onClick={() => {
                onSelectAction('history');
                onClose();
              }}
              className="w-full bg-oat hover:bg-linen border border-border-field rounded-xl p-3 flex items-center justify-between text-left transition-all active:scale-98"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-card border border-border-card flex items-center justify-center text-terracotta">
                  <ScrollText className="w-4 h-4" strokeWidth={2} />
                </div>
                <div>
                  <h4 className="font-serif font-semibold text-sm text-ink">Bake History</h4>
                  <p className="font-sans text-xs text-muted">Review past loaves & crumb scores</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-faint" />
            </button>
          </div>

          {/* What's New — one line */}
          <div className="border-t border-dashed border-border-field pt-3 space-y-1.5">
            <div className="flex items-center gap-1.5 text-terracotta">
              <Sparkles className="w-3.5 h-3.5" strokeWidth={2} />
              <span className="font-sans text-[11px] font-bold uppercase tracking-wider">What's New</span>
            </div>
            <p className="font-sans text-xs text-muted leading-relaxed">
              Custom bake steps with drift-free wall-clock timers, a temperature-based bulk-fermentation estimate, and starters at any hydration.
            </p>
          </div>
        </div>

        {/* Footer Dismiss Action */}
        <div className="p-4 bg-oat border-t border-border-field flex justify-end">
          <button
            onClick={onClose}
            className="w-full bg-ink text-onDark py-3 rounded-[16px] font-sans font-semibold text-sm shadow-btnInk active:scale-98 transition-transform text-center"
          >
            Get Baking
          </button>
        </div>
      </div>
    </div>
  );
};
