import type { HTMLAttributes } from 'react';

type Color = 'red' | 'blue' | 'yellow' | 'black' | 'outline';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  color?: Color;
}

const colorClasses: Record<Color, string> = {
  red: 'bg-primary-red text-white',
  blue: 'bg-primary-blue text-white',
  yellow: 'bg-primary-yellow text-black',
  black: 'bg-black text-white',
  outline: 'bg-white text-black',
};

export function Badge({ color = 'black', className = '', children, ...props }: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex w-fit shrink-0 self-start items-center gap-1 rounded-full border-2 border-black px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest',
        colorClasses[color],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </span>
  );
}
