import { type ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export function Reveal({
  children,
  delay = 0,
  className = '',
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 22 }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function SectionKicker({
  index,
  children,
  dark = false,
}: {
  index: string;
  children: ReactNode;
  dark?: boolean;
}) {
  return (
    <div className={`section-kicker ${dark ? 'section-kicker-dark' : ''}`}>
      <span>{index}</span>
      <span className="kicker-line" />
      <span>{children}</span>
    </div>
  );
}
