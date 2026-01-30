'use client';

import { forwardRef } from 'react';
import { LoaderIcon } from './icons';

/**
 * Button Component
 *
 * Unified button styles with variants for consistent UI across the app.
 */

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'instagram';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style variant */
  variant?: ButtonVariant;
  /** Size variant */
  size?: ButtonSize;
  /** Show loading spinner */
  isLoading?: boolean;
  /** Icon to show before text */
  leftIcon?: React.ReactNode;
  /** Icon to show after text */
  rightIcon?: React.ReactNode;
  /** Full width button */
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: `
    bg-[#E8734A] text-white
    hover:bg-[#D4623B]
    shadow-lg shadow-[#E8734A]/30
    disabled:bg-[#E8B4A0]
  `,
  secondary: `
    bg-white text-[#A47864]
    border border-[#E8B4A0]
    hover:bg-[#FDF8F6] hover:border-[#E8734A]
  `,
  ghost: `
    bg-transparent text-[#9A8A7C]
    hover:text-[#A47864]
  `,
  instagram: `
    bg-gradient-to-r from-[#E8734A] to-[#C13584] text-white
    hover:from-[#D4623B] hover:to-[#A02B70]
    shadow-lg shadow-[#E8734A]/30
  `,
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'py-2 px-4 text-sm rounded-lg',
  md: 'py-3 px-6 text-sm rounded-xl',
  lg: 'py-4 px-8 text-base rounded-xl',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = 'primary',
      size = 'lg',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      className = '',
      children,
      ...props
    },
    ref
  ) {
    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={`
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${fullWidth ? 'w-full max-w-[340px]' : ''}
          font-semibold
          transition-all duration-200 ease-out
          hover:-translate-y-0.5 active:translate-y-0
          flex items-center justify-center gap-2
          focus:outline-none focus:ring-2 focus:ring-[#E8734A] focus:ring-offset-2
          disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0
          ${className}
        `}
        {...props}
      >
        {isLoading ? (
          <LoaderIcon className="w-5 h-5 animate-spin" />
        ) : leftIcon ? (
          leftIcon
        ) : null}
        <span>{children}</span>
        {!isLoading && rightIcon}
      </button>
    );
  }
);

export default Button;
