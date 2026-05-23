import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { useState } from 'react';

interface IncognitoIconProps {
  className?: string;
  /** Size variant: 'sm' for tabs (14px), 'md' for sidebar (20px), 'lg' for NewTabPage (64px) */
  size?: 'sm' | 'md' | 'lg';
  /** Enable hover eye animation */
  animated?: boolean;
  /** Purple glow effect */
  glow?: boolean;
}

export function IncognitoIcon({ className, size = 'md', animated = true, glow = false }: IncognitoIconProps) {
  const [isHovered, setIsHovered] = useState(false);

  const sizeClasses = {
    sm: 'w-3.5 h-3.5',
    md: 'w-5 h-5',
    lg: 'w-16 h-16',
  };

  return (
    <motion.div
      className={clsx('relative flex items-center justify-center', sizeClasses[size], className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={animated ? { scale: 1.08 } : undefined}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      {/* Optional glow backdrop */}
      {glow && (
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(148,163,184,0.18) 0%, transparent 70%)',
            filter: 'blur(8px)',
          }}
          animate={{ opacity: isHovered ? 0.8 : 0.4, scale: isHovered ? 1.6 : 1.3 }}
          transition={{ duration: 0.4 }}
        />
      )}

      <svg
        viewBox="2 8 60 42"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* ─── Hat brim ─── */}
        <motion.path
          d="M8 32h48"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          initial={false}
          animate={{ pathLength: isHovered && animated ? [0, 1] : 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />

        {/* ─── Hat dome ─── */}
        <motion.path
          d="M18 32v-6c0-7.732 6.268-14 14-14s14 6.268 14 14v6"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* ─── Hat crown fill (subtle) ─── */}
        <path
          d="M22 32v-6c0-5.523 4.477-10 10-10s10 4.477 10 10v6"
          fill="currentColor"
          opacity="0.08"
        />

        {/* ─── Hat ribbon/band ─── */}
        <path
          d="M20 29h24"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.3"
        />

        {/* ─── Left lens ─── */}
        <motion.rect
          x="14"
          y="36"
          width="14"
          height="10"
          rx="5"
          stroke="currentColor"
          strokeWidth="2.5"
          fill="currentColor"
          fillOpacity="0.12"
          animate={isHovered && animated ? { fillOpacity: 0.2 } : { fillOpacity: 0.12 }}
          transition={{ duration: 0.3 }}
        />

        {/* ─── Right lens ─── */}
        <motion.rect
          x="36"
          y="36"
          width="14"
          height="10"
          rx="5"
          stroke="currentColor"
          strokeWidth="2.5"
          fill="currentColor"
          fillOpacity="0.12"
          animate={isHovered && animated ? { fillOpacity: 0.2 } : { fillOpacity: 0.12 }}
          transition={{ duration: 0.3 }}
        />

        {/* ─── Bridge ─── */}
        <motion.path
          d="M28 41c1.5-2 6.5-2 8 0"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />

        {/* ─── Left eye (pupil) ─── */}
        <motion.circle
          cx="21"
          cy="41"
          r="1.8"
          fill="currentColor"
          opacity="0.7"
          animate={
            isHovered && animated
              ? { cx: [21, 23, 19, 21], cy: [41, 40, 42, 41], scale: [1, 1.1, 1.1, 1] }
              : { cx: 21, cy: 41, scale: 1 }
          }
          transition={{
            duration: 0.8,
            ease: 'easeInOut',
            repeat: isHovered ? Infinity : 0,
            repeatDelay: 0.5,
          }}
        />

        {/* ─── Right eye (pupil) ─── */}
        <motion.circle
          cx="43"
          cy="41"
          r="1.8"
          fill="currentColor"
          opacity="0.7"
          animate={
            isHovered && animated
              ? { cx: [43, 45, 41, 43], cy: [41, 40, 42, 41], scale: [1, 1.1, 1.1, 1] }
              : { cx: 43, cy: 41, scale: 1 }
          }
          transition={{
            duration: 0.8,
            ease: 'easeInOut',
            repeat: isHovered ? Infinity : 0,
            repeatDelay: 0.5,
          }}
        />

        {/* ─── Eye shine (left) ─── */}
        <motion.circle
          cx="19.5"
          cy="39.8"
          r="0.8"
          fill="white"
          opacity="0"
          animate={isHovered && animated ? { opacity: [0, 0.6, 0.6, 0] } : { opacity: 0 }}
          transition={{ duration: 0.8, ease: 'easeInOut', repeat: isHovered ? Infinity : 0, repeatDelay: 0.5 }}
        />

        {/* ─── Eye shine (right) ─── */}
        <motion.circle
          cx="41.5"
          cy="39.8"
          r="0.8"
          fill="white"
          opacity="0"
          animate={isHovered && animated ? { opacity: [0, 0.6, 0.6, 0] } : { opacity: 0 }}
          transition={{ duration: 0.8, ease: 'easeInOut', repeat: isHovered ? Infinity : 0, repeatDelay: 0.5 }}
        />
      </svg>
    </motion.div>
  );
}
