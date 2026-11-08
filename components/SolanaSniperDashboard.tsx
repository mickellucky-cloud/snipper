'use client';

import React, { useState, useEffect } from 'react';
import {
  Pause,
  Play,
  LayoutGrid,
  TrendingUp,
  Zap,
  Sliders,
  Code2,
  Sun,
  Moon,
  Sparkles,
  Terminal,
} from 'lucide-react';
import {
  Glass,
  Button,
  SegmentedControl,
  TabBar,
  Menu,
} from 'glisse';
import {
  INITIAL_DASHBOARD_STATE,
  SniperDashboardState,
  TradingMode,
  SmartFilterConfig,
  TokenFeedItem,
  formatElapsedTime,
  closeOpenPosition,
  blacklistToken,
  evaluateTokenCandidate,
} from '@/lib/sniper-engine';
import { KpiStrip } from './KpiStrip';
import { SniperPanels } from './SniperPanels';
import {
  TokenInspectorSheet,
  SmartFilterSheet,
  InspectedToken,
} from './DashboardModals';

function SolanaMark({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <div
      className={`flex flex-col justify-between ${className} shrink-0 select-none`}
      aria-hidden="true"
    >
      <span
        className="h-[23%] w-full rounded-[2px] -skew-x-[18deg]"
        style={{ backgroundColor: 'var(--lg-fill)' }}
      />
      <span
        className="h-[23%] w-full rounded-[2px] skew-x-[18deg]"
        style={{ backgroundColor: 'var(--lg-foreground)' }}
      />
      <span
        className="h-[23%] w-full rounded-[2px] -skew-x-[18deg]"
        style={{ backgroundColor: 'var(--lg-on)' }}
      />
    </div>
  );
}

export function SolanaSniperDashboard() {
  const [state, setState] = useState<SniperDashboardState>(
    INITIAL_DASHBOARD_STATE
  );
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [feedFilter, setFeedFilter] = useState<'all' | 'pass' | 'skip'>('all');
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const [inspectedToken, setInspectedToken] = useState<InspectedToken | null>(
    null
  );
  const [smartFilterModal, setSmartFilterModal] = useState<{
    open: boolean;
    tab: 'filters' | 'swiftui';
  }>({ open: false, tab: 'filters' });
  const [mobileSection, setMobileSection] = useState<
    'all' | 'positions' | 'feed' | 'analytics' | 'logs'
  >('all');

  // Tick elapsed timer every second when bot is active
  useEffect(() => {
    if (!state.botActive) return;
    const interval = setInterval(() => {
      setState((prev) => ({
        ...prev,
        elapsedSeconds: prev.elapsedSeconds + 1,
      }));
    }, 1000);
    return () => clearInterval(interval);
  }, [state.botActive]);

  const handleToggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', nextTheme);
    }
  };

  const handleToggleBot = () => {
    setState((prev) => {
      const nextActive = !prev.botActive;
      return {
        ...prev,
        botActive: nextActive,
        botLogs: [
          {
            id: `log-toggle-${Date.now()}`,
            time: '1s',
            type: nextActive ? 'pass' : 'info',
            message: nextActive
              ? 'PASS Sniper engine resumed — monitoring Raydium & Pump.fun'
              : 'Sniper engine paused by operator',
          },
          ...prev.botLogs,
        ],
      };
    });
  };

  const handleSetMode = (nextMode: TradingMode) => {
    setState((prev) => {
      if (prev.mode === nextMode) return prev;
      return {
        ...prev,
        mode: nextMode,
        balanceSol: nextMode === 'PAPER' ? 9.5 : 14.25,
        botLogs: [
          {
            id: `log-mode-${Date.now()}`,
            time: '1s',
            type: 'info',
            message: `Switched execution wallet to ${nextMode} mode`,
          },
          ...prev.botLogs,
        ],
      };
    });
  };

  const handleSellPosition = (positionId: string) => {
    setState((prev) => closeOpenPosition(prev, positionId, 'MANUAL'));
  };

  const handleBlacklist = (tokenLabel: string, fullMint: string) => {
    setState((prev) => blacklistToken(prev, tokenLabel, fullMint));
  };

  const handleSnipeFromFeed = (feedItem: TokenFeedItem) => {
    setState((prev) => {
      const buyCost = prev.filterConfig.buySizeSol;
      const newPos = {
        id: `pos-${Date.now()}`,
        token: feedItem.token,
        fullMint: feedItem.fullMint,
        name: feedItem.name,
        monogram: feedItem.monogram,
        age: '1s',
        ageSeconds: 1,
        costSol: buyCost,
        multiplier: 1.0,
        pnlPercent: 0.0,
        liquiditySol: Math.max(feedItem.liquiditySol, 12.0),
        topHolderPercent: feedItem.topHolderPercent,
      };
      return {
        ...prev,
        balanceSol: Number((prev.balanceSol - buyCost).toFixed(3)),
        openPositions: [newPos, ...prev.openPositions],
        botLogs: [
          {
            id: `log-buy-${Date.now()}`,
            time: '1s',
            type: 'buy',
            message: `${prev.mode} BUY ${feedItem.token} ${buyCost.toFixed(1)} SOL`,
          },
          ...prev.botLogs,
        ],
      };
    });
  };

  const handleUpdateFilterConfig = (nextConfig: SmartFilterConfig) => {
    setState((prev) => ({
      ...prev,
      filterConfig: nextConfig,
    }));
  };

  const handleSimulatePool = (preset: 'pass' | 'low_liq' | 'high_holder') => {
    setState((prev) => {
      const candidateParams =
        preset === 'pass'
          ? {
              token: '7xKp...pump',
              name: 'Swift Sol',
              monogram: '7X',
              liquiditySol: 24.5,
              topHolderPercent: 12.4,
              curveSol: 24.5,
              hasBondingCurve: true,
              curveComplete: false,
            }
          : preset === 'low_liq'
            ? {
                token: '3mQr...pump',
                name: 'Dust Pool',
                monogram: '3M',
                liquiditySol: 0.01,
                topHolderPercent: 30.0,
                curveSol: 0.01,
                hasBondingCurve: true,
                curveComplete: false,
              }
            : {
                token: '9vWx...pump',
                name: 'Whale Vault',
                monogram: '9V',
                liquiditySol: 16.0,
                topHolderPercent: 81.4,
                curveSol: 16.0,
                hasBondingCurve: true,
                curveComplete: false,
              };

      const verdict = evaluateTokenCandidate(
        candidateParams,
        prev.filterConfig
      );

      const newFeedItem: TokenFeedItem = {
        id: `feed-sim-${Date.now()}`,
        token: candidateParams.token,
        fullMint: `${candidateParams.token.slice(0, 4)}SimulatedMintAddress${Date.now()}`,
        name: candidateParams.name,
        monogram: candidateParams.monogram,
        result: verdict.result,
        reason: verdict.reason,
        age: '1s',
        ageSeconds: 1,
        liquiditySol: candidateParams.liquiditySol,
        topHolderPercent: candidateParams.topHolderPercent,
        curveSol: candidateParams.curveSol,
      };

      const updatedReasons = prev.skipReasons.map((r) =>
        r.category === verdict.category ? { ...r, count: r.count + 1 } : r
      );

      return {
        ...prev,
        tokensSeenCount: prev.tokensSeenCount + 1,
        passedFiltersCount:
          verdict.result === 'PASS'
            ? prev.passedFiltersCount + 1
            : prev.passedFiltersCount,
        tokenFeed: [newFeedItem, ...prev.tokenFeed],
        skipReasons: updatedReasons,
        botLogs: [
          {
            id: `log-sim-${Date.now()}`,
            time: '1s',
            type: verdict.result === 'PASS' ? 'pass' : 'skip',
            message:
              verdict.result === 'PASS'
                ? `PASS ${candidateParams.token} ${verdict.reason}`
                : `skip ${candidateParams.token} ${verdict.reason}`,
          },
          ...prev.botLogs,
        ],
      };
    });
  };

  return (
    <div
      data-lg-backdrop
      className="min-h-screen flex flex-col justify-between lg-wallpaper-canvas text-[var(--lg-foreground)] relative overflow-x-hidden pb-24 md:pb-0"
    >
      {/* Top Sticky Apple iOS 26 / macOS Tahoe Liquid Glass Toolbar */}
      <header className="sticky top-0 z-30 lg-toolbar-bar px-3 sm:px-6 lg:px-8 py-2">
        <div className="max-w-[1540px] mx-auto flex items-center justify-between gap-2">
          {/* Zone 1: Brand + Glisse SegmentedControl Mode Switcher */}
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <div className="flex items-center gap-2 shrink-0">
              <SolanaMark className="w-5 h-5 sm:w-6 sm:h-6" />
              <div>
                <h1 className="text-[13px] sm:text-lg font-semibold tracking-tight text-[var(--lg-foreground)] leading-none whitespace-nowrap">
                  Solana Sniper
                </h1>
                <p className="hidden sm:block text-[9px] font-medium tracking-[0.18em] uppercase text-[var(--lg-muted)] mt-0.5">
                  Fast · Smart · Profitable
                </p>
              </div>
            </div>

            {/* Genuine Glisse SegmentedControl for PAPER / LIVE mode */}
            <SegmentedControl
              aria-label="Trading Mode"
              className="lg-segmented-mode shrink-0"
              value={state.mode}
              onValueChange={(val) => handleSetMode(val as TradingMode)}
              items={[
                { value: 'PAPER', label: 'Paper' },
                { value: 'LIVE', label: 'Live' },
              ]}
            />
          </div>

          {/* Zone 3: Bot Status Pill, Glisse Filled Button, Theme Button, & Glisse Morphing Menu */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Bot Active Status Telemetry in Glisse Glass Capsule (Desktop/Tablet) */}
            <Glass
              className="hidden md:flex h-9 px-3.5 rounded-full items-center gap-2"
              role="status"
              aria-live="polite"
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{
                  backgroundColor: state.botActive ? 'var(--lg-on)' : '#ff9f0a',
                }}
              />
              <span className="text-xs font-medium text-[var(--lg-foreground)] whitespace-nowrap">
                {state.botActive ? 'Bot Active' : 'Bot Paused'}
              </span>
              <span className="font-mono tabular-nums text-xs text-[var(--lg-muted)] pl-2 border-l border-[var(--lg-separator)]">
                {formatElapsedTime(state.elapsedSeconds)}
              </span>
            </Glass>

            {/* Primary Pause / Resume Glisse Filled Button */}
            <Button
              variant="filled"
              tint={state.botActive ? '#0091ff' : '#30d158'}
              onClick={handleToggleBot}
              className="!h-9 !px-3 sm:!px-4 !text-xs sm:!text-sm"
              icon={
                state.botActive ? (
                  <Pause className="w-3.5 h-3.5 fill-current" />
                ) : (
                  <Play className="w-3.5 h-3.5 fill-current" />
                )
              }
            >
              {state.botActive ? 'Pause' : 'Resume'}
            </Button>

            {/* Appearance Toggle (Dark / Light Liquid Glass - visible sm+, also in Menu on mobile) */}
            <div className="hidden sm:block">
              <Button
                variant="glass"
                onClick={handleToggleTheme}
                aria-label={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Liquid Glass`}
                icon={
                  theme === 'dark' ? (
                    <Sun className="w-4 h-4" />
                  ) : (
                    <Moon className="w-4 h-4" />
                  )
                }
              />
            </div>

            {/* Genuine Glisse Morphing Liquid Glass Menu */}
            <Menu
              aria-label="Terminal Actions"
              align="end"
              items={[
                {
                  label: 'Smart Filter Rules',
                  icon: <Sliders className="w-4 h-4" />,
                  onSelect: () =>
                    setSmartFilterModal({ open: true, tab: 'filters' }),
                },
                {
                  label: 'SwiftUI Source',
                  icon: <Code2 className="w-4 h-4" />,
                  onSelect: () =>
                    setSmartFilterModal({ open: true, tab: 'swiftui' }),
                },
                'separator',
                {
                  label: 'Simulate Passing Pool',
                  icon: <Sparkles className="w-4 h-4" />,
                  onSelect: () => handleSimulatePool('pass'),
                },
                {
                  label:
                    theme === 'dark' ? 'Light Liquid Glass' : 'Dark Liquid Glass',
                  icon:
                    theme === 'dark' ? (
                      <Sun className="w-4 h-4" />
                    ) : (
                      <Moon className="w-4 h-4" />
                    ),
                  onSelect: handleToggleTheme,
                },
              ]}
            />
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="relative z-10 flex-1 max-w-[1540px] w-full mx-auto px-3.5 sm:px-6 lg:px-8 py-2.5 space-y-2.5">
        {/* 8 KPI Cards Row */}
        <KpiStrip
          state={state}
          onOpenSmartFilters={() =>
            setSmartFilterModal({ open: true, tab: 'filters' })
          }
          onSelectFilterTab={(tab) => setFeedFilter(tab)}
        />

        {/* 5 Bento Panels */}
        <SniperPanels
          state={state}
          feedFilter={feedFilter}
          onSetFeedFilter={setFeedFilter}
          autoScroll={autoScroll}
          onToggleAutoScroll={(next) =>
            setAutoScroll((prev) => (typeof next === 'boolean' ? next : !prev))
          }
          onInspectToken={(item) => setInspectedToken(item)}
          onOpenSmartFilters={(tab = 'filters') =>
            setSmartFilterModal({ open: true, tab })
          }
          mobileSection={mobileSection}
        />
      </main>

      {/* Bottom Apple Liquid Glass Status Bar */}
      <footer className="relative z-10 lg-hairline-t px-3.5 sm:px-6 lg:px-8 py-2.5">
        <div className="max-w-[1540px] mx-auto flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--lg-muted)]">
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-4">
            <span className="inline-flex items-center gap-2">
              <SolanaMark className="w-3.5 h-3.5" />
              <span>
                Solana Network:{' '}
                <strong
                  className="font-semibold"
                  style={{ color: 'var(--lg-on)' }}
                >
                  Healthy
                </strong>
              </span>
            </span>
            <span aria-hidden="true">|</span>
            <span>
              RPC:{' '}
              <strong className="font-mono text-[var(--lg-foreground)] font-medium">
                Fast (14ms)
              </strong>
            </span>
            <span className="hidden sm:inline" aria-hidden="true">
              |
            </span>
            <span className="hidden sm:inline font-mono">Version: v2.0.0</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="glass"
              onClick={() =>
                setSmartFilterModal({ open: true, tab: 'swiftui' })
              }
              icon={<Code2 className="w-4 h-4" />}
              className="!h-8 !px-3.5 !text-xs"
            >
              Powered by Solana · SwiftUI
            </Button>
          </div>
        </div>
      </footer>

      {/* Mobile Native iOS 26 Glisse Liquid Glass TabBar (< 768px) */}
      <nav
        aria-label="Mobile SwiftUI Tab Bar"
        className="md:hidden fixed bottom-2.5 left-0 right-0 z-40 flex justify-center px-2 pointer-events-none"
      >
        <div className="pointer-events-auto">
          <TabBar
            aria-label="Mobile View Switcher"
            value={mobileSection}
            onValueChange={(val) =>
              setMobileSection(
                val as 'all' | 'positions' | 'feed' | 'analytics' | 'logs'
              )
            }
            items={[
              {
                value: 'all',
                label: 'Overview',
                icon: <LayoutGrid className="w-5 h-5" />,
              },
              {
                value: 'positions',
                label: 'Trades',
                icon: <TrendingUp className="w-5 h-5" />,
              },
              {
                value: 'feed',
                label: 'Feed',
                icon: <Zap className="w-5 h-5" />,
              },
              {
                value: 'analytics',
                label: 'Filters',
                icon: <Sliders className="w-5 h-5" />,
              },
              {
                value: 'logs',
                label: 'Logs',
                icon: <Terminal className="w-5 h-5" />,
              },
            ]}
          />
        </div>
      </nav>

      {/* Interactive SwiftUI Draggable Sheets */}
      <TokenInspectorSheet
        inspected={inspectedToken}
        onClose={() => setInspectedToken(null)}
        onSellPosition={handleSellPosition}
        onBlacklist={handleBlacklist}
        onSnipeToken={handleSnipeFromFeed}
      />

      <SmartFilterSheet
        isOpen={smartFilterModal.open}
        activeTab={smartFilterModal.tab}
        onChangeTab={(tab) => setSmartFilterModal((prev) => ({ ...prev, tab }))}
        onClose={() => setSmartFilterModal((prev) => ({ ...prev, open: false }))}
        config={state.filterConfig}
        mode={state.mode}
        onUpdateConfig={handleUpdateFilterConfig}
        onSimulatePool={handleSimulatePool}
      />
    </div>
  );
}
