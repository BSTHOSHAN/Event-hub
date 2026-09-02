import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'yellow' | 'outline' | 'ghost';
type Shape = 'square' | 'pill';
type Size = 'md' | 'icon';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  shape?: Shape;
  size?: Size;
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-primary-red text-white border-black shadow-hard-sm hover:bg-primary-red/90 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none',
  secondary:
    'bg-primary-blue text-white border-black shadow-hard-sm hover:bg-primary-blue/90 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none',
  yellow:
    'bg-primary-yellow text-black border-black shadow-hard-sm hover:bg-primary-yellow/90 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none',
  outline:
    'bg-white text-black border-black shadow-hard-sm hover:bg-muted active:translate-x-[2px] active:translate-y-[2px] active:shadow-none',
  ghost: 'bg-transparent text-black border-transparent hover:bg-muted',
};

const shapeClasses: Record<Shape, string> = {
  square: 'rounded-none',
  pill: 'rounded-full',
};

const sizeClasses: Record<Size, string> = {
  md: 'px-5 py-2.5 text-sm gap-2',
  icon: 'p-2.5',
};

export function Button({ variant = 'primary', shape = 'square', size = 'md', className = '', children, ...props }: ButtonProps) {
  return (
    <button
      className={[
        'inline-flex items-center justify-center border-2 font-bold uppercase tracking-wide transition-all duration-200 ease-out disabled:opacity-50 disabled:pointer-events-none',
        variantClasses[variant],
        shapeClasses[shape],
        sizeClasses[size],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </button>
  );
}
