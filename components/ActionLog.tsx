
'use client';

import { useEffect, useRef } from 'react';
import type { HandState, Street } from '@/lib/poker/engine';

// English poker street labels
const STREET_EN: Record<Street, string> = {
  preflop: 'Preflop',
  flop: 'Flop',
  turn: 'Turn',
  river: 'River',
};

// English poker action labels
const ACTION_EN: Record<string, string> = {
  sb: 'Small Blind',
  bb: 'Big Blind',
  fold: 'Fold',
  check: 'Check',
  call: 'Call',
  bet: 'Bet',
  raise: 'Raise To',
};

export function ActionLog({
  hand,
  embedded = false,
}: {
  hand: HandState;
  embedded?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  // Automatically scroll to the latest action when the log or board changes.
  useEffect(() => {
    const el = ref.current;

    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [hand.log.length, hand.board.length]);

  return (
    <div
      ref={ref}
      className={`h-full overflow-y-auto p-3 text-xs space-y-1 ${
        embedded
          ? ''
          : 'rounded-2xl bg-surface border border-line'
      }`}
    >
      {/* Current Hand Number */}
      <div className="text-muted mb-2">
        Hand #{hand.handNo}
      </div>

      {/* Poker Action History */}
      {hand.log.map((a, i) => {
        const prevStreet: Street | null =
          i > 0 ? hand.log[i - 1].street : null;

        // Display the street heading when a new betting round begins.
        const header =
          a.street !== prevStreet ? (
            <div className="text-muted/70 font-mono uppercase pt-1.5">
              {STREET_EN[a.street]}
            </div>
          ) : null;

        return (
          <div key={i}>
            {header}

            <div className="flex justify-between gap-2">
              <span className="truncate">
                {a.playerName}{' '}

                <span className="text-muted">
                  {ACTION_EN[a.type] ?? a.type}
                  {a.allIn ? ' (All-In)' : ''}
                </span>
              </span>

              {a.amount > 0 && (
                <span className="font-mono text-muted">
                  {a.amount}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
