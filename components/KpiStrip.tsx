'use client';

import React from 'react';
import { Glass } from 'glisse';
import { SniperDashboardState } from '@/lib/sniper-engine';

interface KpiStripProps {
  state: SniperDashboardState;
  onOpenSmartFilters: () => void;
  onSelectFilterTab?: (tab: 'all' | 'pass' | 'skip') => void;
}

export function KpiStrip({
  state,
  onOpenSmartFilters,
  onSelectFilterTab,
}: KpiStripProps) {
  const netIsPositive = state.netPnlSol > 0;
  const netIsZero = state.netPnlSol === 0;
  const realizedIsPositive = state.realizedPnlSol >= 0;

  return (
    <section
      aria-label="Key Performance Metrics"
      className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-11 gap-2.5"
    >
      {/* 1. Paper / Live Balance */}
      <Glass className="col-span-1 xl:col-span-2 px-4 py-3 lg-kpi-card flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-medium text-[var(--lg-muted)]">
            {state.mode === 'PAPER' ? 'Paper Balance' : 'Live Balance'}
          </span>
          <span
            className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wide"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--lg-fill) 16%, transparent)',
              color: 'var(--lg-fill)',
            }}
          >
            {state.mode}
          </span>
        </div>
        <div className="mt-1.5 font-mono tabular-nums text-xl lg:text-[22px] leading-tight font-semibold tracking-tight text-[var(--lg-foreground)]">
          {state.balanceSol.toFixed(3)} SOL
        </div>
      </Glass>

      {/* 2. Net P&L */}
      <Glass className="col-span-1 xl:col-span-2 px-4 py-3 lg-kpi-card flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-medium text-[var(--lg-muted)]">
            Net P&amp;L
          </span>
          <span className="font-mono text-[10px] text-[var(--lg-muted)]">
            24h
          </span>
        </div>
        <div
          className="mt-1.5 font-mono tabular-nums text-xl lg:text-[22px] leading-tight font-semibold tracking-tight"
          style={{
            color: netIsPositive
              ? 'var(--lg-on)'
              : netIsZero
                ? 'var(--lg-foreground)'
                : 'var(--lg-destructive)',
          }}
        >
          {state.netPnlSol > 0 ? '+' : ''}
          {state.netPnlSol.toFixed(3)} SOL
        </div>
      </Glass>

      {/* 3. Realized P&L */}
      <Glass className="col-span-1 xl:col-span-2 px-4 py-3 lg-kpi-card flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-medium text-[var(--lg-muted)]">
            Realized P&amp;L
          </span>
          <span className="font-mono text-[10px] text-[var(--lg-muted)]">
            Settled
          </span>
        </div>
        <div
          className="mt-1.5 font-mono tabular-nums text-xl lg:text-[22px] leading-tight font-semibold tracking-tight"
          style={{
            color: realizedIsPositive ? 'var(--lg-on)' : 'var(--lg-destructive)',
          }}
        >
          {state.realizedPnlSol >= 0 ? '+' : ''}
          {state.realizedPnlSol.toFixed(3)} SOL
        </div>
      </Glass>

      {/* 4. Closed Trades */}
      <Glass className="col-span-1 xl:col-span-1 px-3.5 py-3 lg-kpi-card flex flex-col justify-between">
        <span className="text-[12px] font-medium text-[var(--lg-muted)] whitespace-nowrap">
          Closed Trades
        </span>
        <div className="mt-1.5 font-mono tabular-nums text-xl lg:text-[22px] leading-tight font-semibold tracking-tight text-[var(--lg-foreground)]">
          {state.closedTradesCount}
        </div>
      </Glass>

      {/* 5. Win Rate */}
      <Glass className="col-span-1 xl:col-span-1 px-3.5 py-3 lg-kpi-card flex flex-col justify-between">
        <span className="text-[12px] font-medium text-[var(--lg-muted)] whitespace-nowrap">
          Win Rate
        </span>
        <div className="mt-1.5 font-mono tabular-nums text-xl lg:text-[22px] leading-tight font-semibold tracking-tight text-[var(--lg-foreground)]">
          {state.winRatePercent}%
        </div>
      </Glass>

      {/* 6. Tokens Seen */}
      <Glass
        role="button"
        tabIndex={0}
        aria-label={`Tokens Seen: ${state.tokensSeenCount}`}
        onClick={() => onSelectFilterTab?.('all')}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelectFilterTab?.('all');
          }
        }}
        className="col-span-1 xl:col-span-1 text-left px-3.5 py-3 lg-kpi-card lg-kpi-interactive flex flex-col justify-between"
      >
        <span className="text-[12px] font-medium text-[var(--lg-muted)] whitespace-nowrap">
          Tokens Seen
        </span>
        <div className="mt-1.5 font-mono tabular-nums text-xl lg:text-[22px] leading-tight font-semibold tracking-tight text-[var(--lg-foreground)]">
          {state.tokensSeenCount}
        </div>
      </Glass>

      {/* 7. Passed Filters */}
      <Glass
        role="button"
        tabIndex={0}
        aria-label={`Passed Filters: ${state.passedFiltersCount}`}
        onClick={() => onSelectFilterTab?.('pass')}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelectFilterTab?.('pass');
          }
        }}
        className="col-span-1 xl:col-span-1 text-left px-3.5 py-3 lg-kpi-card lg-kpi-interactive flex flex-col justify-between"
      >
        <span className="text-[12px] font-medium text-[var(--lg-muted)] whitespace-nowrap">
          Passed Filters
        </span>
        <div
          className="mt-1.5 font-mono tabular-nums text-xl lg:text-[22px] leading-tight font-semibold tracking-tight"
          style={{ color: 'var(--lg-on)' }}
        >
          {state.passedFiltersCount}
        </div>
      </Glass>

      {/* 8. Blacklisted */}
      <Glass
        role="button"
        tabIndex={0}
        aria-label={`Blacklisted: ${state.blacklistedCount}`}
        onClick={onOpenSmartFilters}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onOpenSmartFilters();
          }
        }}
        className="col-span-1 xl:col-span-1 text-left px-3.5 py-3 lg-kpi-card lg-kpi-interactive flex flex-col justify-between"
      >
        <span className="text-[12px] font-medium text-[var(--lg-muted)] whitespace-nowrap">
          Blacklisted
        </span>
        <div className="mt-1.5 font-mono tabular-nums text-xl lg:text-[22px] leading-tight font-semibold tracking-tight text-[var(--lg-foreground)]">
          {state.blacklistedCount}
        </div>
      </Glass>
    </section>
  );
}
