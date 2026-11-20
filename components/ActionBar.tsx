
'use client';

import { useMemo, useState } from 'react';
import type { HandState } from '@/lib/poker/engine';
import { legalActions, potTotal } from '@/lib/poker/engine';
import type { PlayerAction } from '@/lib/poker/engine';
import type { HeroRead } from '@/lib/drama';

export function ActionBar({
  hand,
  onAction,
  heroRead,
}: {
  hand: HandState;
  onAction: (a: PlayerAction) => void;
  heroRead?: HeroRead | null;
}) {
  const heroIdx = hand.players.findIndex((p) => p.isHero);
  const isHeroTurn = hand.toAct === heroIdx && !hand.result;
  const la = isHeroTurn ? legalActions(hand) : null;
  const pot = potTotal(hand);

  const [raiseTo, setRaiseTo] = useState(0);

  // Reset the slider during rendering when the game state changes.
  // Uses React's recommended reset-key pattern to avoid cascading effect renders.
  const resetKey = `${hand.handNo}:${hand.street}:${hand.currentBet}:${isHeroTurn}`;
  const [lastResetKey, setLastResetKey] = useState('');

  if (lastResetKey !== resetKey) {
    setLastResetKey(resetKey);
    if (la?.canRaise) setRaiseTo(la.minRaiseTo);
  }

  const quickSizes = useMemo(() => {
    if (!la?.canRaise) return [];

    const toCall = la.callAmount;
    const potAfterCall = pot + toCall;

    const mk = (label: string, to: number) => ({
      label,
      to: Math.max(
        la.minRaiseTo,
        Math.min(la.maxRaiseTo, Math.round(to))
      ),
    });

    const base = hand.currentBet;

    const sizes = [
      mk('Min', la.minRaiseTo),
      mk('1/3 Pot', base + potAfterCall / 3),
      mk('1/2 Pot', base + potAfterCall / 2),
      mk('2/3 Pot', base + (potAfterCall * 2) / 3),
      mk('Pot', base + potAfterCall),
      mk('All-In', la.maxRaiseTo),
    ];

    const seen = new Set<number>();

    return sizes.filter((s) => {
      if (seen.has(s.to)) return false;
      seen.add(s.to);
      return true;
    });
  }, [la, pot, hand.currentBet]);

  // Both states use the same fixed height to prevent layout shifts.
  if (!isHeroTurn || !la) {
    return (
      <div className="h-[176px] sm:h-[124px] flex items-center justify-center text-sm text-muted">
        {hand.result
          ? 'Hand Complete'
          : hand.runout
            ? 'Dealing Cards...'
            : 'Waiting for Opponent...'}
      </div>
    );
  }

  const potOdds =
    la.callAmount > 0
      ? (la.callAmount / (pot + la.callAmount)) * 100
      : 0;

  const bb = hand.bb;

  const fillPct = la.canRaise
    ? ((raiseTo - la.minRaiseTo) /
        Math.max(1, la.maxRaiseTo - la.minRaiseTo)) *
      100
    : 0;

  return (
    <div className="h-[176px] sm:h-[124px] flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-7 px-4 max-w-[1100px] mx-auto">

      {/* Hand Strength Indicator and Pot Odds Information */}
      <div className="text-xs text-muted font-mono whitespace-nowrap order-first sm:order-none flex flex-col gap-1 items-center sm:items-end">
        {heroRead && (
          <span>
            <span className="text-foreground/90">
              {heroRead.madeName}
            </span>
            {' '}· Equity vs. Range{' '}
            <span
              className="font-semibold"
              style={{
                color:
                  heroRead.equity >= 0.5
                    ? 'var(--accent)'
                    : 'var(--foreground)',
              }}
            >
              ~{(heroRead.equity * 100).toFixed(0)}%
            </span>
          </span>
        )}

        {la.callAmount > 0 ? (
          <span>
            To Call{' '}
            <span className="text-foreground">
              {la.callAmount}
            </span>
            {' '}· Pot{' '}
            <span className="text-foreground">
              {pot}
            </span>
            {' '}(Required Equity{' '}
            <span className="text-accent">
              {potOdds.toFixed(1)}%
            </span>
            )
          </span>
        ) : (
          <span>
            Pot{' '}
            <span className="text-foreground">
              {pot}
            </span>
            , Check Available
          </span>
        )}
      </div>

      {/* Primary Poker Actions */}
      <div className="flex items-center gap-2.5">
        {la.canFold && (
          <button
            onClick={() => onAction({ type: 'fold' })}
            className="px-6 py-3 rounded-full text-sm font-medium glass text-muted hover:text-[var(--loss)] hover:shadow-[0_0_0_1px_var(--loss)] active:scale-[0.97] transition-all"
          >
            Fold
          </button>
        )}

        {la.canCheck ? (
          <button
            onClick={() => onAction({ type: 'check' })}
            className="px-6 py-3 rounded-full text-sm font-medium glass hover:shadow-[0_0_0_1px_rgb(255_255_255/0.3)] active:scale-[0.97] transition-all"
          >
            Check
          </button>
        ) : (
          <button
            onClick={() => onAction({ type: 'call' })}
            className="px-6 py-3 rounded-full text-sm font-medium glass hover:text-accent hover:shadow-[0_0_0_1px_var(--accent)] active:scale-[0.97] transition-all"
          >
            Call{' '}
            <span className="font-mono">
              {la.callAmount}
            </span>
          </button>
        )}

        {la.canRaise && (
          <button
            onClick={() =>
              onAction({ type: 'raise', to: raiseTo })
            }
            className="btn-primary px-7 py-3 text-sm"
          >
            {la.isBet ? 'Bet' : 'Raise To'}{' '}
            <span className="font-mono">
              {raiseTo}
            </span>
          </button>
        )}
      </div>

      {/* Quick Bet and Raise Size Selection */}
      {la.canRaise && (
        <div className="flex flex-col gap-2 w-full sm:w-auto max-w-[380px]">

          <div className="flex gap-1 flex-wrap justify-center">
            {quickSizes.map((s) => (
              <button
                key={s.label}
                data-on={raiseTo === s.to}
                onClick={() => setRaiseTo(s.to)}
                className="seg px-2.5 py-1 text-[11px]"
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2.5">
            <input
              type="range"
              min={la.minRaiseTo}
              max={la.maxRaiseTo}
              step={Math.max(1, Math.floor(bb / 2))}
              value={raiseTo}
              onChange={(e) =>
                setRaiseTo(Number(e.target.value))
              }
              className="bet-slider w-full sm:w-48"
              style={{
                ['--fill' as never]: `${fillPct}%`,
              }}
              aria-label="Raise Amount"
            />

            <span className="font-mono text-xs text-muted w-16 text-right">
              {(raiseTo / bb).toFixed(1)} BB
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
