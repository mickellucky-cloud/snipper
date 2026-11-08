'use client';

import React, { useState } from 'react';
import {
  Check,
  Copy,
  ArrowUpRight,
  Ban,
  ExternalLink,
} from 'lucide-react';
import {
  Glass,
  Button,
  SegmentedControl,
  Slider,
} from 'glisse';
import {
  SmartFilterConfig,
  TradingMode,
  OpenPosition,
  TokenFeedItem,
  ClosedTrade,
  formatTxSignature,
  generateSwiftUICode,
} from '@/lib/sniper-engine';
import { FluidSheet } from './FluidSheet';

export type InspectedToken =
  | { kind: 'position'; data: OpenPosition }
  | { kind: 'feed'; data: TokenFeedItem }
  | { kind: 'closed'; data: ClosedTrade };

interface TokenInspectorSheetProps {
  inspected: InspectedToken | null;
  onClose: () => void;
  onSellPosition: (id: string) => void;
  onBlacklist: (token: string, fullMint: string) => void;
  onSnipeToken: (token: TokenFeedItem) => void;
}

export function TokenInspectorSheet({
  inspected,
  onClose,
  onSellPosition,
  onBlacklist,
  onSnipeToken,
}: TokenInspectorSheetProps) {
  const [copied, setCopied] = useState(false);

  if (!inspected) return null;

  const { data, kind } = inspected;
  const handleCopyMint = () => {
    navigator.clipboard?.writeText(data.fullMint);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <FluidSheet
      isOpen={Boolean(inspected)}
      onClose={onClose}
      title={`${data.name} (${data.token})`}
      subtitle="Execution & Risk Inspector · Drag handle to dismiss"
    >
      <div className="space-y-5">
        {/* Token Hero Banner */}
        <Glass className="flex items-center justify-between p-4 lg-subcard">
          <div className="flex items-center gap-3.5">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center font-mono text-sm font-semibold"
              style={{
                backgroundColor: 'var(--lg-highlight)',
                color: 'var(--lg-foreground)',
                boxShadow: 'inset 0 0 0 0.5px var(--lg-surface-edge)',
              }}
            >
              {data.monogram}
            </div>
            <div>
              <div className="text-base font-semibold text-[var(--lg-foreground)]">
                {data.name}
              </div>
              <div className="font-mono text-xs text-[var(--lg-muted)] mt-0.5">
                {data.token}
              </div>
            </div>
          </div>

          <Button
            variant="glass"
            onClick={handleCopyMint}
            icon={
              copied ? (
                <Check className="w-4 h-4" style={{ color: 'var(--lg-on)' }} />
              ) : (
                <Copy className="w-4 h-4" />
              )
            }
          >
            {copied ? 'Copied Mint' : 'Copy Mint'}
          </Button>
        </Glass>

        {/* Telemetry Grid */}
        {kind === 'position' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <Glass className="p-3 lg-subcard">
              <div className="text-xs text-[var(--lg-muted)]">Entry Cost</div>
              <div className="font-mono tabular-nums text-sm font-semibold text-[var(--lg-foreground)] mt-1">
                {data.costSol.toFixed(2)} SOL
              </div>
            </Glass>
            <Glass className="p-3 lg-subcard">
              <div className="text-xs text-[var(--lg-muted)]">Multiple</div>
              <div className="font-mono tabular-nums text-sm font-semibold text-[var(--lg-foreground)] mt-1">
                {data.multiplier.toFixed(2)}x
              </div>
            </Glass>
            <Glass className="p-3 lg-subcard">
              <div className="text-xs text-[var(--lg-muted)]">Unrealized P&amp;L</div>
              <div
                className="font-mono tabular-nums text-sm font-semibold mt-1"
                style={{
                  color:
                    data.pnlPercent >= 0 ? 'var(--lg-on)' : 'var(--lg-destructive)',
                }}
              >
                {data.pnlPercent >= 0 ? '+' : ''}
                {data.pnlPercent.toFixed(1)}%
              </div>
            </Glass>
            <Glass className="p-3 lg-subcard">
              <div className="text-xs text-[var(--lg-muted)]">Top Holder</div>
              <div className="font-mono tabular-nums text-sm font-semibold text-[var(--lg-foreground)] mt-1">
                {data.topHolderPercent.toFixed(1)}%
              </div>
            </Glass>
          </div>
        )}

        {kind === 'feed' && (
          <div className="grid grid-cols-3 gap-2.5">
            <Glass className="p-3 lg-subcard">
              <div className="text-xs text-[var(--lg-muted)]">Pool Liquidity</div>
              <div className="font-mono tabular-nums text-sm font-semibold text-[var(--lg-foreground)] mt-1">
                {data.liquiditySol.toFixed(2)} SOL
              </div>
            </Glass>
            <Glass className="p-3 lg-subcard">
              <div className="text-xs text-[var(--lg-muted)]">Top Holder</div>
              <div className="font-mono tabular-nums text-sm font-semibold text-[var(--lg-foreground)] mt-1">
                {data.topHolderPercent.toFixed(1)}%
              </div>
            </Glass>
            <Glass className="p-3 lg-subcard">
              <div className="text-xs text-[var(--lg-muted)]">Filter Verdict</div>
              <div
                className="font-mono text-sm font-semibold mt-1"
                style={{
                  color:
                    data.result === 'PASS' ? 'var(--lg-on)' : 'var(--lg-destructive)',
                }}
              >
                {data.result} ({data.reason})
              </div>
            </Glass>
          </div>
        )}

        {kind === 'closed' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <Glass className="p-3 lg-subcard">
                <div className="text-xs text-[var(--lg-muted)]">Realized P&amp;L</div>
                <div
                  className="font-mono tabular-nums text-sm font-semibold mt-1"
                  style={{
                    color:
                      data.pnlPercent >= 0
                        ? 'var(--lg-on)'
                        : 'var(--lg-destructive)',
                  }}
                >
                  {data.pnlPercent >= 0 ? '+' : ''}
                  {data.pnlPercent.toFixed(1)}%
                </div>
              </Glass>
              <Glass className="p-3 lg-subcard">
                <div className="text-xs text-[var(--lg-muted)]">Exit Trigger</div>
                <div className="font-mono text-sm font-semibold text-[var(--lg-foreground)] mt-1">
                  {data.exitType}
                </div>
              </Glass>
              <Glass className="p-3 lg-subcard">
                <div className="text-xs text-[var(--lg-muted)]">Fill Latency</div>
                <div className="font-mono tabular-nums text-sm font-semibold text-[var(--lg-foreground)] mt-1">
                  {data.executionMs}ms
                </div>
              </Glass>
              <Glass className="p-3 lg-subcard">
                <div className="text-xs text-[var(--lg-muted)]">Settled</div>
                <div className="font-mono text-sm font-semibold text-[var(--lg-foreground)] mt-1">
                  {data.closedAgo}
                </div>
              </Glass>
            </div>

            <Glass className="flex items-center justify-between p-3.5 lg-subcard">
              <div>
                <div className="text-xs text-[var(--lg-muted)]">
                  Solana Transaction Signature
                </div>
                <div className="font-mono text-xs text-[var(--lg-foreground)] mt-0.5">
                  {formatTxSignature(data.txSignature)}
                </div>
              </div>
              <a
                href={data.solscanUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[36px] px-3.5 py-1.5 rounded-full text-xs font-medium text-white flex items-center gap-1.5 transition-opacity hover:opacity-90"
                style={{ backgroundColor: 'var(--lg-fill)' }}
              >
                <span>View on Solscan</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </Glass>
          </div>
        )}

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-2">
          {kind === 'position' && (
            <Button
              variant="filled"
              onClick={() => {
                onSellPosition(data.id);
                onClose();
              }}
              icon={<ArrowUpRight className="w-4 h-4" />}
              className="flex-1"
            >
              Close Position ({data.token})
            </Button>
          )}

          {kind === 'feed' && (
            <Button
              variant="filled"
              tint="#30d158"
              onClick={() => {
                onSnipeToken(data);
                onClose();
              }}
              icon={<ArrowUpRight className="w-4 h-4" />}
              className="flex-1"
            >
              Execute Snipe (0.10 SOL)
            </Button>
          )}

          <Button
            variant="glass"
            destructive
            onClick={() => {
              onBlacklist(data.token, data.fullMint);
              onClose();
            }}
            icon={<Ban className="w-4 h-4" />}
          >
            Blacklist Mint
          </Button>
        </div>
      </div>
    </FluidSheet>
  );
}

interface SmartFilterSheetProps {
  isOpen: boolean;
  activeTab: 'filters' | 'swiftui';
  onChangeTab: (tab: 'filters' | 'swiftui') => void;
  onClose: () => void;
  config: SmartFilterConfig;
  mode: TradingMode;
  onUpdateConfig: (next: SmartFilterConfig) => void;
  onSimulatePool: (preset: 'pass' | 'low_liq' | 'high_holder') => void;
}

export function SmartFilterSheet({
  isOpen,
  activeTab,
  onChangeTab,
  onClose,
  config,
  mode,
  onUpdateConfig,
  onSimulatePool,
}: SmartFilterSheetProps) {
  const [copiedCode, setCopiedCode] = useState(false);

  const swiftCode = generateSwiftUICode(config, mode);

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(swiftCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <FluidSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Smart Filter Policy & SwiftUI Source"
      subtitle="Configure automated execution rules or inspect native SwiftUI code"
    >
      {/* Genuine Glisse SegmentedControl with lens-lifting physics */}
      <div className="flex justify-center">
        <SegmentedControl
          aria-label="Smart Filter Sheet Mode"
          className="lg-segmented-modal"
          value={activeTab}
          onValueChange={(val) => onChangeTab(val as 'filters' | 'swiftui')}
          items={[
            { value: 'filters', label: 'Filter Rules' },
            { value: 'swiftui', label: 'SwiftUI Source' },
          ]}
        />
      </div>

      {activeTab === 'filters' ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Glass className="p-3.5 lg-subcard">
              <div className="flex items-center justify-between text-xs text-[var(--lg-muted)] mb-1">
                <span>Min Pool Liquidity (SOL)</span>
                <span className="font-mono tabular-nums font-semibold text-[var(--lg-foreground)]">
                  {config.minLiquiditySol.toFixed(1)} SOL
                </span>
              </div>
              <Slider
                aria-label="Min Pool Liquidity (SOL)"
                min={0.5}
                max={30}
                step={0.5}
                value={config.minLiquiditySol}
                onValueChange={(val) =>
                  onUpdateConfig({
                    ...config,
                    minLiquiditySol: val,
                  })
                }
              />
            </Glass>

            <Glass className="p-3.5 lg-subcard">
              <div className="flex items-center justify-between text-xs text-[var(--lg-muted)] mb-1">
                <span>Max Top Holder Share (%)</span>
                <span className="font-mono tabular-nums font-semibold text-[var(--lg-foreground)]">
                  {config.maxTopHolderPercent.toFixed(0)}%
                </span>
              </div>
              <Slider
                aria-label="Max Top Holder Share (%)"
                min={10}
                max={80}
                step={1}
                value={config.maxTopHolderPercent}
                onValueChange={(val) =>
                  onUpdateConfig({
                    ...config,
                    maxTopHolderPercent: val,
                  })
                }
              />
            </Glass>

            <Glass className="p-3.5 lg-subcard">
              <div className="flex items-center justify-between text-xs text-[var(--lg-muted)] mb-1">
                <span>Take Profit Target (%)</span>
                <span
                  className="font-mono tabular-nums font-semibold"
                  style={{ color: 'var(--lg-on)' }}
                >
                  +{config.takeProfitPercent.toFixed(0)}%
                </span>
              </div>
              <Slider
                aria-label="Take Profit Target (%)"
                min={5}
                max={100}
                step={5}
                value={config.takeProfitPercent}
                onValueChange={(val) =>
                  onUpdateConfig({
                    ...config,
                    takeProfitPercent: val,
                  })
                }
              />
            </Glass>

            <Glass className="p-3.5 lg-subcard">
              <div className="flex items-center justify-between text-xs text-[var(--lg-muted)] mb-1">
                <span>Stop Loss Threshold (%)</span>
                <span
                  className="font-mono tabular-nums font-semibold"
                  style={{ color: 'var(--lg-destructive)' }}
                >
                  -{config.stopLossPercent.toFixed(0)}%
                </span>
              </div>
              <Slider
                aria-label="Stop Loss Threshold (%)"
                min={3}
                max={50}
                step={1}
                value={config.stopLossPercent}
                onValueChange={(val) =>
                  onUpdateConfig({
                    ...config,
                    stopLossPercent: val,
                  })
                }
              />
            </Glass>
          </div>

          {/* Pool Evaluation Simulator */}
          <Glass className="p-4 lg-subcard space-y-3">
            <div className="text-xs font-medium text-[var(--lg-foreground)]">
              Simulate Incoming Liquidity Pool Event
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Button
                variant="glass"
                tint="#30d158"
                onClick={() => onSimulatePool('pass')}
                className="w-full !text-xs !font-semibold"
              >
                + Passing Pool
              </Button>
              <Button
                variant="glass"
                destructive
                onClick={() => onSimulatePool('low_liq')}
                className="w-full !text-xs !font-semibold"
              >
                + Low Liquidity
              </Button>
              <Button
                variant="glass"
                tint="#0091ff"
                onClick={() => onSimulatePool('high_holder')}
                className="w-full !text-xs !font-semibold"
              >
                + Whale Holder
              </Button>
            </div>
          </Glass>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--lg-muted)]">
              Synced with current filter rules &amp; Apple Liquid Glass physics
            </span>
            <Button
              variant="glass"
              onClick={handleCopyCode}
              icon={
                copiedCode ? (
                  <Check className="w-4 h-4" style={{ color: 'var(--lg-on)' }} />
                ) : (
                  <Copy className="w-4 h-4" />
                )
              }
            >
              {copiedCode ? 'Copied SwiftUI' : 'Copy .swift'}
            </Button>
          </div>
          <Glass className="p-4 lg-subcard overflow-x-auto custom-scrollbar max-h-[320px]">
            <pre className="text-[11px] leading-relaxed font-mono text-[var(--lg-foreground)]">
              <code>{swiftCode}</code>
            </pre>
          </Glass>
        </div>
      )}
    </FluidSheet>
  );
}
