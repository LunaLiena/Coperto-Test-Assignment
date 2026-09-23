import { ButtonHTMLAttributes, forwardRef } from 'react';
import { Spinner } from './Spinner';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  isLoading?: boolean;
  loadingText?: string;
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: 'bg-accent text-white hover:bg-accent-hover disabled:bg-accent/50',
  secondary: 'bg-white text-ink border border-line hover:bg-canvas disabled:opacity-50',
  ghost: 'bg-transparent text-ink hover:bg-black/5 disabled:opacity-40',
  danger: 'bg-white text-accent border border-accent/40 hover:bg-accent-soft disabled:opacity-50',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = 'primary', isLoading = false, loadingText, disabled, className = '', children, ...props },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`inline-flex items-center justify-center gap-2 rounded-md px-3.5 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed ${VARIANT_CLASSES[variant]} ${className}`}
        {...props}
      >
        {isLoading && <Spinner />}
        <span>{isLoading && loadingText ? loadingText : children}</span>
      </button>
    );
  },
);

Button.displayName = 'Button';
