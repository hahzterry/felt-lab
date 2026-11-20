
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Binoculars, X } from '@phosphor-icons/react';
import type { RabbitData } from '@/lib/drama';
import { parseGlyphCards } from '@/lib/poker/history';
import { CardView } from './CardView';

// Rabbit Hole:
// After folding, reveal what would have happened if the player
// had stayed in the hand until the end.
//
// Displays a modal with a backdrop and an explicit close button.

export function RabbitHole({
  rabbit,
  onReveal,
}: {
  rabbit: RabbitData;
  onReveal: () => void;
}) {
  const [open, setOpen] = useState(false);

  const boardCards = parseGlyphCards(rabbit.fullBoard) ?? [];
  const winnerCards = parseGlyphCards(rabbit.winnerHole) ?? [];

  return (
    <>
      {/* Open Rabbit Hole Button */}
      <button
        onClick={() => {
          setOpen(true);
          onReveal();
        }}
        className="flex items-center gap-1.5 text-xs px-4 py-2 rounded-full glass text-accent hover:shadow-[0_0_0_1px_var(--accent)] transition-all"
      >
        <Binoculars size={15} weight="fill" />
        Rabbit Hole: What If You Had Stayed In?
      </button>

      {/* Animated Rabbit Hole Modal */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="rabbit-modal"
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{
              opacity: 0,
            }}
            transition={{
              duration: 0.2,
            }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-[2px]"
            onClick={() => setOpen(false)}
          >
            {/* Modal Content */}
            <motion.div
              initial={{
                opacity: 0,
                y: 18,
                scale: 0.94,
              }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                y: 10,
                scale: 0.96,
              }}
              transition={{
                duration: 0.32,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="relative glass rounded-3xl px-7 py-6 flex flex-col items-center gap-3 shadow-[0_24px_80px_rgb(0_0_0/0.7)] mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Modal Button */}
              <button
                onClick={() => setOpen(false)}
                className="absolute top-3 right-3 p-1 rounded-full text-muted hover:text-foreground transition-colors"
                aria-label="Close"
              >
                <X size={15} />
              </button>

              {/* Rabbit Hole Heading */}
              <div className="text-[11px] text-accent flex items-center gap-1.5">
                <Binoculars size={13} weight="fill" />
                If You Had Stayed Until the End
              </div>

              {/* Final Community Cards */}
              <div className="flex gap-1.5">
                {boardCards.map((c, i) => (
                  <CardView
                    key={c}
                    card={c}
                    size="md"
                    delay={i * 0.12}
                  />
                ))}
              </div>

              {/* Player's Potential Hand vs. Opponent's Winning Hand */}
              <div className="text-xs text-center leading-relaxed">
                <span className="text-muted">
                  You Would Have Had{' '}
                </span>

                <span className="font-semibold">
                  {rabbit.heroHandName}
                </span>

                <span className="text-muted">
                  {' '}· {rabbit.winnerName} Had{' '}
                </span>

                <span className="font-mono">
                  {rabbit.winnerHole}
                </span>

                <span className="text-muted">
                  {' '}({rabbit.winnerHandName})
                </span>
              </div>

              {/* Opponent's Cards and Hypothetical Outcome */}
              <div className="flex items-center gap-1.5">
                {winnerCards.map((c, i) => (
                  <CardView
                    key={c}
                    card={c}
                    size="sm"
                    delay={0.3 + i * 0.1}
                  />
                ))}

                <motion.span
                  initial={{
                    opacity: 0,
                    scale: 0.7,
                  }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                  }}
                  transition={{
                    delay: 0.55,
                    type: 'spring',
                    stiffness: 300,
                    damping: 16,
                  }}
                  className={`ml-2 text-sm font-bold font-mono px-3 py-1 rounded-full ${
                    rabbit.heroWouldBeat
                      ? 'bg-accent text-black'
                      : 'border border-line text-muted'
                  }`}
                >
                  {rabbit.heroWouldBeat
                    ? 'You Would Have Won!'
                    : 'Good Fold! You Would Have Lost.'}
                </motion.span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
