import React from 'react';
import { Timer, ScrollText, Wheat } from 'lucide-react';
import { AppTab } from '../../types';

interface BottomNavProps {
  activeTab: AppTab;
  onChangeTab: (tab: AppTab) => void;
  activeCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onChangeTab,
  activeCount,
}) => {
  const tabs: { id: AppTab; label: string; icon: typeof Timer; badge?: number }[] = [
    { id: 'active', label: 'Active', icon: Timer, badge: activeCount },
    { id: 'history', label: 'History', icon: ScrollText },
    { id: 'diary', label: 'Diary', icon: Wheat },
  ];

  return (
    <nav className="fixed bottom-0 w-full z-40 bg-card/95 backdrop-blur-xl border-t border-border-card shadow-[0_-4px_16px_rgba(51,48,42,0.04)] pb-[max(1.25rem,env(safe-area-inset-bottom))]">
      <div className="max-w-lg mx-auto flex justify-around items-center h-16 px-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center gap-1 transition-all active:scale-95 relative py-1 ${
                isActive ? 'text-terracotta' : 'text-disabled hover:text-muted'
              }`}
            >
              <div className="relative">
                <Icon
                  className="w-5 h-5"
                  strokeWidth={isActive ? 2.3 : 1.8}
                />
                {Boolean(tab.badge && tab.badge > 0 && !isActive) && (
                  <span className="absolute -top-1.5 -right-2.5 bg-terracotta text-white font-sans text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center shadow-sm">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span
                className={`font-sans text-[10px] uppercase tracking-widest ${
                  isActive ? 'font-bold' : 'font-medium'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
