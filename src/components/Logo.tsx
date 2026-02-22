import { motion } from 'framer-motion';
import { clsx } from 'clsx';

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <motion.div 
      className={clsx("relative flex items-center justify-center", className || "w-8 h-8")}
      whileHover={{ rotate: 180 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-full h-full text-blue-500"
      >
        <circle cx="12" cy="12" r="10" className="stroke-current opacity-20" />
        <path d="M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z" className="fill-blue-500 stroke-blue-600" />
        <path d="M12 2v2M12 20v2M2 12h2M20 12h2" className="stroke-current opacity-50" />
      </svg>
    </motion.div>
  );
}
