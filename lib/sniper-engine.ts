export type TradingMode = 'PAPER' | 'LIVE';

export interface OpenPosition {
  id: string;
  token: string;
  fullMint: string;
  name: string;
  monogram: string;
  age: string;
  ageSeconds: number;
  costSol: number;
  multiplier: number;
  pnlPercent: number;
  liquiditySol: number;
  topHolderPercent: number;
}

export interface TokenFeedItem {
  id: string;
  token: string;
  fullMint: string;
  name: string;
  monogram: string;
  result: 'Skip' | 'PASS';
  reason: string;
  age: string;
  ageSeconds: number;
  liquiditySol: number;
  topHolderPercent: number;
  curveSol: number;
}

export interface ClosedTrade {
  id: string;
  token: string;
  fullMint: string;
  name: string;
  monogram: string;
  pnlPercent: number;
  pnlSol: number;
  entrySol: number;
  exitSol: number;
  exitType: 'TP' | 'SL' | 'MANUAL';
  closedAgo: string;
  txSignature: string;
  solscanUrl: string;
  executionMs: number;
}

export interface SkipReasonStat {
  id: string;
  reason: string;
  count: number;
  sharePercent: number;
  category: 'liquidity' | 'passed' | 'curve' | 'holder' | 'late';
}

export interface BotLogEntry {
  id: string;
  time: string;
  type: 'error' | 'skip' | 'buy' | 'pass' | 'info';
  message: string;
}

export interface SmartFilterConfig {
  minLiquiditySol: number;
  maxTopHolderPercent: number;
  maxCurveSol: number;
  requireBondingCurve: boolean;
  buySizeSol: number;
  takeProfitPercent: number;
  stopLossPercent: number;
}

export interface SniperDashboardState {
  mode: TradingMode;
  botActive: boolean;
  elapsedSeconds: number;
  balanceSol: number;
  netPnlSol: number;
  realizedPnlSol: number;
  closedTradesCount: number;
  winRatePercent: number;
  tokensSeenCount: number;
  passedFiltersCount: number;
  blacklistedCount: number;
  blacklistedMints: string[];
  openPositions: OpenPosition[];
  tokenFeed: TokenFeedItem[];
  closedTrades: ClosedTrade[];
  skipReasons: SkipReasonStat[];
  botLogs: BotLogEntry[];
  filterConfig: SmartFilterConfig;
}

/**
 * Apple WWDC 2018 "Designing Fluid Interfaces" momentum projection formula:
 * Projects where a gesture will come to rest based on initial velocity (px/s) and deceleration rate.
 */
export function projectMomentum(
  initialVelocityPxPerSec: number,
  decelerationRate = 0.998
): number {
  if (!Number.isFinite(initialVelocityPxPerSec) || decelerationRate >= 1 || decelerationRate <= 0) {
    return 0;
  }
  return ((initialVelocityPxPerSec / 1000) * decelerationRate) / (1 - decelerationRate);
}

/**
 * Apple rubber-banding formula for soft boundary resistance:
 * Progressively resists movement past an edge so the UI never feels frozen.
 */
export function rubberband(
  overshoot: number,
  dimension: number,
  constant = 0.55
): number {
  if (dimension <= 0 || overshoot === 0) return 0;
  const sign = overshoot < 0 ? -1 : 1;
  const absOvershoot = Math.abs(overshoot);
  const damped = (absOvershoot * dimension * constant) / (dimension + constant * absOvershoot);
  return sign * damped;
}

/**
 * Normalizes gesture release velocity to relative spring velocity when handing off to a spring.
 */
export function calculateRelativeVelocity(
  gestureVelocity: number,
  currentValue: number,
  targetValue: number
): number {
  const distance = targetValue - currentValue;
  if (Math.abs(distance) < 0.001) return 0;
  return gestureVelocity / distance;
}

/**
 * Formats elapsed seconds as HH:MM:SS (e.g. 754 -> "00:12:34").
 */
export function formatElapsedTime(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  return [hours, minutes, seconds]
    .map((v) => String(v).padStart(2, '0'))
    .join(':');
}

/**
 * Formats a full Solana transaction signature into a concise display label (e.g. "5xK9...8mPq").
 */
export function formatTxSignature(signature: string): string {
  if (signature.length <= 10) return signature;
  return `${signature.slice(0, 4)}...${signature.slice(-4)}`;
}

/**
 * Evaluates a candidate token against the user's Smart Filter rules.
 */
export function evaluateTokenCandidate(
  candidate: {
    liquiditySol: number;
    topHolderPercent: number;
    curveSol: number;
    hasBondingCurve: boolean;
    curveComplete: boolean;
  },
  config: SmartFilterConfig
): { result: 'Skip' | 'PASS'; reason: string; category: SkipReasonStat['category'] } {
  if (!candidate.hasBondingCurve) {
    return { result: 'Skip', reason: 'no bonding curve', category: 'curve' };
  }
  if (candidate.curveComplete) {
    return { result: 'Skip', reason: 'curve already complete', category: 'curve' };
  }
  if (candidate.liquiditySol < config.minLiquiditySol) {
    return {
      result: 'Skip',
      reason: `liquidity too low (${candidate.liquiditySol.toFixed(2)} SOL)`,
      category: 'liquidity',
    };
  }
  if (candidate.topHolderPercent > config.maxTopHolderPercent) {
    return {
      result: 'Skip',
      reason: `top holder ${candidate.topHolderPercent.toFixed(1)}%`,
      category: 'holder',
    };
  }
  if (candidate.curveSol > config.maxCurveSol) {
    return {
      result: 'Skip',
      reason: `too late (${candidate.curveSol.toFixed(2)} SOL in curve)`,
      category: 'late',
    };
  }
  return {
    result: 'PASS',
    reason: 'all filters passed',
    category: 'passed',
  };
}

/**
 * Closes an open position and updates portfolio balances, recent trades history, win rate, and bot log.
 */
export function closeOpenPosition(
  state: SniperDashboardState,
  positionId: string,
  exitReason: 'TP' | 'SL' | 'MANUAL' = 'MANUAL'
): SniperDashboardState {
  const pos = state.openPositions.find((p) => p.id === positionId);
  if (!pos) return state;

  const remainingPositions = state.openPositions.filter((p) => p.id !== positionId);
  const tradePnlSol = Number((pos.costSol * (pos.pnlPercent / 100)).toFixed(3));
  const returnedSol = Number((pos.costSol + tradePnlSol).toFixed(3));

  const newBalanceSol = Number((state.balanceSol + returnedSol).toFixed(3));
  const newRealizedPnlSol = Number((state.realizedPnlSol + tradePnlSol).toFixed(3));
  const unrealizedPnlSol = remainingPositions.reduce(
    (acc, item) => acc + item.costSol * (item.pnlPercent / 100),
    0
  );
  const newNetPnlSol = Number((newRealizedPnlSol + unrealizedPnlSol).toFixed(3));

  const resolvedExitType: ClosedTrade['exitType'] =
    exitReason !== 'MANUAL' ? exitReason : pos.pnlPercent >= 0 ? 'TP' : 'SL';

  const generatedSig = `5xK9${pos.fullMint.slice(0, 28)}8mPq9vLz2Rt4`;

  const newClosedTrade: ClosedTrade = {
    id: `closed-${Date.now()}-${pos.id}`,
    token: pos.token,
    fullMint: pos.fullMint,
    name: pos.name,
    monogram: pos.monogram,
    pnlPercent: pos.pnlPercent,
    pnlSol: tradePnlSol,
    entrySol: pos.costSol,
    exitSol: returnedSol,
    exitType: resolvedExitType,
    closedAgo: 'just now',
    txSignature: generatedSig,
    solscanUrl: `https://solscan.io/tx/${generatedSig}`,
    executionMs: 38,
  };

  const updatedClosedTrades = [newClosedTrade, ...state.closedTrades];
  const newClosedTradesCount = state.closedTradesCount + 1;
  const totalWins = updatedClosedTrades.filter((t) => t.pnlPercent > 0).length;
  const newWinRatePercent = Math.round((totalWins / updatedClosedTrades.length) * 100);

  const newLog: BotLogEntry = {
    id: `log-${Date.now()}`,
    time: '1s',
    type: pos.pnlPercent >= 0 ? 'pass' : 'info',
    message: `${state.mode} SELL ${pos.token} (${pos.pnlPercent >= 0 ? '+' : ''}${pos.pnlPercent.toFixed(1)}% / ${returnedSol.toFixed(3)} SOL) tx: ${formatTxSignature(generatedSig)}`,
  };

  return {
    ...state,
    balanceSol: newBalanceSol,
    realizedPnlSol: newRealizedPnlSol,
    netPnlSol: newNetPnlSol,
    closedTradesCount: newClosedTradesCount,
    winRatePercent: newWinRatePercent,
    openPositions: remainingPositions,
    closedTrades: updatedClosedTrades,
    botLogs: [newLog, ...state.botLogs],
  };
}

/**
 * Blacklists a token mint, removing any active position and incrementing blacklisted count.
 */
export function blacklistToken(
  state: SniperDashboardState,
  tokenLabel: string,
  fullMint: string
): SniperDashboardState {
  if (state.blacklistedMints.includes(fullMint)) {
    return state;
  }
  const hasOpen = state.openPositions.find((p) => p.fullMint === fullMint || p.token === tokenLabel);
  const afterClose = hasOpen ? closeOpenPosition(state, hasOpen.id, 'SL') : state;

  const logEntry: BotLogEntry = {
    id: `log-bl-${Date.now()}`,
    time: '1s',
    type: 'error',
    message: `Blacklisted mint ${tokenLabel} — future pools blocked`,
  };

  return {
    ...afterClose,
    blacklistedCount: afterClose.blacklistedCount + 1,
    blacklistedMints: [...afterClose.blacklistedMints, fullMint],
    botLogs: [logEntry, ...afterClose.botLogs],
  };
}

/**
 * Institutional initial snapshot for the Solana Sniper terminal.
 */
export const INITIAL_DASHBOARD_STATE: SniperDashboardState = {
  mode: 'PAPER',
  botActive: true,
  elapsedSeconds: 12 * 60 + 34, // 00:12:34
  balanceSol: 9.5,
  netPnlSol: -0.5,
  realizedPnlSol: 0.0,
  closedTradesCount: 0,
  winRatePercent: 0,
  tokensSeenCount: 23,
  passedFiltersCount: 5,
  blacklistedCount: 0,
  blacklistedMints: [],
  filterConfig: {
    minLiquiditySol: 5.0,
    maxTopHolderPercent: 35.0,
    maxCurveSol: 50.0,
    requireBondingCurve: true,
    buySizeSol: 0.1,
    takeProfitPercent: 15.0,
    stopLossPercent: 10.0,
  },
  openPositions: [
    {
      id: 'pos-1',
      token: 'FhZ...qnh',
      fullMint: 'FhZ9xKp7LmN4vQr8Ts2Uw5Xy8Za1Bc3De5Fg7Hqnh',
      name: 'Solaris Index',
      monogram: 'FH',
      age: '1m',
      ageSeconds: 60,
      costSol: 0.1,
      multiplier: 0.8,
      pnlPercent: -20.0,
      liquiditySol: 14.2,
      topHolderPercent: 18.4,
    },
    {
      id: 'pos-2',
      token: '9Z2Q...pump',
      fullMint: '9Z2QvBn8MkL3pRt6Wy9Xc2Vf5Hj8Kl1Nm4Qp7Spump',
      name: 'ZeroQuant',
      monogram: '9Z',
      age: '2m',
      ageSeconds: 120,
      costSol: 0.1,
      multiplier: 0.97,
      pnlPercent: -3.0,
      liquiditySol: 22.8,
      topHolderPercent: 14.1,
    },
    {
      id: 'pos-3',
      token: 'A5VD...pump',
      fullMint: 'A5VDkLp9Mn2Qr4St7Uv1Wx3Yz6Bc8De2Fg5Hjpump',
      name: 'Aether Vector',
      monogram: 'A5',
      age: '3m',
      ageSeconds: 180,
      costSol: 0.1,
      multiplier: 0.97,
      pnlPercent: -3.0,
      liquiditySol: 19.5,
      topHolderPercent: 21.0,
    },
    {
      id: 'pos-4',
      token: '6BcC...pump',
      fullMint: '6BcCmNq2Pr5St8Vw1Xy4Za7Bc9De3Fg6Hj8Klpump',
      name: 'Basis Core',
      monogram: '6B',
      age: '3m',
      ageSeconds: 195,
      costSol: 0.1,
      multiplier: 0.97,
      pnlPercent: -3.0,
      liquiditySol: 31.0,
      topHolderPercent: 12.6,
    },
    {
      id: 'pos-5',
      token: 'iK2i...pump',
      fullMint: 'iK2iLp7Mn9Qr2St5Vw8Xy1Za4Bc7De9Fg3Hjpump',
      name: 'Kinetix Protocol',
      monogram: 'IK',
      age: '4m',
      ageSeconds: 240,
      costSol: 0.1,
      multiplier: 0.81,
      pnlPercent: -19.0,
      liquiditySol: 11.4,
      topHolderPercent: 27.5,
    },
  ],
  tokenFeed: [
    {
      id: 'feed-1',
      token: 'FfZz...Mb6l',
      fullMint: 'FfZzM8pL2nQ5rT9vW1xY4zA7bC3dE6fG8hJ1Mb6l',
      name: 'Flux Pool',
      monogram: 'FF',
      result: 'Skip',
      reason: 'liquidity too low (0.00 SOL)',
      age: '34s',
      ageSeconds: 34,
      liquiditySol: 0.0,
      topHolderPercent: 45.0,
      curveSol: 0.0,
    },
    {
      id: 'feed-2',
      token: '8L9H...pump',
      fullMint: '8L9H13kM4nP7qR2sT5uV8wX1yZ4aB7cD9eF2pump',
      name: 'Lattice Node',
      monogram: '8L',
      result: 'Skip',
      reason: 'liquidity too low (0.02 SOL)',
      age: '35s',
      ageSeconds: 35,
      liquiditySol: 0.02,
      topHolderPercent: 38.0,
      curveSol: 0.02,
    },
    {
      id: 'feed-3',
      token: 'Am7N...pump',
      fullMint: 'Am7Nvw9Kp2Lm5Qr8St1Uv4Wx7Yz2Bc5De8Fgpump',
      name: 'Amplitude',
      monogram: 'AM',
      result: 'Skip',
      reason: 'top holder 76.2%',
      age: '1m',
      ageSeconds: 60,
      liquiditySol: 12.4,
      topHolderPercent: 76.2,
      curveSol: 12.4,
    },
    {
      id: 'feed-4',
      token: '4wQ3...1cqq',
      fullMint: '4wQ3n3Lm7Kp9Qr2St5Uv8Wx1Yz4Bc7De9Fg1cqq',
      name: 'Quorum V4',
      monogram: '4W',
      result: 'Skip',
      reason: 'too late (99.98 SOL in curve)',
      age: '1m',
      ageSeconds: 65,
      liquiditySol: 99.98,
      topHolderPercent: 19.2,
      curveSol: 99.98,
    },
    {
      id: 'feed-5',
      token: 'So11...1112',
      fullMint: 'So11111111111111111111111111111111111111112',
      name: 'Wrapped SOL Pool',
      monogram: 'SO',
      result: 'Skip',
      reason: 'no bonding curve',
      age: '1m',
      ageSeconds: 72,
      liquiditySol: 42.0,
      topHolderPercent: 11.0,
      curveSol: 0,
    },
    {
      id: 'feed-6',
      token: 'F9bL...ghhh',
      fullMint: 'F9bLVw2Kp5Lm8Qr1St4Uv7Wx9Yz3Bc6De8Fgghhh',
      name: 'Fibre Network',
      monogram: 'F9',
      result: 'PASS',
      reason: 'all filters passed',
      age: '1m',
      ageSeconds: 80,
      liquiditySol: 18.5,
      topHolderPercent: 16.4,
      curveSol: 18.5,
    },
    {
      id: 'feed-7',
      token: 'iYCR...LNXU',
      fullMint: 'iYCR9Kp3Lm6Qr9St2Uv5Wx8Yz1Bc4De7FgLNXU',
      name: 'Yield Core',
      monogram: 'IY',
      result: 'Skip',
      reason: 'liquidity too low (0.00 SOL)',
      age: '2m',
      ageSeconds: 120,
      liquiditySol: 0.0,
      topHolderPercent: 50.0,
      curveSol: 0.0,
    },
    {
      id: 'feed-8',
      token: '9Z2Q...pump',
      fullMint: '9Z2QvBn8MkL3pRt6Wy9Xc2Vf5Hj8Kl1Nm4Qp7Spump',
      name: 'ZeroQuant',
      monogram: '9Z',
      result: 'PASS',
      reason: 'all filters passed',
      age: '2m',
      ageSeconds: 125,
      liquiditySol: 22.8,
      topHolderPercent: 14.1,
      curveSol: 22.8,
    },
    {
      id: 'feed-9',
      token: 'FkjiP...pump',
      fullMint: 'FkjiP8Kp1Lm4Qr7St9Uv2Wx5Yz8Bc1De4Fgpump',
      name: 'Falkor Synth',
      monogram: 'FK',
      result: 'Skip',
      reason: 'liquidity too low (0.07 SOL)',
      age: '2m',
      ageSeconds: 135,
      liquiditySol: 0.07,
      topHolderPercent: 44.2,
      curveSol: 0.07,
    },
    {
      id: 'feed-10',
      token: 'J8UA...pump',
      fullMint: 'J8UA4Kp7Lm1Qr4St8Uv2Wx6Yz9Bc3De7Fgpump',
      name: 'Juno Ultra',
      monogram: 'J8',
      result: 'Skip',
      reason: 'curve already complete',
      age: '2m',
      ageSeconds: 145,
      liquiditySol: 85.0,
      topHolderPercent: 9.5,
      curveSol: 85.0,
    },
  ],
  closedTrades: [
    {
      id: 'ct-1',
      token: 'Bip9...pump',
      fullMint: 'Bip9Kp2Lm5Qr8St1Uv4Wx7Yz9Bc3De6Fgpump',
      name: 'Bipedal AI',
      monogram: 'BP',
      pnlPercent: 12.5,
      pnlSol: 0.0125,
      entrySol: 0.1,
      exitSol: 0.1125,
      exitType: 'TP',
      closedAgo: '2m ago',
      txSignature: '5xK9mN2pQr7St4Uv8Wx1Yz3Bc6De9Fg2Hj4Kl8mPq1',
      solscanUrl: 'https://solscan.io/tx/5xK9mN2pQr7St4Uv8Wx1Yz3Bc6De9Fg2Hj4Kl8mPq1',
      executionMs: 34,
    },
    {
      id: 'ct-2',
      token: '5dF2...pump',
      fullMint: '5dF2Kp4Lm7Qr1St5Uv8Wx2Yz6Bc9De3Fgpump',
      name: 'Delta Flow',
      monogram: '5D',
      pnlPercent: 8.7,
      pnlSol: 0.0087,
      entrySol: 0.1,
      exitSol: 0.1087,
      exitType: 'TP',
      closedAgo: '3m ago',
      txSignature: '4vR8kL1nMp6Qr3St7Uv9Wx2Yz5Bc8De1Fg4Hj7vR82',
      solscanUrl: 'https://solscan.io/tx/4vR8kL1nMp6Qr3St7Uv9Wx2Yz5Bc8De1Fg4Hj7vR82',
      executionMs: 41,
    },
    {
      id: 'ct-3',
      token: 'QmT3...pump',
      fullMint: 'QmT3Kp6Lm9Qr2St5Uv8Wx1Yz4Bc7De9Fgpump',
      name: 'Quantum Mesh',
      monogram: 'QM',
      pnlPercent: -3.2,
      pnlSol: -0.0032,
      entrySol: 0.1,
      exitSol: 0.0968,
      exitType: 'SL',
      closedAgo: '4m ago',
      txSignature: '3tN7jK9mLp4Qr2St6Uv8Wx1Yz4Bc7De9Fg3Hj6tN73',
      solscanUrl: 'https://solscan.io/tx/3tN7jK9mLp4Qr2St6Uv8Wx1Yz4Bc7De9Fg3Hj6tN73',
      executionMs: 29,
    },
    {
      id: 'ct-4',
      token: 'KfL8...pump',
      fullMint: 'KfL8Kp1Lm4Qr7St2Uv5Wx8Yz1Bc4De7Fgpump',
      name: 'Krypton Ledger',
      monogram: 'KF',
      pnlPercent: 15.1,
      pnlSol: 0.0151,
      entrySol: 0.1,
      exitSol: 0.1151,
      exitType: 'TP',
      closedAgo: '5m ago',
      txSignature: '2sM6hJ8kLn3Qr1St5Uv7Wx9Yz3Bc6De8Fg2Hj5sM64',
      solscanUrl: 'https://solscan.io/tx/2sM6hJ8kLn3Qr1St5Uv7Wx9Yz3Bc6De8Fg2Hj5sM64',
      executionMs: 31,
    },
    {
      id: 'ct-5',
      token: 'N3pQ...pump',
      fullMint: 'N3pQKp3Lm6Qr9St2Uv5Wx8Yz1Bc4De7Fgpump',
      name: 'Nexus Pulse',
      monogram: 'N3',
      pnlPercent: -7.4,
      pnlSol: -0.0074,
      entrySol: 0.1,
      exitSol: 0.0926,
      exitType: 'SL',
      closedAgo: '6m ago',
      txSignature: '6wP1gH7jKm2Qr9St4Uv6Wx8Yz2Bc5De7Fg1Hj4wP15',
      solscanUrl: 'https://solscan.io/tx/6wP1gH7jKm2Qr9St4Uv6Wx8Yz2Bc5De7Fg1Hj4wP15',
      executionMs: 45,
    },
    {
      id: 'ct-6',
      token: 'R7zK...pump',
      fullMint: 'R7zKKp5Lm8Qr1St4Uv7Wx9Yz2Bc5De8Fgpump',
      name: 'Raptor Zero',
      monogram: 'R7',
      pnlPercent: 11.8,
      pnlSol: 0.0118,
      entrySol: 0.1,
      exitSol: 0.1118,
      exitType: 'TP',
      closedAgo: '7m ago',
      txSignature: '8yT3fG6hJk1Qr8St3Uv5Wx7Yz1Bc4De6Fg9Hj3yT36',
      solscanUrl: 'https://solscan.io/tx/8yT3fG6hJk1Qr8St3Uv5Wx7Yz1Bc4De6Fg9Hj3yT36',
      executionMs: 27,
    },
    {
      id: 'ct-7',
      token: 'Vx9M...pump',
      fullMint: 'Vx9MKp7Lm1Qr4St8Uv2Wx6Yz9Bc3De7Fgpump',
      name: 'Vertex Engine',
      monogram: 'VX',
      pnlPercent: 24.6,
      pnlSol: 0.0246,
      entrySol: 0.1,
      exitSol: 0.1246,
      exitType: 'TP',
      closedAgo: '11m ago',
      txSignature: '9zU4eF5gHj9Qr7St2Uv4Wx6Yz9Bc3De5Fg8Hj2zU47',
      solscanUrl: 'https://solscan.io/tx/9zU4eF5gHj9Qr7St2Uv4Wx6Yz9Bc3De5Fg8Hj2zU47',
      executionMs: 33,
    },
    {
      id: 'ct-8',
      token: 'Lp4Q...pump',
      fullMint: 'Lp4QKp2Lm6Qr9St3Uv7Wx1Yz5Bc8De2Fgpump',
      name: 'Liquid Prime',
      monogram: 'LP',
      pnlPercent: 19.3,
      pnlSol: 0.0193,
      entrySol: 0.1,
      exitSol: 0.1193,
      exitType: 'TP',
      closedAgo: '14m ago',
      txSignature: '7xV2dE4fGh8Qr6St1Uv3Wx5Yz8Bc2De4Fg7Hj1xV28',
      solscanUrl: 'https://solscan.io/tx/7xV2dE4fGh8Qr6St1Uv3Wx5Yz8Bc2De4Fg7Hj1xV28',
      executionMs: 36,
    },
  ],
  skipReasons: [
    {
      id: 'sr-1',
      reason: 'liquidity too low (0.00 SOL)',
      count: 7,
      sharePercent: 39,
      category: 'liquidity',
    },
    {
      id: 'sr-2',
      reason: 'all filters passed',
      count: 5,
      sharePercent: 28,
      category: 'passed',
    },
    {
      id: 'sr-3',
      reason: 'curve already complete',
      count: 2,
      sharePercent: 11,
      category: 'curve',
    },
    {
      id: 'sr-4',
      reason: 'top holder 82.2%',
      count: 1,
      sharePercent: 6,
      category: 'holder',
    },
    {
      id: 'sr-5',
      reason: 'top holder 76.2%',
      count: 1,
      sharePercent: 6,
      category: 'holder',
    },
    {
      id: 'sr-6',
      reason: 'top holder 53.2%',
      count: 1,
      sharePercent: 5,
      category: 'holder',
    },
    {
      id: 'sr-7',
      reason: 'too late (54.20 SOL in curve)',
      count: 1,
      sharePercent: 5,
      category: 'late',
    },
  ],
  botLogs: [
    {
      id: 'log-1',
      time: '11s',
      type: 'error',
      message: 'Position manager: failed to get info about account Bx7XGdGqFf9',
    },
    {
      id: 'log-2',
      time: '24s',
      type: 'skip',
      message: 'skip FfZzM... liquidity too low (0.00 SOL)',
    },
    {
      id: 'log-3',
      time: '39s',
      type: 'skip',
      message: 'skip 8L9H13... liquidity too low (0.02 SOL)',
    },
    {
      id: 'log-4',
      time: '1m',
      type: 'skip',
      message: 'skip Am7Nvw... top holder 76.2%',
    },
    {
      id: 'log-5',
      time: '1m',
      type: 'skip',
      message: 'skip 4wQ3n3... too late (99.98 SOL in curve)',
    },
    {
      id: 'log-6',
      time: '1m',
      type: 'skip',
      message: 'skip So11i1... no bonding curve',
    },
    {
      id: 'log-7',
      time: '1m',
      type: 'buy',
      message: 'PAPER BUY P6bWvw... 0.1 SOL',
    },
    {
      id: 'log-8',
      time: '1m',
      type: 'pass',
      message: 'PASS F9bLVw... all filters passed',
    },
  ],
};

/**
 * Generates native iOS 18 / macOS Sequoia SwiftUI source code matching the current live state & filter configuration.
 */
export function generateSwiftUICode(config: SmartFilterConfig, mode: TradingMode): string {
  return `import SwiftUI

// MARK: - Solana Sniper Pro Institutional Terminal (iOS 18 & macOS Sequoia)
// Engineered with Apple Fluid Interface Springs (.spring(response: 0.32, dampingFraction: 0.88))
// & Anodized Titanium Materials (.ultraThinMaterial)

struct SolanaSniperDashboardView: View {
    @State private var tradingMode: String = "${mode}"
    @State private var isBotActive: Bool = true
    @State private var autoScrollLog: Bool = true
    @State private var showSmartFiltersSheet: Bool = false
    @Environment(\\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 14) {
                    // 8-Card Institutional Metric Strip
                    LazyVGrid(columns: [GridItem(.adaptive(minimum: 155), spacing: 10)], spacing: 10) {
                        MetricCell(label: "Paper Balance", value: "9.500 SOL")
                        MetricCell(label: "Net P&L", value: "-0.500 SOL", isNegative: true)
                        MetricCell(label: "Realized P&L", value: "+0.000 SOL", isPositive: true)
                        MetricCell(label: "Closed Trades", value: "0")
                        MetricCell(label: "Win Rate", value: "0%")
                        MetricCell(label: "Tokens Seen", value: "23")
                        MetricCell(label: "Passed Filters", value: "5")
                        MetricCell(label: "Blacklisted", value: "0")
                    }

                    // Filter Engine Summary Row
                    Button {
                        withAnimation(reduceMotion ? .easeInOut(duration: 0.18) : .spring(response: 0.32, dampingFraction: 0.86)) {
                            showSmartFiltersSheet.toggle()
                        }
                    } label: {
                        HStack {
                            VStack(alignment: .leading, spacing: 3) {
                                Text("Smart Filter Policy")
                                    .font(.subheadline.weight(.semibold))
                                    .foregroundStyle(.primary)
                                Text("Min Liquidity: ${config.minLiquiditySol.toFixed(1)} SOL · Max Holder: ${config.maxTopHolderPercent.toFixed(1)}% · TP: +${config.takeProfitPercent.toFixed(0)}%")
                                    .font(.caption.monospacedDigit())
                                    .foregroundStyle(.secondary)
                            }
                            Spacer()
                            Text("Configure")
                                .font(.caption.weight(.medium))
                                .padding(.horizontal, 10)
                                .padding(.vertical, 5)
                                .background(Color.white.opacity(0.08), in: Capsule())
                        }
                        .padding(14)
                        .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
                    }
                    .buttonStyle(FluidPressButtonStyle())
                }
                .padding()
            }
            .background(Color(red: 0.035, green: 0.035, blue: 0.043).ignoresSafeArea())
            .navigationTitle("Solana Sniper")
        }
    }
}

struct FluidPressButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.98 : 1.0)
            .animation(.spring(response: 0.24, dampingFraction: 1.0), value: configuration.isPressed)
    }
}`;
}
