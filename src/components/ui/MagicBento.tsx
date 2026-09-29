/**
 * MagicBento Grid & Card Components
 * Advanced interactive Bento layout with BorderGlow refraction,
 * dynamic mouse spotlight illumination, and Apple Liquid Glass styling.
 */

import React, { useRef, useCallback } from 'react';
import { BorderGlow } from './BorderGlow';
import './MagicBento.css';

export interface MagicBentoGridProps {
  children: React.ReactNode;
  className?: string;
  cols?: 12 | 6 | 4 | 3 | 2;
}

export const MagicBentoGrid: React.FC<MagicBentoGridProps> = ({
  children,
  className = '',
  cols = 12,
}) => {
  const gridRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!gridRef.current) return;
    const rect = gridRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    gridRef.current.style.setProperty('--mouse-x', `${x}px`);
    gridRef.current.style.setProperty('--mouse-y', `${y}px`);
  }, []);

  const colsClass =
    cols === 12
      ? 'grid-cols-1 md:grid-cols-6 lg:grid-cols-12'
      : cols === 6
      ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6'
      : cols === 4
      ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
      : cols === 3
      ? 'grid-cols-1 md:grid-cols-3'
      : 'grid-cols-1 md:grid-cols-2';

  return (
    <div
      ref={gridRef}
      onMouseMove={handleMouseMove}
      className={`magic-bento-grid ${colsClass} ${className}`}
    >
      {children}
    </div>
  );
};

export type BentoGlowColor = 'cyan' | 'blue' | 'amber' | 'emerald' | 'rose' | 'violet';

const GLOW_PALETTE: Record<
  BentoGlowColor,
  { hsl: string; colors: string[]; spotlight: string; cornerText: string }
> = {
  cyan: {
    hsl: '190 85 58',
    colors: ['#0284c7', '#38bdf8', '#0ea5e9'],
    spotlight: 'rgba(56, 189, 248, 0.16)',
    cornerText: 'text-cyan-500/60 dark:text-cyan-400/60',
  },
  blue: {
    hsl: '215 88 56',
    colors: ['#0071e3', '#3b82f6', '#60a5fa'],
    spotlight: 'rgba(59, 130, 246, 0.16)',
    cornerText: 'text-sky-500/60 dark:text-sky-400/60',
  },
  amber: {
    hsl: '38 92 50',
    colors: ['#d97706', '#f59e0b', '#fbbf24'],
    spotlight: 'rgba(245, 158, 11, 0.16)',
    cornerText: 'text-amber-500/60 dark:text-amber-400/60',
  },
  emerald: {
    hsl: '152 76 46',
    colors: ['#059669', '#10b981', '#34d399'],
    spotlight: 'rgba(16, 185, 129, 0.16)',
    cornerText: 'text-emerald-500/60 dark:text-emerald-400/60',
  },
  rose: {
    hsl: '346 84 55',
    colors: ['#e11d48', '#f43f5e', '#fb7185'],
    spotlight: 'rgba(244, 63, 94, 0.16)',
    cornerText: 'text-rose-500/60 dark:text-rose-400/60',
  },
  violet: {
    hsl: '265 83 62',
    colors: ['#7c3aed', '#8b5cf6', '#a78bfa'],
    spotlight: 'rgba(139, 92, 246, 0.16)',
    cornerText: 'text-violet-500/60 dark:text-violet-400/60',
  },
};

export interface MagicBentoCardProps {
  children: React.ReactNode;
  className?: string;
  colSpan?: string; // e.g. "col-span-12 lg:col-span-4"
  glowColor?: BentoGlowColor;
  customGlowHsl?: string;
  glowIntensity?: number;
  edgeSensitivity?: number;
  borderRadius?: number;
  showCorners?: boolean;
  showMesh?: boolean;
  onClick?: () => void;
  contentClassName?: string;
}

export const MagicBentoCard: React.FC<MagicBentoCardProps> = ({
  children,
  className = '',
  colSpan = 'col-span-12',
  glowColor = 'cyan',
  customGlowHsl,
  glowIntensity = 1.0,
  edgeSensitivity = 28,
  borderRadius = 20,
  showCorners = true,
  showMesh = true,
  onClick,
  contentClassName,
}) => {
  const cardWrapperRef = useRef<HTMLDivElement>(null);
  const palette = GLOW_PALETTE[glowColor] || GLOW_PALETTE.cyan;

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!cardWrapperRef.current) return;
    const rect = cardWrapperRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    cardWrapperRef.current.style.setProperty('--card-mouse-x', `${x}px`);
    cardWrapperRef.current.style.setProperty('--card-mouse-y', `${y}px`);
  }, []);

  return (
    <div
      ref={cardWrapperRef}
      onPointerMove={handlePointerMove}
      onClick={onClick}
      className={`magic-bento-card-wrapper ${colSpan}`}
      style={
        {
          '--card-spotlight-color': palette.spotlight,
        } as React.CSSProperties
      }
    >
      <BorderGlow
        className={`magic-bento-item ${className}`}
        glowColor={customGlowHsl || palette.hsl}
        colors={palette.colors}
        glowIntensity={glowIntensity}
        edgeSensitivity={edgeSensitivity}
        borderRadius={borderRadius}
      >
        {/* Ambient Mouse Spotlight inside the card */}
        <div className="magic-bento-spotlight" />

        {/* Subtle grid mesh texture */}
        {showMesh && <div className="magic-bento-mesh" />}

        {/* Corner Reticle Markers */}
        {showCorners && (
          <>
            <span className={`magic-bento-corner magic-bento-corner-tl ${palette.cornerText}`} />
            <span className={`magic-bento-corner magic-bento-corner-tr ${palette.cornerText}`} />
            <span className={`magic-bento-corner magic-bento-corner-bl ${palette.cornerText}`} />
            <span className={`magic-bento-corner magic-bento-corner-br ${palette.cornerText}`} />
          </>
        )}

        {/* Card Content */}
        <div className={`relative z-10 w-full h-full flex flex-col ${contentClassName || 'p-4 sm:p-5'}`}>
          {children}
        </div>
      </BorderGlow>
    </div>
  );
};

export default MagicBentoCard;
