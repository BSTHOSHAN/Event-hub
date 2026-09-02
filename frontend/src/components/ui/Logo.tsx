interface LogoProps {
  size?: 'sm' | 'lg';
}

export function Logo({ size = 'sm' }: LogoProps) {
  const shapeSize = size === 'lg' ? 'h-6 w-6' : 'h-4 w-4';
  const textSize = size === 'lg' ? 'text-3xl' : 'text-xl';

  return (
    <div className="inline-flex items-center gap-2">
      <span className="inline-flex items-center -space-x-1.5">
        <span className={`${shapeSize} rounded-full bg-primary-red border-2 border-black`} />
        <span className={`${shapeSize} rounded-none bg-primary-blue border-2 border-black rotate-12`} />
        <span
          className={`${shapeSize} bg-primary-yellow border-2 border-black`}
          style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}
        />
      </span>
      <span className={`${textSize} font-black uppercase tracking-tighter leading-none`}>Event Hub</span>
    </div>
  );
}
