
'use client';

import type { HandCommentData } from '@/lib/review-prompt';

// English coaching verdict labels and their corresponding styles.
export const VERDICT_STYLE: Record<
  string,
  { label: string; cls: string }
> = {
  good: {
    label: 'Excellent',
    cls: 'text-accent border-accent/50',
  },
  ok: {
    label: 'Standard',
    cls: 'text-muted border-line',
  },
  mistake: {
    label: 'Needs Improvement',
    cls: 'text-[#cdaa6d] border-[#cdaa6d]/50',
  },
  blunder: {
    label: 'Major Mistake',
    cls: 'text-[var(--loss)] border-[var(--loss)]/60',
  },
};

// Coaching analysis categories.
const ROWS: {
  key: 'read' | 'math' | 'next';
  label: string;
}[] = [
  { key: 'read', label: 'Read' },
  { key: 'math', label: 'Math' },
  { key: 'next', label: 'Next Time' },
];

// Display a structured coaching review.
// Also supports legacy plain-text coaching feedback.
export function CoachNote({
  note,
}: {
  note: HandCommentData | string;
}) {
  // Support older coaching notes stored as plain text.
  if (typeof note === 'string') {
    return (
      <p className="text-xs leading-relaxed text-foreground/90">
        {note}
      </p>
    );
  }

  // Determine the appropriate verdict label and styling.
  const v =
    VERDICT_STYLE[note.verdict] ?? VERDICT_STYLE.ok;

  // Retrieve street-by-street coaching feedback.
  const streets = note.streets ?? [];

  return (
    <div className="space-y-1.5">

      {/* Coaching Review Title and Verdict */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold">
          {note.title}
        </span>

        <span
          className={`text-[10px] px-2 py-px rounded-full border ${v.cls}`}
        >
          {v.label}
        </span>
      </div>

      {/* Overall Hand Situation */}
      {note.situation && (
        <p className="text-xs leading-relaxed text-foreground/90">
          {note.situation}
        </p>
      )}

      {/* Street-by-Street Coaching Analysis */}
      {streets.length > 0 && (
        <div className="space-y-1 border-l border-accent/30 pl-2.5 py-0.5">
          {streets.map((s, i) => (
            <div
              key={i}
              className="flex gap-2 text-xs leading-relaxed"
            >
              <span className="shrink-0 w-7 text-accent/80 font-mono text-[11px]">
                {s.street}
              </span>

              <span className="text-foreground/90">
                {s.note}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Additional Coaching Insights */}
      <div className="space-y-1">
        {ROWS.map(({ key, label }) => {
          const val = note[key];

          if (!val) return null;

          return (
            <div
              key={key}
              className="flex gap-2 text-xs leading-relaxed"
            >
              <span className="shrink-0 w-7 text-muted">
                {label}
              </span>

              <span className="text-foreground/90">
                {val}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
