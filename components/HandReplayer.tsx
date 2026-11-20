
'use client';

import { useMemo, useState } from 'react';
import { CaretLeft, CaretRight } from '@phosphor-icons/react';
import type { HandHistory } from '@/lib/poker/history';
import { parseGlyphCards } from '@/lib/poker/history';
import { CardView } from './CardView';
import { Avatar } from './Avatar';

// Hand replayer: mini poker table with a draggable timeline; all hole cards remain visible during review

interface Step {
  desc: string;
  boardCount: number;
  pot: number; // Includes bets from the current street
  bets: Record<string, number>;
  folded: string[];
  stacks: Record<string, number>;
  actorId: string | null;
  isResult: boolean;
  // Hero decision frame: index into hh.decisions for timeline markers and accuracy feedback
  decisionIdx?: number;
}

const STREET_LABEL: Record<string, string> = {
  preflop: 'Preflop',
  flop: 'Flop',
  turn: 'Turn',
  river: 'River',
};

const BOARD_AT: Record<string, number> = {
  preflop: 0,
  flop: 3,
  turn: 4,
  river: 5,
};

function buildSteps(hh: HandHistory): Step[] {
  const raw = hh.rawActions ?? [];
  const bb = hh.bb;
  const nameOf = new Map(hh.players.map((p) => [p.id, p.name]));
  const heroId = hh.players.find((p) => p.isHero)?.id;
  let heroActionCount = 0;
  const steps: Step[] = [];

  let pot = 0;
  let bets: Record<string, number> = {};
  const folded: string[] = [];
  const stacks: Record<string, number> = {};

  for (const p of hh.players) stacks[p.id] = p.startStack;

  let curStreet = 'preflop';
  let boardCount = 0;

  const snap = (
    desc: string,
    actorId: string | null,
    isResult = false
  ): Step => ({
    desc,
    boardCount,
    pot,
    bets: { ...bets },
    folded: [...folded],
    stacks: { ...stacks },
    actorId,
    isResult,
  });

  // Process the opening blinds to establish the initial state.
  let i = 0;

  while (
    i < raw.length &&
    (raw[i].type === 'sb' || raw[i].type === 'bb')
  ) {
    const a = raw[i];
    const pay = a.amount - (bets[a.playerId] ?? 0);

    pot += pay;
    stacks[a.playerId] -= pay;
    bets[a.playerId] = a.amount;
    i++;
  }

  steps.push(snap('Blinds posted, cards dealt', null));

  for (; i < raw.length; i++) {
    const a = raw[i];

    if (a.street !== curStreet) {
      // Move to the next street and reveal new community cards.
      bets = {};
      curStreet = a.street;
      boardCount = BOARD_AT[a.street] ?? boardCount;

      const cards = hh.board
        .split(' ')
        .filter(Boolean)
        .slice(
          a.street === 'flop' ? 0 : boardCount - 1,
          boardCount
        );

      steps.push(
        snap(`Deal ${STREET_LABEL[a.street]} ${cards.join(' ')}`, null)
      );
    }

    const name = nameOf.get(a.playerId) ?? a.playerId;
    let desc: string;

    if (a.type === 'fold') {
      folded.push(a.playerId);
      desc = `${name} folds`;
    } else if (a.type === 'check') {
      desc = `${name} checks`;
    } else {
      const pay = a.amount - (bets[a.playerId] ?? 0);

      pot += pay;
      stacks[a.playerId] -= pay;
      bets[a.playerId] = a.amount;

      desc =
        a.type === 'call'
          ? `${name} calls to ${(a.amount / bb).toFixed(1)}BB`
          : a.type === 'bet'
            ? `${name} bets ${(a.amount / bb).toFixed(1)}BB`
            : `${name} raises to ${(a.amount / bb).toFixed(1)}BB`;
    }

    const step = snap(desc, a.playerId);

    // Hero decision frames match the decisions array in order.
    if (a.playerId === heroId) {
      if (heroActionCount < (hh.decisions?.length ?? 0)) {
        step.decisionIdx = heroActionCount;
      }

      heroActionCount++;
    }

    steps.push(step);
  }

  // All-in runout: betting is complete but not all community cards have been dealt.
  const fullBoard = hh.board.split(' ').filter(Boolean).length;

  while (boardCount < fullBoard) {
    boardCount = boardCount === 0 ? 3 : boardCount + 1;

    if (boardCount > fullBoard) break;

    bets = {};

    const label =
      boardCount === 3
        ? 'Flop'
        : boardCount === 4
          ? 'Turn'
          : 'River';

    steps.push(snap(`Deal ${label}`, null));
  }

  // Final result step.
  bets = {};

  const winners = hh.results.filter((r) => r.net > 0);

  for (const r of winners) {
    const p = hh.players.find((x) => x.name === r.name);

    if (p) stacks[p.id] = p.startStack + r.net;
  }

  for (const r of hh.results.filter((x) => x.net < 0)) {
    const p = hh.players.find((x) => x.name === r.name);

    if (p) stacks[p.id] = p.startStack + r.net;
  }

  steps.push({
    desc: `Result: ${
      winners
        .map(
          (r) =>
            `${r.name} +${(r.net / hh.bb).toFixed(1)}BB`
        )
        .join(', ') || 'Hand complete'
    }`,
    boardCount: fullBoard,
    pot: hh.potSize,
    bets: {},
    folded,
    stacks: { ...stacks },
    actorId: null,
    isResult: true,
  });

  return steps;
}

function seatAngle(i: number, total: number): number {
  return 90 + (360 * i) / total;
}

// Three decision ratings:
// Green = agrees with coach.
// Yellow = borderline decision.
// Red = clear deviation.

type Verdict = 'good' | 'edge' | 'bad';

function verdictOf(
  d: NonNullable<HandHistory['decisions']>[number]
): Verdict {
  if (d.agree) return 'good';

  // A decision is borderline if the equity difference is
  // within five percentage points or no call is required.
  if (d.neededPct === null) return 'edge';

  if (
    Math.abs(d.heroEquityPct - d.neededPct) <= 5
  ) {
    return 'edge';
  }

  return 'bad';
}

const VERDICT_UI: Record<
  Verdict,
  { label: string; color: string; border: string }
> = {
  good: {
    label: '✓ Correct',
    color: 'var(--accent)',
    border: 'rgb(61 220 151 / 0.55)',
  },
  edge: {
    label: '≈ Borderline',
    color: '#cdaa6d',
    border: 'rgb(205 170 109 / 0.55)',
  },
  bad: {
    label: '✗ Deviation',
    color: 'var(--loss)',
    border: 'rgb(224 99 92 / 0.55)',
  },
};

export function HandReplayer({
  hh,
  avatars,
}: {
  hh: HandHistory;
  avatars?: Record<string, number | null>;
}) {
  const steps = useMemo(() => buildSteps(hh), [hh]);
  const [idx, setIdx] = useState(steps.length - 1);

  const step = steps[Math.min(idx, steps.length - 1)];
  const board = parseGlyphCards(hh.board) ?? [];
  const bb = hh.bb;
  const n = hh.players.length;

  return (
    <div className="space-y-2.5">
      {/* Mini Poker Table */}
      <div className="relative w-full max-w-[560px] mx-auto aspect-[16/10]">
        <div className="felt-rail absolute inset-[4%] rounded-[48%/46%]" />
        <div className="felt absolute inset-[6.5%] rounded-[48%/46%]" />

        {/* Center: Pot and Community Cards */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1.5">
          <span className="font-mono text-[11px] text-white/70">
            Pot {(step.pot / bb).toFixed(1)}BB
          </span>

          <div className="flex gap-1 min-h-[44px] items-center">
            {board
              .slice(0, step.boardCount)
              .map((c) => (
                <CardView
                  key={`${c}-${step.boardCount}`}
                  card={c}
                  size="sm"
                />
              ))}

            {Array.from({
              length: 5 - step.boardCount,
            }).map((_, i) => (
              <div
                key={i}
                className="w-8 h-11 rounded-lg border border-white/[0.08] bg-black/10 shrink-0"
              />
            ))}
          </div>
        </div>

        {/* Player Seats: All Hole Cards Visible */}
        {hh.players.map((p, i) => {
          const a =
            (seatAngle(i, n) * Math.PI) / 180;

          const isFolded = step.folded.includes(p.id);
          const isActor = step.actorId === p.id;

          const holeStr =
            hh.holes?.[p.id] ??
            (p.isHero ? hh.heroHole : '');

          const hole = holeStr
            ? parseGlyphCards(holeStr) ?? []
            : [];

          const bet = step.bets[p.id] ?? 0;

          const won =
            step.isResult &&
            hh.results.some(
              (r) => r.name === p.name && r.net > 0
            );

          return (
            <div key={p.id}>
              {/* Player Bet */}
              {bet > 0 && (
                <span
                  className="absolute -translate-x-1/2 -translate-y-1/2 font-mono text-[10px] text-white/85 flex items-center gap-1"
                  style={{
                    left: `${50 + 24 * Math.cos(a)}%`,
                    top: `${50 + 19 * Math.sin(a)}%`,
                  }}
                >
                  <span className="chip inline-block w-2.5 h-2.5" />
                  {(bet / bb).toFixed(1)}
                </span>
              )}

              {/* Player Seat: Cards and Nameplate Do Not Overlap */}
              <div
                className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-0.5 transition-opacity ${
                  isFolded
                    ? 'opacity-30 saturate-50'
                    : ''
                }`}
                style={{
                  left: `clamp(48px, ${
                    50 + 40 * Math.cos(a)
                  }%, calc(100% - 48px))`,
                  top: `${50 + 36 * Math.sin(a)}%`,
                }}
              >
                {hole.length > 0 && (
                  <div className="flex gap-px">
                    {hole.map((c) => (
                      <CardView
                        key={c}
                        card={c}
                        size="sm"
                      />
                    ))}
                  </div>
                )}

                <div
                  className={`glass rounded-xl px-2 py-1 flex items-center gap-1.5 whitespace-nowrap ${
                    isActor
                      ? 'shadow-[0_0_0_1.5px_var(--accent)]'
                      : won
                        ? 'shadow-[0_0_0_1.5px_var(--accent),0_0_18px_rgb(61_220_151/0.35)]'
                        : ''
                  }`}
                >
                  <Avatar
                    name={p.name}
                    avatarId={
                      avatars?.[p.name] ?? null
                    }
                    isHero={p.isHero}
                    size={14}
                  />

                  <span
                    className={`text-[10px] whitespace-nowrap ${
                      p.isHero
                        ? 'text-accent font-medium'
                        : ''
                    }`}
                  >
                    {p.name}
                  </span>

                  <span className="font-mono text-[10px] text-muted">
                    {(
                      (step.stacks[p.id] ?? 0) / bb
                    ).toFixed(0)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Replay Timeline with Color-Coded Decision Markers */}
      <div className="max-w-[560px] mx-auto px-1">
        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              setIdx((v) => Math.max(0, v - 1))
            }
            className="p-1 rounded-full border border-line text-muted hover:text-foreground disabled:opacity-40"
            disabled={idx === 0}
            aria-label="Previous Step"
          >
            <CaretLeft size={12} />
          </button>

          <div className="relative flex-1 pb-3">
            <input
              type="range"
              min={0}
              max={steps.length - 1}
              value={idx}
              onChange={(e) =>
                setIdx(Number(e.target.value))
              }
              className="bet-slider w-full"
              style={{
                ['--fill' as never]: `${
                  (idx /
                    Math.max(
                      1,
                      steps.length - 1
                    )) *
                  100
                }%`,
              }}
              aria-label="Replay Progress"
            />

            {/* Decision Markers: Green, Yellow, and Red */}
            {steps.map((s, i) =>
              s.decisionIdx !== undefined ? (
                <button
                  key={i}
                  onClick={() => setIdx(i)}
                  className="absolute -bottom-1 -translate-x-1/2 w-5 h-5 flex items-center justify-center cursor-pointer"
                  style={{
                    left: `${
                      (i /
                        Math.max(
                          1,
                          steps.length - 1
                        )) *
                      100
                    }%`,
                  }}
                  aria-label={`Your Decision ${
                    s.decisionIdx + 1
                  }`}
                  title={s.desc}
                >
                  <span
                    className="rounded-full border transition-transform"
                    style={{
                      width:
                        i === idx ? 10 : 8,
                      height:
                        i === idx ? 10 : 8,
                      background:
                        VERDICT_UI[
                          verdictOf(
                            hh.decisions![
                              s.decisionIdx
                            ]
                          )
                        ].color,
                      borderColor:
                        'rgba(0,0,0,0.5)',
                      opacity:
                        i === idx ? 1 : 0.8,
                    }}
                  />
                </button>
              ) : null
            )}
          </div>

          <button
            onClick={() =>
              setIdx((v) =>
                Math.min(
                  steps.length - 1,
                  v + 1
                )
              )
            }
            className="p-1 rounded-full border border-line text-muted hover:text-foreground disabled:opacity-40"
            disabled={
              idx === steps.length - 1
            }
            aria-label="Next Step"
          >
            <CaretRight size={12} />
          </button>
        </div>

        <p className="mt-1 text-center text-[11px] text-foreground/90">
          <span className="font-mono text-muted mr-2">
            {idx + 1}/{steps.length}
          </span>

          {step.desc}
        </p>

        {/* Decision Review: Rating and Full Coaching Analysis */}
        {step.decisionIdx !== undefined &&
          hh.decisions?.[
            step.decisionIdx
          ] && (
            <div className="mt-2">
              {(() => {
                const d =
                  hh.decisions[
                    step.decisionIdx
                  ];

                const v =
                  VERDICT_UI[
                    verdictOf(d)
                  ];

                return (
                  <div
                    className="rounded-xl border bg-background/40 px-3 py-2.5 space-y-1"
                    style={{
                      borderColor: v.border,
                    }}
                  >
                    {/* Decision Accuracy */}
                    <div className="flex items-center gap-2 text-[11px]">
                      <span
                        className="font-semibold"
                        style={{
                          color: v.color,
                        }}
                      >
                        {v.label}
                      </span>

                      <span className="text-muted">
                        {d.facingText}
                      </span>
                    </div>

                    {/* Opponent's Possible Hand Range */}
                    {d.villainName &&
                      d.villainClasses.length >
                        0 && (
                        <p className="text-[11px] leading-relaxed">
                          <span className="text-muted">
                            {d.villainName}{' '}
                            Possible Hands:{' '}
                          </span>

                          <span className="font-mono text-foreground/85">
                            {d.villainClasses.join(
                              ' '
                            )}
                          </span>

                          <span className="text-muted">
                            {' '}
                            (Approximately{' '}
                            {d.villainSharePct.toFixed(
                              0
                            )}
                            % of Starting Hands)
                          </span>
                        </p>
                      )}

                    {/* Player Equity and Required Calling Equity */}
                    <p className="text-[11px] font-mono text-muted">
                      Your Equity ~
                      {d.heroEquityPct.toFixed(
                        0
                      )}
                      %
                      {d.neededPct !==
                        null && (
                        <>
                          {' '}
                          · Required to Call{' '}
                          {d.neededPct.toFixed(
                            0
                          )}
                          %
                        </>
                      )}
                    </p>

                    {/* Coach Recommendation and Player Action */}
                    <p className="text-[11px] leading-relaxed">
                      <span
                        style={{
                          color: v.color,
                        }}
                      >
                        Coach:{' '}
                        {d.adviceAction}
                      </span>

                      <span className="text-muted">
                        {' '}
                        ({d.adviceReason})
                      </span>

                      <span className="text-muted">
                        {' '}
                        · You:{' '}
                        {d.actualAction ||
                          'No Action'}
                      </span>
                    </p>
                  </div>
                );
              })()}
            </div>
          )}
      </div>
    </div>
  );
}
