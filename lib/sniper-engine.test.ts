import test from 'node:test';
import assert from 'node:assert/strict';
import {
  INITIAL_DASHBOARD_STATE,
  projectMomentum,
  rubberband,
  calculateRelativeVelocity,
  formatElapsedTime,
  formatTxSignature,
  evaluateTokenCandidate,
  closeOpenPosition,
  blacklistToken,
  generateSwiftUICode,
} from './sniper-engine';

test('formatElapsedTime and formatTxSignature format strings accurately', () => {
  assert.equal(formatElapsedTime(12 * 60 + 34), '00:12:34');
  assert.equal(formatElapsedTime(3661), '01:01:01');
  assert.equal(formatElapsedTime(0), '00:00:00');
  assert.equal(
    formatTxSignature('5xK9mN2pQr7St4Uv8Wx1Yz3Bc6De9Fg2Hj4Kl8mPq1'),
    '5xK9...mPq1'
  );
});

test('Apple Fluid Interface physics: projectMomentum & rubberband behave continuously', () => {
  const projectedDown = projectMomentum(1200, 0.998);
  assert.ok(projectedDown > 500, 'positive flick velocity projects downward endpoint');

  const projectedUp = projectMomentum(-1200, 0.998);
  assert.equal(projectedUp, -projectedDown, 'projection is symmetric');

  const rbSmall = rubberband(20, 400, 0.55);
  const rbLarge = rubberband(200, 400, 0.55);
  assert.ok(rbSmall > 0 && rbSmall < 20, 'rubberband resists movement past boundary');
  assert.ok(rbLarge > rbSmall && rbLarge < 200, 'rubberband resistance increases progressively');

  const relVel = calculateRelativeVelocity(50, 50, 150);
  assert.equal(relVel, 0.5);
});

test('evaluateTokenCandidate enforces Smart Filter rules accurately', () => {
  const config = INITIAL_DASHBOARD_STATE.filterConfig;

  const lowLiq = evaluateTokenCandidate(
    {
      liquiditySol: 0.02,
      topHolderPercent: 15,
      curveSol: 10,
      hasBondingCurve: true,
      curveComplete: false,
    },
    config
  );
  assert.equal(lowLiq.result, 'Skip');
  assert.equal(lowLiq.reason, 'liquidity too low (0.02 SOL)');

  const highHolder = evaluateTokenCandidate(
    {
      liquiditySol: 12,
      topHolderPercent: 76.2,
      curveSol: 12,
      hasBondingCurve: true,
      curveComplete: false,
    },
    config
  );
  assert.equal(highHolder.result, 'Skip');
  assert.equal(highHolder.reason, 'top holder 76.2%');

  const passed = evaluateTokenCandidate(
    {
      liquiditySol: 18.5,
      topHolderPercent: 14.0,
      curveSol: 18.5,
      hasBondingCurve: true,
      curveComplete: false,
    },
    config
  );
  assert.equal(passed.result, 'PASS');
  assert.equal(passed.reason, 'all filters passed');
});

test('Recent Trades history includes Solscan transaction links and P&L percentages', () => {
  assert.ok(INITIAL_DASHBOARD_STATE.closedTrades.length >= 6);
  for (const trade of INITIAL_DASHBOARD_STATE.closedTrades) {
    assert.ok(trade.solscanUrl.startsWith('https://solscan.io/tx/'));
    assert.ok(trade.txSignature.length > 12);
    assert.equal(typeof trade.pnlPercent, 'number');
  }
});

test('closeOpenPosition moves position to closedTrades with Solscan link and updates balance', () => {
  const next = closeOpenPosition(INITIAL_DASHBOARD_STATE, 'pos-1', 'SL');
  assert.equal(next.openPositions.length, 4);
  assert.equal(next.closedTrades.length, INITIAL_DASHBOARD_STATE.closedTrades.length + 1);
  assert.equal(next.closedTradesCount, 1);
  assert.equal(next.balanceSol, 9.58);
  assert.equal(next.realizedPnlSol, -0.02);
  assert.ok(next.closedTrades[0].solscanUrl.startsWith('https://solscan.io/tx/'));
});

test('blacklistToken increments blacklist counter and closes open position if matching', () => {
  const pos = INITIAL_DASHBOARD_STATE.openPositions[0];
  const next = blacklistToken(INITIAL_DASHBOARD_STATE, pos.token, pos.fullMint);
  assert.equal(next.blacklistedCount, 1);
  assert.ok(next.blacklistedMints.includes(pos.fullMint));
  assert.equal(next.openPositions.length, 4);
});

test('generateSwiftUICode includes live filter configuration', () => {
  const code = generateSwiftUICode(INITIAL_DASHBOARD_STATE.filterConfig, 'PAPER');
  assert.ok(code.includes('struct SolanaSniperDashboardView: View'));
  assert.ok(code.includes('Min Liquidity: 5.0 SOL'));
});
