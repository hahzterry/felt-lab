
'use client';

import { useEffect, useState } from 'react';
import { CaretDown, CaretUp, Crown } from '@phosphor-icons/react';
import { useGame } from '@/lib/store';
import { computeOpponentImages, computeHeroStats } from '@/lib/poker/history';
import { PERSONALITIES } from '@/lib/poker/personality';
import { ActionLog } from './ActionLog';
import { CoachNote } from './CoachNote';
import { DecisionReview } from './DecisionReview';
import { Avatar } from './Avatar';

type Tab = 'review' | 'players' | 'log';

// English translations for existing personality labels.
// Keeps compatibility with the original personality data structure.
const PERSONALITY_LABELS: Record<string, string> = {
  '紧手': 'Tight',
  '松手': 'Loose',
  '激进': 'Aggressive',
  '被动': 'Passive',
  '紧凶': 'Tight-Aggressive',
  '松凶': 'Loose-Aggressive',
  '紧弱': 'Tight-Passive',
  '松弱': 'Loose-Passive',
  '岩石': 'Rock',
  '跟注站': 'Calling Station',
  '疯子': 'Maniac',
  '鲨鱼': 'Shark',
  '鱼': 'Fish',
  '诈唬者': 'Bluffer',
  '平衡型': 'Balanced',
};

// Unified side panel:
// Hand Review, Player Rankings and Statistics, and Action Log.
export function SidePanel() {
  const config = useGame((s) => s.config);
  const hand = useGame((s) => s.hand);
  const phase = useGame((s) => s.phase);
  const seats = useGame((s) => s.seats);
  const histories = useGame((s) => s.histories);
  const handComments = useGame((s) => s.handComments);
  const rabbit = useGame((s) => s.rabbit);
  const holdAutoNext = useGame((s) => s.holdAutoNext);

  useGame((s) => s.version);

  const [tab, setTab] = useState<Tab>('players');
  const [coachOpen, setCoachOpen] = useState(false);

  // Automatically switch to the Hand Review tab
  // when the current hand ends.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (phase === 'handEnd') setTab('review');
  }, [phase]);

  if (!config || !hand) return null;

  const lastHand = histories.length
    ? histories[histories.length - 1]
    : null;

  const lastNote = lastHand
    ? handComments[lastHand.handNo]
    : undefined;

  const bb = config.bb;

  // Current player rankings:
  // Net profit/loss = Current stack - Total buy-ins.
  const buyin = config.startingBB * bb;

  const board = [...seats]
    .map((s) => ({
      ...s,
      net: s.stack - buyin * (1 + s.rebuys),
    }))
    .sort((a, b) => b.net - a.net);

  const images = computeOpponentImages(histories);

  const heroStats = histories.length
    ? computeHeroStats(histories)
    : null;

  const TABS: { key: Tab; label: string }[] = [
    { key: 'review', label: 'Review' },
    { key: 'players', label: 'Players' },
    { key: 'log', label: 'Action Log' },
  ];

  return (
    <div
      className="h-full flex flex-col glass rounded-2xl overflow-hidden"
      onMouseEnter={
        phase === 'handEnd'
          ? holdAutoNext
          : undefined
      }
    >
      {/* Navigation Tabs */}
      <div className="flex shrink-0 border-b border-line/60">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2.5 text-xs transition-colors ${
              tab === t.key
                ? 'text-accent border-b-2 border-accent font-medium'
                : 'text-muted hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-3">

        {/* Hand Review Tab */}
        {tab === 'review' && (
          <div className="space-y-2.5">
            {!lastHand && (
              <p className="text-[11px] text-muted">
                Your decision-by-decision hand review will
                appear here after the first hand.
              </p>
            )}

            {lastHand && (
              <>
                {/* Hand Number and Net Result */}
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-accent font-medium">
                    Hand #{lastHand.handNo}
                  </span>

                  <span
                    className="font-mono"
                    style={{
                      color:
                        lastHand.heroNet >= 0
                          ? 'var(--accent)'
                          : 'var(--loss)',
                    }}
                  >
                    {lastHand.heroNet >= 0 ? '+' : ''}
                    {(lastHand.heroNet / lastHand.bb).toFixed(1)}
                    BB
                  </span>
                </div>

                {/* Decision-by-Decision Review */}
                {lastHand.decisions?.length ? (
                  <DecisionReview
                    decisions={lastHand.decisions}
                  />
                ) : (
                  <p className="text-[11px] text-muted">
                    You had no decision points during this hand.
                  </p>
                )}

                {/* Rabbit Hole Available After Hand Ends */}
                {rabbit && phase === 'handEnd' && (
                  <p className="text-[11px] text-muted leading-relaxed">
                    Check out the{' '}
                    <span className="text-accent">
                      Rabbit Hole
                    </span>{' '}
                    in the center of the table to see
                    what would have happened if you
                    had stayed in the hand.
                  </p>
                )}

                {/* Previous Hand Rabbit Hole Summary */}
                {lastHand.rabbit && phase !== 'handEnd' && (
                  <p className="text-[11px] leading-relaxed">
                    <span className="text-accent">
                      Rabbit Hole:
                    </span>{' '}

                    <span className="text-muted">
                      The final board would have been{' '}
                      {lastHand.rabbit.fullBoard}.
                      {' '}You would have made{' '}
                      {lastHand.rabbit.heroHandName}.
                      {' '}
                      {lastHand.rabbit.heroWouldBeat
                        ? 'You would have won!'
                        : 'Good fold!'}
                    </span>
                  </p>
                )}

                {/* Expandable AI Coach Analysis */}
                {lastNote !== undefined && (
                  <div className="pt-2 border-t border-line/60">
                    <button
                      onClick={() =>
                        setCoachOpen((v) => !v)
                      }
                      className="w-full flex items-center gap-1.5 text-[11px] text-muted hover:text-accent transition-colors"
                    >
                      AI Coach Analysis

                      {coachOpen ? (
                        <CaretDown size={11} />
                      ) : (
                        <CaretUp size={11} />
                      )}
                    </button>

                    {coachOpen && (
                      <div className="mt-2">
                        <CoachNote note={lastNote} />
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Players Tab: Rankings and Player Profiles */}
        {tab === 'players' && (
          <div className="space-y-3">

            {/* Player Leaderboard */}
            <div>
              <div className="text-[11px] text-muted font-medium mb-1.5">
                Player Rankings
              </div>

              <div className="space-y-1">
                {board.map((s, i) => (
                  <div
                    key={s.id}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs ${
                      s.isHero
                        ? 'bg-accent/10 border border-accent/30'
                        : 'bg-background/30'
                    } ${
                      s.out ? 'opacity-55' : ''
                    }`}
                  >
                    {/* Ranking Position */}
                    <span className="font-mono text-muted w-4">
                      {i === 0 ? (
                        <Crown
                          size={13}
                          weight="fill"
                          className="text-[#cdaa6d]"
                        />
                      ) : (
                        i + 1
                      )}
                    </span>

                    {/* Player Avatar */}
                    <Avatar
                      name={s.name}
                      avatarId={s.avatarId}
                      isHero={s.isHero}
                      size={18}
                    />

                    {/* Player Name */}
                    <span
                      className={`truncate ${
                        s.isHero
                          ? 'font-medium'
                          : ''
                      }`}
                    >
                      {s.name}
                      {s.isHero ? ' (You)' : ''}
                    </span>

                    {/* Player Has Left the Table */}
                    {s.out && (
                      <span className="text-[9px] px-1.5 py-px rounded-full border border-line text-muted/70 shrink-0">
                        Left Table
                      </span>
                    )}

                    {/* Net Profit or Loss */}
                    <span
                      className="ml-auto font-mono"
                      style={{
                        color:
                          s.net >= 0
                            ? 'var(--accent)'
                            : 'var(--loss)',
                      }}
                    >
                      {s.net >= 0 ? '+' : ''}
                      {(s.net / bb).toFixed(1)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Player Statistics Dashboard */}
            <div>
              <div className="text-[11px] text-muted font-medium mb-1.5">
                Player Statistics
              </div>

              <div className="space-y-2">

                {/* Hero Statistics */}
                {heroStats && (
                  <div className="rounded-xl bg-background/30 border border-accent/25 p-2.5">
                    <div className="flex items-center gap-1.5 text-xs font-medium mb-1">
                      <Avatar
                        name="You"
                        isHero
                        size={20}
                      />

                      You

                      <span className="ml-auto font-mono text-[10px] text-muted">
                        Stack{' '}
                        {(
                          (seats.find(
                            (s) => s.isHero
                          )?.stack ?? 0) / bb
                        ).toFixed(0)}
                        BB
                      </span>
                    </div>

                    {/* Hero Poker Statistics */}
                    <div className="text-[10px] font-mono text-muted">
                      VPIP {heroStats.vpip.toFixed(0)}%
                      {' '}· PFR {heroStats.pfr.toFixed(0)}%
                      {' '}· AFq {heroStats.afq.toFixed(0)}%
                    </div>
                  </div>
                )}

                {/* Opponent Statistics */}
                {seats
                  .filter((s) => !s.isHero)
                  .map((s) => {
                    const img = images.find(
                      (x) => x.name === s.name
                    );

                    const prof = s.personality
                      ? PERSONALITIES[s.personality]
                      : null;

                    return (
                      <div
                        key={s.id}
                        className="rounded-xl bg-background/30 border border-line p-2.5"
                      >
                        {/* Opponent Name and Personality */}
                        <div className="flex items-center gap-1.5 text-xs font-medium mb-1">
                          <Avatar
                            name={s.name}
                            avatarId={s.avatarId}
                            size={20}
                          />

                          {s.name}

                          {config.showPersonalities && prof ? (
                            <span className="text-[9px] px-1.5 py-px rounded-full border border-line text-muted">
                              {PERSONALITY_LABELS[prof.tagZh] ??
                                prof.tagZh}
                            </span>
                          ) : (
                            <span className="text-[9px] px-1.5 py-px rounded-full border border-line text-muted/60">
                              Style Hidden
                            </span>
                          )}

                          {/* Opponent Stack or Table Status */}
                          <span className="ml-auto font-mono text-[10px] text-muted">
                            {s.out
                              ? 'Left Table'
                              : `Stack ${(s.stack / bb).toFixed(0)}BB`}
                          </span>
                        </div>

                        {/* Observed Opponent Statistics */}
                        {img && img.hands > 0 ? (
                          <>
                            <div className="text-[10px] font-mono text-muted">
                              VPIP {img.vpip.toFixed(0)}%
                              {' '}· PFR {img.pfr.toFixed(0)}%
                              {' '}· AFq {img.afq.toFixed(0)}%
                            </div>

                            {/* Most Recent Showdown */}
                            {img.recentShowdowns.length > 0 && (
                              <div className="text-[10px] text-muted/80 mt-0.5">
                                {
                                  img.recentShowdowns[
                                    img.recentShowdowns.length - 1
                                  ]
                                }
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-[10px] text-muted/60">
                            No Observations Yet
                          </div>
                        )}

                        {/* Rebuy Count */}
                        {s.rebuys > 0 && (
                          <div className="text-[10px] text-muted/60 mt-0.5">
                            Rebuys: {s.rebuys}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        {/* Action Log Tab */}
        {tab === 'log' && (
          <div className="h-full -m-3">
            <ActionLog
              hand={hand}
              embedded
            />
          </div>
        )}
      </div>
    </div>
  );
}
