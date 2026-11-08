'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useMotionValue, animate } from 'motion/react';
import { X } from 'lucide-react';
import { Button } from 'glisse';
import { projectMomentum, rubberband } from '@/lib/sniper-engine';

interface FluidSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

interface VelocitySample {
  y: number;
  t: number;
}

export function FluidSheet({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
}: FluidSheetProps) {
  const y = useMotionValue(0);
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const grabOffsetRef = useRef<number>(0);
  const startYRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);
  const samplesRef = useRef<VelocitySample[]>([]);
  const [isPressed, setIsPressed] = useState(false);

  useEffect(() => {
    if (isOpen) {
      y.set(0);
    }
  }, [isOpen, y]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!sheetRef.current) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    isDraggingRef.current = true;
    setIsPressed(true);

    // Stop any running animation and start from the current presentation value (Interruptibility principle)
    y.stop();
    const currentY = y.get();
    startYRef.current = e.clientY - currentY;
    grabOffsetRef.current = e.clientY - sheetRef.current.getBoundingClientRect().top;
    samplesRef.current = [{ y: e.clientY, t: performance.now() }];
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    const rawDelta = e.clientY - startYRef.current;
    const height = sheetRef.current?.offsetHeight || 520;

    // Apply progressive rubber-banding when pulling upward past top boundary
    const nextY = rawDelta < 0 ? rubberband(rawDelta, height, 0.55) : rawDelta;
    y.set(nextY);

    const now = performance.now();
    samplesRef.current.push({ y: e.clientY, t: now });
    if (samplesRef.current.length > 6) {
      samplesRef.current.shift();
    }
  };

  const handlePointerUpOrCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsPressed(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignore if pointer capture already released
    }

    // Calculate release velocity (px/s) from tracked pointer history
    const samples = samplesRef.current;
    let velocityPxPerSec = 0;
    if (samples.length >= 2) {
      const first = samples[0];
      const last = samples[samples.length - 1];
      const dt = (last.t - first.t) / 1000;
      if (dt > 0.005) {
        velocityPxPerSec = (last.y - first.y) / dt;
      }
    }

    const currentY = y.get();
    const sheetHeight = sheetRef.current?.offsetHeight || 520;
    const projectedEnd = currentY + projectMomentum(velocityPxPerSec, 0.996);

    if ((projectedEnd > sheetHeight * 0.38 || currentY > sheetHeight * 0.45) && velocityPxPerSec >= -80) {
      animate(y, sheetHeight + 40, {
        type: 'spring',
        bounce: 0.15,
        duration: 0.32,
        velocity: velocityPxPerSec,
        onComplete: () => onClose(),
      });
    } else {
      animate(y, 0, {
        type: 'spring',
        bounce: 0.18,
        duration: 0.34,
        velocity: velocityPxPerSec,
      });
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          {/* Scrim backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/55 backdrop-blur-md"
          />

          {/* Draggable Apple Liquid Glass Sheet Surface */}
          <motion.div
            ref={sheetRef}
            style={{
              y,
              backgroundColor: 'var(--lg-surface)',
              boxShadow:
                'inset 0 0 0 0.5px var(--lg-surface-edge), 0 24px 80px var(--lg-shadow)',
            }}
            initial={{ opacity: 0, scale: 0.97, y: 60 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 60 }}
            transition={{ type: 'spring', bounce: 0.15, duration: 0.34 }}
            className="relative z-10 w-full sm:max-w-xl max-h-[88vh] flex flex-col rounded-t-[26px] sm:rounded-[26px] backdrop-blur-2xl overflow-hidden"
          >
            {/* Interactive Drag Handle Zone (1:1 pointer tracking + rubber-banding) */}
            <div
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUpOrCancel}
              onPointerCancel={handlePointerUpOrCancel}
              className="pt-3 pb-3 px-6 cursor-grab active:cursor-grabbing select-none touch-none lg-hairline-b"
            >
              <div className="flex justify-center mb-2.5">
                <div
                  className={`h-1 rounded-full transition-all duration-150 ${
                    isPressed ? 'w-12 opacity-90' : 'w-9 opacity-45'
                  }`}
                  style={{ backgroundColor: 'var(--lg-foreground)' }}
                />
              </div>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-semibold tracking-tight text-[var(--lg-foreground)]">
                    {title}
                  </h2>
                  {subtitle && (
                    <p className="text-xs text-[var(--lg-muted)] mt-0.5">{subtitle}</p>
                  )}
                </div>
                <Button
                  variant="glass"
                  onClick={onClose}
                  aria-label={`Close ${title}`}
                  icon={<X className="w-4 h-4" />}
                />
              </div>
            </div>

            {/* Sheet Scrollable Content */}
            <div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar space-y-5">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
