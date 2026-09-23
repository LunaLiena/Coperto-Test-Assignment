import { ReactNode } from 'react';

type Tone = 'neutral' | 'accent' | 'success' | 'saving';

const TONE_CLASSES: Record<Tone, string> = {
  neutral: 'bg-line/60 text-ink/70',
  accent: 'bg-accent-soft text-accent-hover',
  success: 'bg-successSoft text-success',
  saving: 'bg-line/60 text-muted',
};

interface BadgeProps {
  tone?: Tone;
  children: ReactNode;
}

export function Badge({ tone = 'neutral', children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${TONE_CLASSES[tone]}`}
    >
      {children}
    </span>
  );
}
