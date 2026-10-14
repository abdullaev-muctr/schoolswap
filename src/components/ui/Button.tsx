import type { ButtonHTMLAttributes } from 'react';
import { Link, type LinkProps } from 'react-router-dom';

type Variant = 'default' | 'primary' | 'light' | 'danger' | 'news' | 'news-outline';

interface StyleProps {
  variant?: Variant;
  size?: 'md' | 'sm';
  block?: boolean;
}

function buttonClass({ variant = 'default', size = 'md', block = false }: StyleProps, extra?: string) {
  return [
    'btn',
    variant !== 'default' && `btn--${variant}`,
    size === 'sm' && 'btn--sm',
    block && 'btn--block',
    extra,
  ]
    .filter(Boolean)
    .join(' ');
}

export function Button({
  variant,
  size,
  block,
  className,
  type = 'button',
  ...rest
}: StyleProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type={type} className={buttonClass({ variant, size, block }, className)} {...rest} />;
}

export function ButtonLink({ variant, size, block, className, ...rest }: StyleProps & LinkProps) {
  return <Link className={buttonClass({ variant, size, block }, className)} {...rest} />;
}
