/**
 * Dock Component (adapted from React Bits)
 */

import React, { Children, cloneElement, useEffect, useMemo, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'motion/react';
import { ChevronDown } from 'lucide-react';
import './Dock.css';

export interface DockItemData {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  className?: string;
  active?: boolean;
}

interface DockItemProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  mouseX: any;
  spring: { mass: number; stiffness: number; damping: number };
  distance: number;
  magnification: number;
  baseItemSize: number;
  label: string;
  active?: boolean;
}

function DockItem({
  children,
  className = '',
  onClick,
  mouseX,
  spring,
  distance,
  magnification,
  baseItemSize,
  label,
  active,
}: DockItemProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);
  const isHoveredMotion = useMotionValue(0);

  const mouseDistance = useTransform(mouseX, (val: number) => {
    const rect = ref.current?.getBoundingClientRect() ?? {
      x: 0,
      width: baseItemSize,
    };
    return val - rect.x - baseItemSize / 2;
  });

  const targetSize = useTransform(
    mouseDistance,
    [-distance, 0, distance],
    [baseItemSize, magnification, baseItemSize]
  );
  const size = useSpring(targetSize, spring);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.();
    }
  };

  return (
    <motion.div
      ref={ref}
      style={{
        width: size,
        height: size,
      }}
      onMouseEnter={() => {
        setHovered(true);
        isHoveredMotion.set(1);
      }}
      onMouseLeave={() => {
        setHovered(false);
        isHoveredMotion.set(0);
      }}
      onHoverStart={() => {
        setHovered(true);
        isHoveredMotion.set(1);
      }}
      onHoverEnd={() => {
        setHovered(false);
        isHoveredMotion.set(0);
      }}
      onFocus={() => {
        setHovered(true);
        isHoveredMotion.set(1);
      }}
      onBlur={() => {
        setHovered(false);
        isHoveredMotion.set(0);
      }}
      onClick={onClick}
      className={`dock-item ${active ? 'dock-item-active border-cyan-500 bg-cyan-950/40 text-cyan-300' : ''} ${className}`}
      tabIndex={0}
      role="button"
      aria-haspopup="true"
      aria-label={label}
      onKeyDown={handleKeyDown}
    >
      {Children.map(children, (child) =>
        React.isValidElement(child) ? cloneElement(child, { isHovered: hovered } as any) : child
      )}
    </motion.div>
  );
}

function DockLabel({ children, className = '', isHovered = false }: any) {
  return (
    <AnimatePresence>
      {isHovered && (
        <motion.div
          initial={{ opacity: 0, y: 5, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 3, scale: 0.92 }}
          transition={{ duration: 0.15 }}
          className={`dock-label ${className}`}
          role="tooltip"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function DockIcon({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`dock-icon ${className}`}>{children}</div>;
}

export interface DockProps {
  items: DockItemData[];
  className?: string;
  spring?: { mass: number; stiffness: number; damping: number };
  magnification?: number;
  distance?: number;
  panelHeight?: number;
  dockHeight?: number;
  baseItemSize?: number;
  onHide?: () => void;
}

export const Dock: React.FC<DockProps> = ({
  items,
  className = '',
  spring = { mass: 0.1, stiffness: 150, damping: 12 },
  magnification = 52,
  distance = 140,
  panelHeight = 44,
  dockHeight = 64,
  baseItemSize = 36,
  onHide,
}) => {
  const mouseX = useMotionValue(Infinity);
  const isHovered = useMotionValue(0);

  const maxHeight = useMemo(
    () => Math.max(dockHeight, magnification + 12),
    [magnification, dockHeight]
  );
  const heightRow = useTransform(isHovered, [0, 1], [panelHeight, maxHeight]);
  const height = useSpring(heightRow, spring);

  return (
    <motion.div style={{ height, scrollbarWidth: 'none' }} className="dock-outer">
      <motion.div
        onMouseMove={({ pageX }) => {
          isHovered.set(1);
          mouseX.set(pageX);
        }}
        onMouseLeave={() => {
          isHovered.set(0);
          mouseX.set(Infinity);
        }}
        className={`dock-panel ${className}`}
        style={{ minHeight: panelHeight }}
        role="toolbar"
        aria-label="Station Quick Navigation"
      >
        {items.map((item, index) => (
          <DockItem
            key={index}
            onClick={item.onClick}
            className={item.className}
            mouseX={mouseX}
            spring={spring}
            distance={distance}
            magnification={magnification}
            baseItemSize={baseItemSize}
            label={item.label}
            active={item.active}
          >
            <DockIcon>{item.icon}</DockIcon>
            <DockLabel>{item.label}</DockLabel>
          </DockItem>
        ))}

        {/* Integrated Hide Button right inside the Dock pill */}
        {onHide && (
          <>
            <div className="w-[1px] h-5 bg-sky-300/60 dark:bg-cyan-800/80 mx-0.5 shrink-0 self-center" />
            <motion.button
              whileHover={{ scale: 1.15, y: 1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                onHide();
              }}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-sky-700 dark:text-cyan-300 hover:text-sky-950 dark:hover:text-white bg-sky-100/70 hover:bg-sky-200 dark:bg-cyan-950/70 dark:hover:bg-cyan-900 border border-sky-300/80 dark:border-cyan-600/70 shadow-[0_0_12px_rgba(6,182,212,0.4)] hover:shadow-[0_0_18px_rgba(6,182,212,0.7)] transition-all shrink-0 cursor-pointer self-center"
              title="Hide Navigation Dock (Click arrow to hide)"
              aria-label="Hide navigation dock"
            >
              <ChevronDown className="w-4 h-4 text-sky-700 dark:text-cyan-300" />
            </motion.button>
          </>
        )}
      </motion.div>
    </motion.div>
  );
};

export default Dock;
