/**
 * Apple Liquid Glass Button Component
 * Features translucent frosted refraction, underdamped spring physics (overshoot & settle),
 * and interactive elastic morphing on interaction.
 */

import React from 'react';
import { motion, HTMLMotionProps } from 'motion/react';

export interface LiquidGlassButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  children: React.ReactNode;
  variant?: 'default' | 'accent' | 'subtle' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  className?: string;
}

export const LiquidGlassButton: React.FC<LiquidGlassButtonProps> = ({
  children,
  variant = 'default',
  size = 'md',
  icon,
  className = '',
  disabled,
  onClick,
  ...props
}) => {
  const sizeClasses = {
    sm: 'px-3 py-1 text-xs gap-1.5 h-8 font-medium',
    md: 'px-4 py-2 text-xs font-semibold gap-2 h-9 tracking-tight',
    lg: 'px-5 py-2.5 text-sm font-semibold gap-2.5 h-11 tracking-tight',
  }[size];

  const variantClasses = {
    default:
      'liquid-glass-btn text-slate-800 dark:text-slate-100 border-slate-300/80 dark:border-white/10 hover:border-sky-500/60 dark:hover:border-cyan-400/60 shadow-sm',
    accent:
      'liquid-glass-btn liquid-glass-accent text-white border-white/30 shadow-[0_4px_20px_rgba(0,113,227,0.35)]',
    subtle:
      'liquid-glass-btn bg-white/50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 border-slate-200/90 dark:border-slate-700/60 hover:bg-white/80 dark:hover:bg-slate-800/80',
    danger:
      'liquid-glass-btn bg-rose-500/10 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300 border-rose-300/80 dark:border-rose-800/60 hover:border-rose-500',
    ghost:
      'bg-transparent hover:bg-slate-200/50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300 rounded-full transition-colors',
  }[variant];

  return (
    <motion.button
      whileHover={
        disabled
          ? undefined
          : {
              scale: 1.03,
              y: -1.2,
            }
      }
      whileTap={
        disabled
          ? undefined
          : {
              scaleX: 1.035, // Physical elastic morphing (slight lateral spread)
              scaleY: 0.935, // Physical gel compression
              y: 1.5,
            }
      }
      transition={{
        type: 'spring',
        stiffness: 480,
        damping: 18,
        mass: 0.65,
      }}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center font-sans select-none ${sizeClasses} ${variantClasses} ${
        disabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''
      } ${className}`}
      {...props}
    >
      {icon && <span className="shrink-0 flex items-center justify-center">{icon}</span>}
      <span className="truncate">{children}</span>
    </motion.button>
  );
};

export default LiquidGlassButton;
