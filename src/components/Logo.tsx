import Image from 'next/image';
import Link from 'next/link';

type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface LogoProps {
  size?: Size;
  href?: string | null;
  className?: string;
  priority?: boolean;
}

const HEIGHT: Record<Size, string> = {
  xs: 'h-10',
  sm: 'h-14',
  md: 'h-20',
  lg: 'h-28',
  xl: 'h-36',
};

export default function Logo({
  size = 'md',
  href = '/',
  className = '',
  priority = false,
}: LogoProps) {
  const img = (
    <Image
      src="/xhunt-logo.png"
      alt="X-Hunt"
      width={3945}
      height={2946}
      priority={priority}
      className={`w-auto object-contain ${HEIGHT[size]} ${className}`}
    />
  );

  if (href !== null) {
    return (
      <Link href={href} className="flex-shrink-0 inline-flex items-center">
        {img}
      </Link>
    );
  }
  return img;
}
