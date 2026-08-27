import React from 'react';
import { User } from 'lucide-react';
import { UserProfile } from '../../types';

interface HeaderProps {
  title: string;
  user: UserProfile | null;
  onOpenAuth: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  user,
  onOpenAuth,
}) => {
  return (
    <header className="fixed top-0 w-full z-40 bg-surface/85 backdrop-blur-xl border-b border-border-card/50 shadow-[0_1px_8px_rgba(0,0,0,0.03)]">
      <div className="max-w-lg mx-auto h-16 px-5 flex items-center justify-between">
        <h1 className="font-serif text-[22px] font-semibold text-ink tracking-tight">
          {title}
        </h1>

        <div className="flex items-center gap-2.5">
          {/* User Profile / Auth Button */}
          <button
            onClick={onOpenAuth}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-transform active:scale-95 ${
              user
                ? 'bg-terracotta text-white shadow-sm font-sans font-bold text-xs'
                : 'bg-ink text-onDark shadow-sm hover:opacity-90'
            }`}
            title={user ? `Signed in as ${user.name || user.email}` : 'Sign in to sync your bakes'}
          >
            {user ? (
              user.name ? user.name.charAt(0).toUpperCase() : 'U'
            ) : (
              <User className="w-4 h-4 text-onDark" strokeWidth={2} />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
