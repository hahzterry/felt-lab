
'use client';

import { BASE_PATH } from '@/lib/llm';

// BitmapPunks pixel avatars:
// Select an avatar from a pool of 24 pre-generated random avatars
// using the avatarId.
//
// Avatars are randomly assigned at the start of each game
// and are not tied to player names.
//
// The hero always uses the dedicated hero.svg avatar.

// Fallback colors for players without an assigned avatar.
const FALLBACK_HUES = [158, 200, 26, 280, 340, 95, 215, 45];

// Generate a consistent fallback color based on the player's name.
function hueOf(name: string): number {
  let h = 0;

  for (let i = 0; i < name.length; i++) {
    h = (h * 31 + name.charCodeAt(i)) >>> 0;
  }

  return FALLBACK_HUES[h % FALLBACK_HUES.length];
}

// Total number of available pixel avatars.
export const AVATAR_POOL_SIZE = 24;

export function Avatar({
  name,
  avatarId,
  isHero = false,
  size = 20,
}: {
  name: string;
  avatarId?: number | null;
  isHero?: boolean;
  size?: number;
}) {
  // Use the hero avatar for the player.
  // Otherwise, select an avatar from the available pool.
  const file = isHero
    ? 'hero'
    : typeof avatarId === 'number' && avatarId >= 0
      ? `p${avatarId % AVATAR_POOL_SIZE}`
      : null;

  // Display the assigned SVG avatar.
  if (file) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={`${BASE_PATH}/avatars/${file}.svg`}
        width={size}
        height={size}
        alt={name}
        className="rounded-[5px] shrink-0 [image-rendering:pixelated] ring-1 ring-white/20 shadow-[0_2px_6px_rgb(0_0_0/0.4)]"
      />
    );
  }

  // Display a fallback avatar with the player's first initial
  // and a consistent color gradient.
  return (
    <span
      className="rounded-[5px] shrink-0 flex items-center justify-center font-bold text-black/75"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.45,
        background: `linear-gradient(180deg, hsl(${hueOf(name)} 55% 72%), hsl(${hueOf(name)} 45% 52%))`,
      }}
    >
      {name.slice(0, 1)}
    </span>
  );
}
