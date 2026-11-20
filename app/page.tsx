
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, useReducedMotion } from 'motion/react';
import {
  ArrowRight,
  ArrowsClockwise,
  Eye,
  EyeSlash,
  Play,
  SignOut,
  Sparkle,
  Strategy,
  UsersThree,
} from '@phosphor-icons/react';

import {
  useGame,
  loadSessionRecord,
  type OpponentConfig,
} from '@/lib/store';

import { BASE_PATH } from '@/lib/llm';

import {
  BOT_NAMES,
  PERSONALITIES,
  PERSONALITY_IDS,
  PERSONALITY_HUES,
} from '@/lib/poker/personality';

const TABLE_SIZES = [2, 6, 7, 8, 9] as const;
const STACK_OPTIONS = [50, 100, 200] as const;

// Translate personality names and descriptions into English.
// Existing personality IDs and game logic remain unchanged.
const PERSONALITY_TRANSLATIONS: Record<
  string,
  { name: string; description: string }
> = {
  rock: {
    name: 'Rock',
    description: 'Extremely tight and cautious. Plays only strong hands.',
  },
  nit: {
    name: 'Nit',
    description: 'Very selective and risk-averse. Rarely enters a pot without a premium hand.',
  },
  tag: {
    name: 'Tight-Aggressive',
    description: 'Plays a selective range and applies pressure with strong hands.',
  },
  lag: {
    name: 'Loose-Aggressive',
    description: 'Plays a wide range and frequently applies pressure.',
  },
  station: {
    name: 'Calling Station',
    description: 'Calls frequently and rarely folds to aggression.',
  },
  maniac: {
    name: 'Maniac',
    description: 'Highly aggressive and unpredictable. Bets and raises frequently.',
  },
  fish: {
    name: 'Recreational',
    description: 'Plays inconsistently and may make exploitable mistakes.',
  },
  shark: {
    name: 'Shark',
    description: 'Skilled and adaptable. Adjusts strategy based on opponents.',
  },
  balanced: {
    name: 'Balanced',
    description: 'Uses a balanced strategy with a mix of value bets and bluffs.',
  },
};

// Return an English personality name without displaying
// the original Chinese-language fallback.
function getPersonalityName(id: string): string {
  return (
    PERSONALITY_TRANSLATIONS[id]?.name ??
    id.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

// Return an English description for the personality.
function getPersonalityDescription(id: string): string {
  return (
    PERSONALITY_TRANSLATIONS[id]?.description ??
    `Opponent playing style: ${getPersonalityName(id)}.`
  );
}

export default function SetupPage() {
  const router = useRouter();
  const startSession = useGame((s) => s.startSession);
  const reduce = useReducedMotion();

  const [tableSize, setTableSize] = useState<number>(6);
  const [showPersonalities, setShowPersonalities] = useState(true);
  const [startingBB, setStartingBB] = useState<number>(100);
  const [botRebuy, setBotRebuy] = useState(true);

  const [lastSession, setLastSession] = useState<{
    hands: number;
    netBB: number;
    inProgress: boolean;
  } | null>(null);

  // Restore the previous session summary from browser storage.
  useEffect(() => {
    const rec = loadSessionRecord();

    if (rec?.histories.length || rec?.inProgress) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLastSession({
        hands: rec.histories.length,
        netBB: rec.histories.reduce(
          (sum, hand) => sum + hand.heroNet / hand.bb,
          0
        ),
        inProgress: !!rec.inProgress,
      });
    }
  }, []);

  const oppCount = tableSize - 1;

  // Assign random opponent personalities.
  // Their playing styles are revealed at the table
  // when personality visibility is enabled.
  const opponents: OpponentConfig[] = useMemo(
    () =>
      Array.from({ length: oppCount }, (_, i) => ({
        name: BOT_NAMES[i],
        personality: 'random' as const,
      })),
    [oppCount]
  );

  // Start a new poker training session.
  function start() {
    startSession({
      tableSize,
      showPersonalities,
      liveCoach: true,
      startingBB,
      sb: 1,
      bb: 2,
      targetHands: null,
      botRebuy,
      opponents,
    });

    router.push('/table');
  }

  return (
    <main className="relative min-h-[100dvh] overflow-hidden">
      {/* Atmospheric Video Background */}
      {/* Fixed to the viewport so it does not scroll with the content. */}
      <div className="fixed inset-0" aria-hidden="true">
        {!reduce && (
          <video
            autoPlay
            muted
            playsInline
            poster={`${BASE_PATH}/hero-poster.jpg`}
            className="w-full h-full object-cover"
          >
            <source
              src={`${BASE_PATH}/hero.mp4`}
              type="video/mp4"
            />
          </video>
        )}

        {/* Static Background for Reduced-Motion Preferences */}
        {reduce && (
          <div
            className="w-full h-full bg-cover bg-center"
            style={{
              backgroundImage: `url(${BASE_PATH}/hero-poster.jpg)`,
            }}
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-background/45" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/40" />
      </div>

      <div className="relative z-10 max-w-[1240px] mx-auto px-4 sm:px-8 py-10 lg:py-0 lg:min-h-[100dvh] grid grid-cols-1 lg:grid-cols-[1fr_450px] gap-10 lg:gap-20 items-start lg:items-center">
        {/* Left Section: Branding and Game Description */}
        <motion.section
          initial={reduce ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.6,
            ease: [0.16, 1, 0.3, 1],
          }}
        >
          {/* Brand Label */}
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-[#cdaa6d]/60" />

            <span className="text-accent text-sm font-mono tracking-[0.45em]">
              FELT LAB
            </span>
          </div>

          {/* Main Heading */}
          <h1 className="mt-5 text-5xl md:text-7xl font-semibold tracking-tighter leading-[0.95]">
            Flop House
          </h1>

          {/* Introduction */}
          <p className="mt-6 text-lg text-muted leading-relaxed max-w-[40ch]">
            Compete against opponents who think in ranges.
            Every hand is broken down in real time,
            with a full behavioral review after the session.
          </p>

          {/* Opponent Personality Preview */}
          <div className="mt-7 flex flex-wrap gap-1.5 max-w-[44ch]">
            {PERSONALITY_IDS.map((id) => (
              <span
                key={id}
                className="text-[11px] px-2.5 py-1 rounded-full border font-medium"
                style={{
                  color: `hsl(${PERSONALITY_HUES[id]} 60% 68%)`,
                  borderColor: `hsl(${PERSONALITY_HUES[id]} 50% 50% / 0.45)`,
                }}
                title={getPersonalityDescription(id)}
              >
                {getPersonalityName(id)}
              </span>
            ))}
          </div>

          {/* Previous Session: Prioritize Continuing Unfinished Games */}
          {lastSession?.inProgress ? (
            <Link
              href="/table"
              className="mt-5 inline-flex items-center gap-2 text-xs px-3.5 py-2 rounded-full glass text-accent border border-accent/30 hover:border-accent transition-colors"
            >
              Unfinished session: {lastSession.hands} hands played,{' '}

              <span className="font-mono">
                {lastSession.netBB >= 0 ? '+' : ''}
                {lastSession.netBB.toFixed(1)}BB
              </span>

              {' '}· Continue Training

              <ArrowRight size={12} />
            </Link>
          ) : lastSession ? (
            <Link
              href="/review"
              className="mt-5 inline-flex items-center gap-2 text-xs px-3.5 py-2 rounded-full glass text-muted hover:text-accent transition-colors"
            >
              Last Session: {lastSession.hands} hands,{' '}

              <span
                className="font-mono"
                style={{
                  color:
                    lastSession.netBB >= 0
                      ? 'var(--accent)'
                      : 'var(--loss)',
                }}
              >
                {lastSession.netBB >= 0 ? '+' : ''}
                {lastSession.netBB.toFixed(1)}BB
              </span>

              {' '}· View Review

              <ArrowRight size={12} />
            </Link>
          ) : null}

          {/* Training Features */}
          <ul className="mt-9 space-y-5 text-sm max-w-[46ch]">
            {/* Range-Based Opponents */}
            <li className="flex gap-3.5">
              <span className="glass w-9 h-9 rounded-xl flex items-center justify-center shrink-0">
                <Strategy
                  size={17}
                  className="text-accent"
                />
              </span>

              <span className="text-muted leading-relaxed">
                Standard range charts and range-vs-range
                GTO-approximated opponents, with exploitable
                traits such as tight-passive, loose-aggressive,
                and calling station.
              </span>
            </li>

            {/* Multiple Table Sizes */}
            <li className="flex gap-3.5">
              <span className="glass w-9 h-9 rounded-xl flex items-center justify-center shrink-0">
                <UsersThree
                  size={17}
                  className="text-accent"
                />
              </span>

              <span className="text-muted leading-relaxed">
                Play heads-up or at tables with up to nine players.
                Position, blinds, and side pots are supported,
                with different balanced ranges for heads-up
                and multiway pots.
              </span>
            </li>

            {/* Real-Time Coaching and Hand Reviews */}
            <li className="flex gap-3.5">
              <span className="glass w-9 h-9 rounded-xl flex items-center justify-center shrink-0">
                <Sparkle
                  size={17}
                  className="text-accent"
                />
              </span>

              <span className="text-muted leading-relaxed">
                Get real-time analysis of opponent ranges,
                equity, and coaching recommendations.
                Explore what would have happened after folding
                with Rabbit Hole, review your decisions,
                and replay completed hands.
              </span>
            </li>
          </ul>
        </motion.section>

        {/* Right Section: Poker Training Settings */}
        <motion.section
          initial={reduce ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.6,
            delay: 0.1,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="glass rounded-3xl p-6 sm:p-7 space-y-6"
          style={{
            backgroundColor: 'rgb(12 16 20 / 0.82)',
          }}
        >
          {/* Table Size Selection */}
          <div>
            <div className="text-sm font-medium mb-2.5">
              Table Size
            </div>

            <div className="flex gap-1.5 flex-wrap">
              {TABLE_SIZES.map((n) => (
                <button
                  key={n}
                  data-on={tableSize === n}
                  onClick={() => setTableSize(n)}
                  className="seg px-4 py-2 text-sm"
                >
                  {n === 2
                    ? 'Heads-Up'
                    : `${n} Players`}
                </button>
              ))}
            </div>
          </div>

          {/* Personality Visibility and Starting Stack */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Opponent Personality Visibility */}
            <div>
              <div className="text-sm font-medium mb-2.5">
                Personality Visibility
              </div>

              <div className="flex gap-1.5">
                <button
                  data-on={showPersonalities}
                  onClick={() =>
                    setShowPersonalities(true)
                  }
                  className="seg flex items-center gap-1.5 px-3.5 py-2 text-sm"
                >
                  <Eye size={15} />
                  Show
                </button>

                <button
                  data-on={!showPersonalities}
                  onClick={() =>
                    setShowPersonalities(false)
                  }
                  className="seg flex items-center gap-1.5 px-3.5 py-2 text-sm"
                >
                  <EyeSlash size={15} />
                  Hide
                </button>
              </div>
            </div>

            {/* Starting Stack */}
            <div>
              <div className="text-sm font-medium mb-2.5">
                Starting Stack
              </div>

              <div className="flex gap-1.5">
                {STACK_OPTIONS.map((s) => (
                  <button
                    key={s}
                    data-on={startingBB === s}
                    onClick={() => setStartingBB(s)}
                    className="seg px-3 py-1.5 text-xs font-mono"
                  >
                    {s}BB
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Opponent Rebuy Settings */}
          <div>
            <div className="text-sm font-medium mb-2.5">
              When Opponents Run Out of Chips
            </div>

            <div className="flex gap-1.5">
              <button
                data-on={botRebuy}
                onClick={() => setBotRebuy(true)}
                className="seg flex items-center gap-1.5 px-3.5 py-2 text-sm"
              >
                <ArrowsClockwise size={15} />
                Auto Rebuy
              </button>

              <button
                data-on={!botRebuy}
                onClick={() => setBotRebuy(false)}
                className="seg flex items-center gap-1.5 px-3.5 py-2 text-sm"
              >
                <SignOut size={15} />
                Leave Table
              </button>
            </div>
          </div>

          {/* Personality Visibility Explanation */}
          <p className="text-xs text-muted leading-relaxed -mt-2">
            {showPersonalities
              ? 'Opponent personalities are displayed at their seats, helping you practice exploitative adjustments.'
              : 'Blind Mode: Identify opponent tendencies yourself. Their playing styles will be revealed during the review.'}
            {' '}Click "End & Review" anytime to finish your session.
          </p>

          {/* Session Summary and Start Button */}
          <div className="pt-3 border-t border-white/10">
            <p className="text-xs text-muted mb-4">
              Blinds 1/2 · Cash Game Rules · Opponents{' '}
              {botRebuy
                ? 'Automatically Rebuy'
                : 'Leave the Table'}{' '}
              When They Run Out of Chips
            </p>

            <button
              onClick={start}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 text-[15px]"
            >
              <Play size={18} weight="fill" />
              Start Training
            </button>
          </div>
        </motion.section>
      </div>
    </main>
  );
}
