import type { HTMLAttributes } from 'react';

type Decoration = 'circle' | 'square' | 'triangle' | 'none';
type DecorationColor = 'red' | 'blue' | 'yellow';
type Shadow = 'sm' | 'md' | 'lg';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  decoration?: Decoration;
  decorationColor?: DecorationColor;
  shadow?: Shadow;
}

const decorationColorClasses: Record<DecorationColor, string> = {
  red: 'bg-primary-red',
  blue: 'bg-primary-blue',
  yellow: 'bg-primary-yellow',
};

const shadowClasses: Record<Shadow, string> = {
  sm: 'shadow-hard-sm',
  md: 'shadow-hard-md',
  lg: 'shadow-hard-lg',
};

function DecorationShape({ shape, color }: { shape: Decoration; color: DecorationColor }) {
  if (shape === 'none') return null;
  const base = 'absolute -top-2.5 -right-2.5 h-5 w-5 border-2 border-black';
  if (shape === 'triangle') {
    return <span className={`${base} ${decorationColorClasses[color]}`} style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)', borderRadius: 0 }} />;
  }
  return <span className={`${base} ${decorationColorClasses[color]} ${shape === 'circle' ? 'rounded-full' : 'rounded-none'}`} />;
}

export function Card({ decoration = 'none', decorationColor = 'red', shadow = 'lg', className = '', children, ...props }: CardProps) {
  return (
    <div className={['relative bg-white border-4 border-black', shadowClasses[shadow], className].filter(Boolean).join(' ')} {...props}>
      <DecorationShape shape={decoration} color={decorationColor} />
      {children}
    </div>
  );
}
