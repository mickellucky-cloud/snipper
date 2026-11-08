'use client';

import React, { useRef, useEffect, useState } from 'react';
import {
  ArrowRight,
  ExternalLink,
  Sliders,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import {
  Glass,
  Button,
  SegmentedControl,
  Switch,
  SearchField,
} from 'glisse';
import {
  SniperDashboardState,
  OpenPosition,
  TokenFeedItem,
  ClosedTrade,
  formatTxSignature,
} from '@/lib/sniper-engine';
import { InspectedToken } from './DashboardModals';

interface SniperPanelsProps {
  state: SniperDashboardState;
  feedFilter: 'all' | 'pass' | 'skip';
  onSetFeedFilter: (filter: 'all' | 'pass' | 'skip') => void;
  autoScroll: boolean;
  onToggleAutoScroll: (next?: boolean) => void;
  onInspectToken: (item: InspectedToken) => void;
  onOpenSmartFilters: (tab?: 'filters' | 'swiftui') => void;
  mobileSection: 'all' | 'positions' | 'feed' | 'analytics' | 'logs';
}

export function SniperPanels({
  state,
  feedFilter,
  onSetFeedFilter,
  autoScroll,
  onToggleAutoScroll,
  onInspectToken,
  onOpenSmartFilters,
  mobileSection,
}: SniperPanelsProps) {
  const logContainerRef = useRef<HTMLDivElement | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = 0;
    }
  }, [state.botLogs.length, autoScroll]);

  const filteredFeed = state.tokenFeed.filter((item) => {
    if (feedFilter === 'pass' && item.result !== 'PASS') return false;
    if (feedFilter === 'skip' && item.result !== 'Skip') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.token.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q) ||
        item.reason.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const scrollLogBy = (delta: number) => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollBy({ top: delta, behavior: 'smooth' });
    }
  };

  const showMiddleRow =
    mobileSection === 'all' ||
    mobileSection === 'positions' ||
    mobileSection === 'feed';

  const showBottomRow =
    mobileSection === 'all' ||
    mobileSection === 'analytics' ||
    mobileSection === 'logs';

  return (
    <div className="space-y-3">
      {/* Middle 3-Column Liquid Glass Grid */}
      {showMiddleRow && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch">
          {/* PANEL 1: OPEN POSITIONS */}
          {(mobileSection === 'all' || mobileSection === 'positions') && (
            <Glass
              role="region"
              aria-label="Open Positions"
              className="lg:col-span-4 p-4 lg-panel flex flex-col justify-between"
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between gap-2 pb-3 lg-hairline-b">
                  <div className="flex items-center gap-2 min-w-0">
                    <h2 className="text-[13px] sm:text-sm font-semibold tracking-tight text-[var(--lg-foreground)] whitespace-nowrap">
                      Open Positions
                    </h2>
                    <span
                      className="px-2 py-0.5 rounded-full font-mono tabular-nums text-[11px] font-medium whitespace-nowrap"
                      style={{
                        backgroundColor: 'var(--lg-badge-pos-bg)',
                        color: 'var(--lg-on)',
                      }}
                    >
                      {state.openPositions.length} Active
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      state.openPositions[0] &&
                      onInspectToken({
                        kind: 'position',
                        data: state.openPositions[0],
                      })
                    }
                    className="text-xs font-medium text-[var(--lg-fill)] hover:opacity-80 active:scale-95 transition-all flex items-center gap-1 whitespace-nowrap shrink-0 min-h-[30px] px-1 cursor-pointer"
                  >
                    <span>View All</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Column Headers */}
                <div className="grid grid-cols-12 items-center text-[11px] font-medium text-[var(--lg-muted)] py-2 px-1.5 lg-hairline-b">
                  <div className="col-span-5">Token</div>
                  <div className="col-span-1 text-center">Age</div>
                  <div className="col-span-2 text-right">Cost</div>
                  <div className="col-span-2 text-right pr-2">Now</div>
                  <div className="col-span-2 text-right">P&amp;L</div>
                </div>

                {/* Rows */}
                <div className="pt-1 space-y-0.5">
                  {state.openPositions.length === 0 ? (
                    <div className="py-8 text-center text-xs text-[var(--lg-muted)]">
                      No active positions. Select a pool in Live Token Feed to execute a snipe.
                    </div>
                  ) : (
                    state.openPositions.map((pos: OpenPosition) => {
                      const isPositive = pos.pnlPercent >= 0;
                      return (
                        <button
                          key={pos.id}
                          type="button"
                          onClick={() =>
                            onInspectToken({ kind: 'position', data: pos })
                          }
                          aria-label={`Inspect open position ${pos.token}`}
                          className="w-full grid grid-cols-12 items-center py-2 px-1.5 text-left lg-row-hover group min-h-[42px] lg:min-h-[38px] cursor-pointer"
                        >
                          <div className="col-span-5 flex items-center gap-2.5 min-w-0 pr-1">
                            <div
                              className="w-6 h-6 rounded-[7px] flex items-center justify-center font-mono text-[10px] font-semibold shrink-0"
                              style={{
                                backgroundColor: 'var(--lg-highlight)',
                                color: 'var(--lg-foreground)',
                                boxShadow: 'inset 0 0 0 0.5px var(--lg-surface-edge)',
                              }}
                            >
                              {pos.monogram}
                            </div>
                            <span className="font-mono text-xs font-medium text-[var(--lg-foreground)] truncate">
                              {pos.token}
                            </span>
                          </div>
                          <div className="col-span-1 text-center font-mono tabular-nums text-xs text-[var(--lg-muted)]">
                            {pos.age}
                          </div>
                          <div className="col-span-2 text-right font-mono tabular-nums text-xs text-[var(--lg-muted)]">
                            {pos.costSol.toFixed(1)}
                          </div>
                          <div className="col-span-2 text-right pr-2 font-mono tabular-nums text-xs font-medium text-[var(--lg-foreground)]">
                            {pos.multiplier.toFixed(2)}x
                          </div>
                          <div className="col-span-2 flex justify-end">
                            <span
                              className="px-2 py-0.5 rounded-full font-mono tabular-nums text-[11px] font-semibold"
                              style={{
                                backgroundColor: isPositive
                                  ? 'var(--lg-badge-pos-bg)'
                                  : 'var(--lg-badge-neg-bg)',
                                color: isPositive
                                  ? 'var(--lg-on)'
                                  : 'var(--lg-destructive)',
                                boxShadow: `inset 0 0 0 0.5px ${
                                  isPositive
                                    ? 'var(--lg-badge-pos-border)'
                                    : 'var(--lg-badge-neg-border)'
                                }`,
                              }}
                            >
                              {isPositive ? '+' : ''}
                              {pos.pnlPercent.toFixed(1)}%
                            </span>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </Glass>
          )}

          {/* PANEL 2: LIVE TOKEN FEED */}
          {(mobileSection === 'all' || mobileSection === 'feed') && (
            <Glass
              role="region"
              aria-label="Live Token Feed"
              className="lg:col-span-4 p-4 lg-panel flex flex-col"
            >
              {/* Header with Glisse SegmentedControl */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 lg-hairline-b">
                <div className="flex items-center gap-2 min-w-0">
                  <h2 className="text-[13px] sm:text-sm font-semibold tracking-tight text-[var(--lg-foreground)] whitespace-nowrap">
                    Live Token Feed
                  </h2>
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium" style={{ color: 'var(--lg-on)' }}>
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: 'var(--lg-on)' }}
                    />
                    Live
                  </span>
                </div>

                {/* Genuine Glisse SegmentedControl with lens-lifting thumb */}
                <SegmentedControl
                  aria-label="Filter token feed"
                  className="lg-segmented-compact shrink-0"
                  value={feedFilter}
                  onValueChange={(val) =>
                    onSetFeedFilter(val as 'all' | 'pass' | 'skip')
                  }
                  items={[
                    { value: 'all', label: 'All' },
                    { value: 'pass', label: 'Pass' },
                    { value: 'skip', label: 'Skip' },
                  ]}
                />
              </div>

              {/* Optional Liquid Glass SearchField from Glisse */}
              <div className="py-2 lg-hairline-b">
                <SearchField
                  aria-label="Search token feed"
                  placeholder="Filter by token or reason..."
                  value={searchQuery}
                  onValueChange={setSearchQuery}
                  className="!max-w-none !h-8 !text-xs"
                />
              </div>

              {/* Column Headers */}
              <div className="grid grid-cols-12 items-center text-[11px] font-medium text-[var(--lg-muted)] py-1.5 px-1.5 lg-hairline-b">
                <div className="col-span-4">Token</div>
                <div className="col-span-2 text-center">Result</div>
                <div className="col-span-5">Reason</div>
                <div className="col-span-1 text-right">Age</div>
              </div>

              {/* Feed Rows */}
              <div className="pt-1 space-y-0.5 max-h-[195px] overflow-y-auto custom-scrollbar pr-1">
                {filteredFeed.map((item: TokenFeedItem) => {
                  const isPass = item.result === 'PASS';
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() =>
                        onInspectToken({ kind: 'feed', data: item })
                      }
                      aria-label={`Inspect token feed item ${item.token}`}
                      className="w-full grid grid-cols-12 items-center py-1.5 px-1.5 text-left lg-row-hover min-h-[36px] lg:min-h-[30px] cursor-pointer"
                    >
                      <div className="col-span-4 flex items-center gap-2 min-w-0 pr-1">
                        <div
                          className="w-5 h-5 rounded-[6px] flex items-center justify-center font-mono text-[9px] font-semibold shrink-0"
                          style={{
                            backgroundColor: 'var(--lg-highlight)',
                            color: 'var(--lg-foreground)',
                          }}
                        >
                          {item.monogram}
                        </div>
                        <span className="font-mono text-xs font-medium text-[var(--lg-foreground)] truncate">
                          {item.token}
                        </span>
                      </div>
                      <div className="col-span-2 text-center">
                        <span
                          className="px-1.5 py-0.5 rounded-full font-mono text-[10px] font-semibold"
                          style={{
                            backgroundColor: isPass
                              ? 'var(--lg-badge-pos-bg)'
                              : 'var(--lg-highlight)',
                            color: isPass ? 'var(--lg-on)' : 'var(--lg-muted)',
                          }}
                        >
                          {item.result}
                        </span>
                      </div>
                      <div className="col-span-5 text-xs text-[var(--lg-muted)] truncate pl-1">
                        {item.reason}
                      </div>
                      <div className="col-span-1 text-right font-mono tabular-nums text-[11px] text-[var(--lg-muted)]">
                        {item.age}
                      </div>
                    </button>
                  );
                })}
              </div>
            </Glass>
          )}

          {/* PANEL 3: RECENT TRADES (Scrollable sniper execution history with transaction links and P&L percentage badges) */}
          {(mobileSection === 'all' || mobileSection === 'positions') && (
            <Glass
              role="region"
              aria-label="Recent Trades"
              className="lg:col-span-4 p-4 lg-panel flex flex-col justify-between"
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between gap-2 pb-3 lg-hairline-b">
                  <div className="flex items-center gap-2 min-w-0">
                    <h2 className="text-[13px] sm:text-sm font-semibold tracking-tight text-[var(--lg-foreground)] whitespace-nowrap">
                      Recent Trades
                    </h2>
                    <span
                      className="px-2 py-0.5 rounded-full font-mono tabular-nums text-[11px] font-medium whitespace-nowrap"
                      style={{
                        backgroundColor: 'var(--lg-highlight)',
                        color: 'var(--lg-muted)',
                      }}
                    >
                      {state.closedTrades.length} Fills
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      state.closedTrades[0] &&
                      onInspectToken({
                        kind: 'closed',
                        data: state.closedTrades[0],
                      })
                    }
                    className="text-xs font-medium text-[var(--lg-fill)] hover:opacity-80 active:scale-95 transition-all flex items-center gap-1 whitespace-nowrap shrink-0 min-h-[30px] px-1 cursor-pointer"
                  >
                    <span>View All</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Column Headers */}
                <div className="grid grid-cols-12 items-center text-[11px] font-medium text-[var(--lg-muted)] py-2 px-1.5 lg-hairline-b">
                  <div className="col-span-4">Token</div>
                  <div className="col-span-3 text-right pr-2">P&amp;L</div>
                  <div className="col-span-3 text-left pl-1">Tx Link</div>
                  <div className="col-span-2 text-right">Closed</div>
                </div>

                {/* Scrollable Execution History with custom-scrollbar */}
                <div
                  data-testid="recent-trades-scroll"
                  className="pt-1 space-y-0.5 max-h-[250px] overflow-y-auto custom-scrollbar pr-1"
                >
                  {state.closedTrades.map((trade: ClosedTrade) => {
                    const isPositive = trade.pnlPercent >= 0;
                    return (
                      <div
                        key={trade.id}
                        className="grid grid-cols-12 items-center py-2 lg:py-1.5 px-1.5 lg-row-hover min-h-[40px] lg:min-h-[34px]"
                      >
                        {/* Token Inspector Button */}
                        <button
                          type="button"
                          onClick={() =>
                            onInspectToken({ kind: 'closed', data: trade })
                          }
                          aria-label={`Inspect trade ${trade.token}`}
                          className="col-span-4 flex items-center gap-2 min-w-0 pr-1 text-left cursor-pointer"
                        >
                          <div
                            className="w-5 h-5 rounded-[6px] flex items-center justify-center font-mono text-[9px] font-semibold shrink-0"
                            style={{
                              backgroundColor: 'var(--lg-highlight)',
                              color: 'var(--lg-foreground)',
                            }}
                          >
                            {trade.monogram}
                          </div>
                          <span className="font-mono text-xs font-medium text-[var(--lg-foreground)] truncate">
                            {trade.token}
                          </span>
                        </button>

                        {/* Profit / Loss Percentage Badge */}
                        <div className="col-span-3 flex justify-end pr-2">
                          <span
                            className="px-2 py-0.5 rounded-full font-mono tabular-nums text-[11px] font-semibold"
                            style={{
                              backgroundColor: isPositive
                                ? 'var(--lg-badge-pos-bg)'
                                : 'var(--lg-badge-neg-bg)',
                              color: isPositive
                                ? 'var(--lg-on)'
                                : 'var(--lg-destructive)',
                              boxShadow: `inset 0 0 0 0.5px ${
                                isPositive
                                  ? 'var(--lg-badge-pos-border)'
                                  : 'var(--lg-badge-neg-border)'
                              }`,
                            }}
                          >
                            {isPositive ? '+' : ''}
                            {trade.pnlPercent.toFixed(1)}%
                          </span>
                        </div>

                        {/* Solana Transaction Link */}
                        <div className="col-span-3 pl-1 flex items-center">
                          <a
                            href={trade.solscanUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`Transaction ${formatTxSignature(trade.txSignature)} on Solscan`}
                            className="inline-flex items-center gap-1 font-mono text-[11px] text-[var(--lg-fill)] hover:underline underline-offset-2 transition-opacity whitespace-nowrap"
                          >
                            <span>{formatTxSignature(trade.txSignature)}</span>
                            <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                          </a>
                        </div>

                        {/* Settled Time */}
                        <div className="col-span-2 text-right font-mono tabular-nums text-[11px] text-[var(--lg-muted)] whitespace-nowrap">
                          {trade.closedAgo}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Glass>
          )}
        </div>
      )}

      {/* Bottom 2-Column Liquid Glass Grid */}
      {showBottomRow && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch">
          {/* PANEL 4: WHY TOKENS GET SKIPPED + SMART FILTER POLICY */}
          {(mobileSection === 'all' || mobileSection === 'analytics') && (
            <Glass
              role="region"
              aria-label="Why Tokens Get Skipped"
              className="lg:col-span-5 p-4 lg-panel flex flex-col justify-between"
            >
              {/* Header */}
              <div className="flex items-center justify-between gap-2 pb-2.5 lg-hairline-b">
                <h2 className="text-[13px] sm:text-sm font-semibold tracking-tight text-[var(--lg-foreground)] whitespace-nowrap">
                  Why Tokens Get Skipped
                </h2>
                <button
                  type="button"
                  onClick={() => onOpenSmartFilters('filters')}
                  className="text-xs font-medium text-[var(--lg-fill)] hover:opacity-80 active:scale-95 transition-all flex items-center gap-1 whitespace-nowrap shrink-0 min-h-[28px] px-1 cursor-pointer"
                >
                  <span>View All</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Split Content: Left Table + Right Liquid Glass Smart Filter Card */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 pt-2.5 items-stretch flex-1">
                {/* Left Reason & Count Breakdown */}
                <div className="sm:col-span-7 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-[11px] font-medium text-[var(--lg-muted)] pb-1.5 lg-hairline-b">
                    <span>Reason</span>
                    <span>Count</span>
                  </div>
                  <div className="pt-1 space-y-1 flex-1 flex flex-col justify-around">
                    {state.skipReasons.map((stat) => (
                      <div
                        key={stat.id}
                        className="flex items-center justify-between py-1 text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0 pr-2">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{
                              backgroundColor:
                                stat.category === 'passed'
                                  ? 'var(--lg-on)'
                                  : stat.category === 'liquidity'
                                    ? 'var(--lg-destructive)'
                                    : 'var(--lg-fill)',
                            }}
                          />
                          <span
                            className="truncate"
                            style={{
                              color:
                                stat.category === 'passed'
                                  ? 'var(--lg-on)'
                                  : 'var(--lg-foreground)',
                            }}
                          >
                            {stat.reason}
                          </span>
                        </div>
                        <span className="font-mono tabular-nums font-semibold text-[var(--lg-foreground)]">
                          {stat.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right Glisse Liquid Glass Smart Filters Card */}
                <div className="sm:col-span-5 flex">
                  <Glass className="w-full p-3.5 lg-subcard flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-[var(--lg-foreground)]">
                          Smart Filters
                        </span>
                        <Sliders className="w-3.5 h-3.5 text-[var(--lg-fill)]" />
                      </div>
                      <p className="text-[11px] text-[var(--lg-muted)] mt-1 leading-relaxed">
                        Keep your trades safe &amp; profitable with automated risk gates.
                      </p>

                      <div className="mt-3 space-y-1.5 pt-2.5 lg-hairline-t text-[11px]">
                        <div className="flex items-center justify-between">
                          <span className="text-[var(--lg-muted)]">Min Liquidity</span>
                          <span className="font-mono tabular-nums text-[var(--lg-foreground)]">
                            {state.filterConfig.minLiquiditySol.toFixed(1)} SOL
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[var(--lg-muted)]">Max Holder</span>
                          <span className="font-mono tabular-nums text-[var(--lg-foreground)]">
                            {state.filterConfig.maxTopHolderPercent.toFixed(0)}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[var(--lg-muted)]">TP / SL</span>
                          <span
                            className="font-mono tabular-nums font-medium"
                            style={{ color: 'var(--lg-on)' }}
                          >
                            +{state.filterConfig.takeProfitPercent.toFixed(0)}% / -{state.filterConfig.stopLossPercent.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3">
                      <Button
                        variant="filled"
                        onClick={() => onOpenSmartFilters('filters')}
                        aria-label="Configure Smart Filters"
                        className="w-full !h-9 !text-xs !font-semibold"
                      >
                        Configure Filters
                      </Button>
                    </div>
                  </Glass>
                </div>
              </div>
            </Glass>
          )}

          {/* PANEL 5: BOT LOG */}
          {(mobileSection === 'all' || mobileSection === 'logs') && (
            <Glass
              role="region"
              aria-label="Bot Log"
              className="lg:col-span-7 p-4 lg-panel flex flex-col"
            >
              {/* Header with Glisse Liquid Glass Switch */}
              <div className="flex items-center justify-between gap-2 pb-2.5 lg-hairline-b">
                <h2 className="text-[13px] sm:text-sm font-semibold tracking-tight text-[var(--lg-foreground)]">
                  Bot Log
                </h2>

                {/* Genuine Glisse Switch (lifts into a magnifying lens over the track) */}
                <div className="flex items-center gap-3">
                  <span
                    id="autoscroll-label"
                    className="text-xs font-medium text-[var(--lg-muted)]"
                  >
                    Auto Scroll
                  </span>
                  <Switch
                    checked={autoScroll}
                    onCheckedChange={(checked) => onToggleAutoScroll(checked)}
                    aria-label="Auto Scroll"
                  />
                </div>
              </div>

              {/* Column Headers */}
              <div className="grid grid-cols-12 items-center text-[11px] font-medium text-[var(--lg-muted)] py-1.5 px-1.5 lg-hairline-b">
                <div className="col-span-2 sm:col-span-1">Time</div>
                <div className="col-span-2 sm:col-span-1">Level</div>
                <div className="col-span-8 sm:col-span-10 pl-1">Message</div>
              </div>

              {/* Log Stream + Custom Scroll Track */}
              <div className="relative flex items-stretch pt-1">
                <div
                  ref={logContainerRef}
                  className="flex-1 space-y-0.5 max-h-[195px] overflow-y-auto custom-scrollbar pr-2"
                >
                  {state.botLogs.map((log) => {
                    const isError = log.type === 'error';
                    const isBuy = log.type === 'buy';
                    const isPass = log.type === 'pass';

                    return (
                      <div
                        key={log.id}
                        className="grid grid-cols-12 items-center py-1.5 lg:py-1 px-1.5 text-xs rounded-lg"
                      >
                        <div className="col-span-2 sm:col-span-1 font-mono tabular-nums text-[var(--lg-muted)]">
                          {log.time}
                        </div>
                        <div className="col-span-2 sm:col-span-1 font-mono text-[10px] font-semibold">
                          {isError ? (
                            <span style={{ color: 'var(--lg-destructive)' }}>WARN</span>
                          ) : isBuy ? (
                            <span style={{ color: 'var(--lg-fill)' }}>FILL</span>
                          ) : isPass ? (
                            <span style={{ color: 'var(--lg-on)' }}>PASS</span>
                          ) : (
                            <span className="text-[var(--lg-muted)]">SKIP</span>
                          )}
                        </div>
                        <div className="col-span-8 sm:col-span-10 pl-1 min-w-0">
                          <span
                            className="font-mono text-xs truncate block"
                            style={{
                              color: isError
                                ? 'var(--lg-destructive)'
                                : isPass || isBuy
                                  ? 'var(--lg-foreground)'
                                  : 'var(--lg-muted)',
                            }}
                          >
                            {log.message}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Right Scrollbar Control Strip */}
                <div
                  className="hidden sm:flex flex-col items-center justify-between w-4 rounded-full p-0.5 ml-1 select-none"
                  style={{
                    backgroundColor: 'var(--lg-highlight)',
                  }}
                >
                  <button
                    type="button"
                    aria-label="Scroll log up"
                    onClick={() => scrollLogBy(-80)}
                    className="w-full h-4 flex items-center justify-center text-[var(--lg-muted)] hover:text-[var(--lg-foreground)] cursor-pointer"
                  >
                    <ChevronUp className="w-3 h-3" />
                  </button>
                  <div
                    className="w-1.5 flex-1 my-1 rounded-full"
                    style={{ backgroundColor: 'var(--lg-muted)' }}
                  />
                  <button
                    type="button"
                    aria-label="Scroll log down"
                    onClick={() => scrollLogBy(80)}
                    className="w-full h-4 flex items-center justify-center text-[var(--lg-muted)] hover:text-[var(--lg-foreground)] cursor-pointer"
                  >
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </Glass>
          )}
        </div>
      )}
    </div>
  );
}
