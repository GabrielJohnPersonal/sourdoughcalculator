import React, { useState } from 'react';
import { AppTab, BakeSession, StarterProfile, UserProfile, StarterFeedEntry } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useWakeLock } from './hooks/useWakeLock';
import { Header } from './components/layout/Header';
import { BottomNav } from './components/layout/BottomNav';
import { WelcomeModal } from './components/layout/WelcomeModal';
import { ActiveBakesView } from './components/active/ActiveBakesView';
import { BakeHistoryView } from './components/history/BakeHistoryView';
import { StarterDiaryView } from './components/starter/StarterDiaryView';
import {
  INITIAL_STARTERS,
  INITIAL_HISTORY,
  INITIAL_ACTIVE_BAKE,
} from './data/initialData';

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('active');

  // Persistent App State
  const [hasSeenWelcome, setHasSeenWelcome] = useLocalStorage<boolean>(
    'sourdough_has_seen_welcome',
    false
  );
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState(!hasSeenWelcome);

  const [user, setUser] = useLocalStorage<UserProfile | null>(
    'sourdough_user_profile',
    null
  );

  const [starters, setStarters] = useLocalStorage<StarterProfile[]>(
    'sourdough_starters',
    INITIAL_STARTERS
  );

  const [activeBakes, setActiveBakes] = useLocalStorage<BakeSession[]>(
    'sourdough_active_bakes',
    [INITIAL_ACTIVE_BAKE]
  );

  const [bakeHistory, setBakeHistory] = useLocalStorage<BakeSession[]>(
    'sourdough_bake_history',
    INITIAL_HISTORY
  );

  // Screen Wake Lock API
  const { isActive: wakeLockActive, toggle: toggleWakeLock } = useWakeLock();

  // 3 Tab Titles
  const tabTitles: Record<AppTab, string> = {
    active: 'Active Bakes',
    history: 'Bake History',
    diary: 'Starter Diary',
  };

  const handleCloseWelcome = () => {
    setHasSeenWelcome(true);
    setIsWelcomeModalOpen(false);
  };

  const handleSignIn = (newUser: UserProfile) => {
    setUser(newUser);
    setHasSeenWelcome(true);
  };

  const handleCreateBake = (session: BakeSession) => {
    setActiveBakes((prev) => [session, ...prev]);
    setActiveTab('active');
  };

  const handleUpdateActiveBake = (updated: BakeSession) => {
    setActiveBakes((prev) =>
      prev.map((s) => (s.id === updated.id ? updated : s))
    );
  };

  const handleCompleteBake = (sessionId: number) => {
    const session = activeBakes.find((s) => s.id === sessionId);
    if (!session) return;

    const completedSession: BakeSession = {
      ...session,
      status: 'completed',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      crumbRating: 5,
      tastingNotes: 'Freshly baked artisanal loaf.',
    };

    setBakeHistory((prev) => [completedSession, ...prev]);
    setActiveBakes((prev) => prev.filter((s) => s.id !== sessionId));
  };

  const handleArchiveBake = (sessionId: number) => {
    const session = activeBakes.find((s) => s.id === sessionId);
    if (!session) return;

    const archivedSession: BakeSession = {
      ...session,
      status: 'archived',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    };

    setBakeHistory((prev) => [archivedSession, ...prev]);
    setActiveBakes((prev) => prev.filter((s) => s.id !== sessionId));
  };

  const handleCloneBake = (_session: BakeSession) => {
    setActiveTab('active');
  };

  const handleAddStarter = (newStarter: StarterProfile) => {
    setStarters((prev) => [newStarter, ...prev]);
  };

  const handleLogFeed = (starterId: string, entry: StarterFeedEntry) => {
    setStarters((prev) =>
      prev.map((s) => {
        if (s.id !== starterId) return s;
        return {
          ...s,
          lastFedTimestamp: entry.timestamp,
          lastRatio: entry.ratio,
          status: 'active_peak',
          peakTargetTimestamp: Date.now() + 4.5 * 3600 * 1000,
          feedHistory: [entry, ...s.feedHistory],
        };
      })
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface text-ink font-sans selection:bg-terracotta/20">
      {/* Top Header */}
      <Header
        title={tabTitles[activeTab]}
        user={user}
        wakeLockActive={wakeLockActive}
        onToggleWakeLock={toggleWakeLock}
        onOpenAuth={() => setIsWelcomeModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 pt-20 pb-28 px-4 w-full">
        {activeTab === 'active' && (
          <ActiveBakesView
            user={user}
            starters={starters}
            sessions={activeBakes}
            onUpdateSession={handleUpdateActiveBake}
            onCreateSession={handleCreateBake}
            onCompleteSession={handleCompleteBake}
            onArchiveSession={handleArchiveBake}
            onOpenAuth={() => setIsWelcomeModalOpen(true)}
          />
        )}

        {activeTab === 'history' && (
          <BakeHistoryView
            user={user}
            history={bakeHistory}
            onCloneBake={handleCloneBake}
            onOpenAuth={() => setIsWelcomeModalOpen(true)}
          />
        )}

        {activeTab === 'diary' && (
          <StarterDiaryView
            user={user}
            starters={starters}
            onAddStarter={handleAddStarter}
            onLogFeed={handleLogFeed}
            onOpenAuth={() => setIsWelcomeModalOpen(true)}
          />
        )}
      </main>

      {/* Streamlined 3-Tab Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        activeCount={activeBakes.length}
      />

      {/* Onboarding & Sign-In Launchpad Modal */}
      <WelcomeModal
        isOpen={isWelcomeModalOpen}
        onClose={handleCloseWelcome}
        onSelectAction={(tab) => {
          setActiveTab(tab);
          handleCloseWelcome();
        }}
        onSignIn={handleSignIn}
      />
    </div>
  );
}
