import React, { useState } from 'react';
import { AppTab, BakeSession, StarterProfile, UserProfile, StarterFeedEntry } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import { Header } from './components/layout/Header';
import { BottomNav } from './components/layout/BottomNav';
import { WelcomeModal } from './components/layout/WelcomeModal';
import { ActiveBakesView } from './components/active/ActiveBakesView';
import { BakeHistoryView } from './components/history/BakeHistoryView';
import { StarterDiaryView } from './components/starter/StarterDiaryView';
import { INITIAL_STARTERS } from './data/initialData';
import {
  runBakeMigrations,
  ACTIVE_BAKES_KEY,
  BAKE_HISTORY_KEY,
} from './utils/bakeMigration';

// One-time v1 → v2 bake-data migration. Runs before the useLocalStorage
// initializers below read from storage, and is a no-op once migrated.
runBakeMigrations();

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
    ACTIVE_BAKES_KEY,
    []
  );

  const [bakeHistory, setBakeHistory] = useLocalStorage<BakeSession[]>(
    BAKE_HISTORY_KEY,
    []
  );

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
      crumbRating: session.crumbRating || 5,
      tastingNotes: session.tastingNotes || '',
      timeline: session.timeline || [],
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
      timeline: session.timeline || [],
    };

    setBakeHistory((prev) => [archivedSession, ...prev]);
    setActiveBakes((prev) => prev.filter((s) => s.id !== sessionId));
  };

  const handleCloneBake = (session: BakeSession) => {
    const now = Date.now();
    const timeStr = new Date(now).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const clonedSession: BakeSession = {
      ...session,
      id: now,
      date: 'Today',
      time: timeStr,
      status: 'active',
      startedAt: now,
      steps: [],
      timeline: [
        {
          id: `tl-${now}`,
          timestamp: now,
          timeStr,
          stageName: 'Setup',
          message: `Cloned formula from ${session.title} (${session.hydration}% hydration)`,
          type: 'start',
        },
      ],
      crumbRating: undefined,
      tastingNotes: undefined,
    };

    setActiveBakes((prev) => [clonedSession, ...prev]);
    setActiveTab('active');
  };

  const handleUpdateHistoryBake = (updated: BakeSession) => {
    setBakeHistory((prev) =>
      prev.map((s) => (s.id === updated.id ? updated : s))
    );
  };

  const handleAddStarter = (newStarter: StarterProfile) => {
    setStarters((prev) => [newStarter, ...prev]);
  };

  const handleDeleteStarter = (starterId: string) => {
    setStarters((prev) => prev.filter((s) => s.id !== starterId));
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
            onUpdateBake={handleUpdateHistoryBake}
            onOpenAuth={() => setIsWelcomeModalOpen(true)}
          />
        )}

        {activeTab === 'diary' && (
          <StarterDiaryView
            user={user}
            starters={starters}
            onAddStarter={handleAddStarter}
            onDeleteStarter={handleDeleteStarter}
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
