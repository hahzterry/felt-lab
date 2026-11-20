
'use client';

import { CheckCircle, Lightbulb } from '@phosphor-icons/react';
import type { DecisionPoint } from '@/lib/drama';

// Detailed decision-by-decision hand review:
// Analyze the situation, opponent's possible hands,
// equity calculations, and the coach's recommendation
// compared with the player's actual decision.

export function DecisionReview({
  decisions,
}: {
  decisions: DecisionPoint[];
}) {
  // Hide the review when no decisions are available.
  if (!decisions.length) return null;

  return (
    <div className="space-y-2">
      {decisions.map((d, i) => (
        <div
          key={i}
          className="rounded-xl bg-background/40 border border-line p-2.5 space-y-1.5"
        >
          {/* Betting Round, Community Cards, and Pot Size */}
          <div className="flex items-center gap-2 text-[11px]">
            <span className="font-mono text-accent">
              {d.street}
            </span>

            {d.boardText !== '(尚未发牌)' && (
              <span className="font-mono text-foreground/80">
                {d.boardText}
              </span>
            )}

            <span className="font-mono text-muted ml-auto">
              Pot {d.potBB.toFixed(1)} BB
            </span>
          </div>

          {/* Current Decision Situation */}
          <p className="text-xs text-foreground/90">
            {d.facingText}
          </p>

          {/* Opponent's Possible Hand Range */}
          {d.villainName && d.villainClasses.length > 0 && (
            <p className="text-[11px] leading-relaxed">
              <span className="text-muted">
                {d.villainName} Possible Hands:{' '}
              </span>

              <span className="font-mono text-foreground/85">
                {d.villainClasses.join(' ')}
              </span>

              <span className="text-muted">
                {' '}(Approximately {d.villainSharePct.toFixed(0)}% of Starting Hands)
              </span>
            </p>
          )}

          {/* Player Equity and Required Calling Equity */}
          <p className="text-[11px] font-mono text-muted">
            Your Equity ~{d.heroEquityPct.toFixed(0)}%

            {d.neededPct !== null && (
              <>
                {' '}· Required to Call {d.neededPct.toFixed(0)}%
              </>
            )}
          </p>

          {/* Coach's Recommended Action */}
          <div className="flex items-start gap-1.5 text-[11px] leading-relaxed">
            <Lightbulb
              size={12}
              className="text-accent shrink-0 mt-0.5"
              weight="fill"
            />

            <span>
              <span className="text-accent">
                Coach: {d.adviceAction}
              </span>

              <span className="text-muted">
                {' '}({d.adviceReason})
              </span>
            </span>
          </div>

          {/* Player's Actual Decision and Coach Comparison */}
          {d.actualAction && (
            <div className="flex items-center gap-1.5 text-[11px]">
              <span className="text-muted">
                Your Decision: {d.actualAction}
              </span>

              {d.agree ? (
                <CheckCircle
                  size={13}
                  weight="fill"
                  className="text-accent"
                />
              ) : (
                <span className="text-[10px] px-1.5 py-px rounded-full border border-[#cdaa6d]/60 text-[#cdaa6d]">
                  Different from Coach
                </span>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
