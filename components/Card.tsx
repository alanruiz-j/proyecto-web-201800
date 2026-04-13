'use client';

import { forwardRef, ReactNode } from 'react';
import { motion } from 'framer-motion';

type CardVariant = 'default' | 'outlined' | 'filled';
type CardHover = boolean;

interface CardProps {
  variant?: CardVariant;
  hover?: CardHover;
  className?: string;
  children?: ReactNode;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', variant = 'default', hover = false, children }, ref) => {
    const baseStyles = 'rounded-2xl bg-white transition-all duration-300';
    
    const variants: Record<CardVariant, string> = {
      default: 'shadow-md border border-[var(--border)]',
      outlined: 'border-2 border-[var(--border)]',
      filled: 'bg-[var(--card-bg)]',
    };

    const hoverStyles = hover 
      ? 'hover:shadow-xl hover:-translate-y-1 cursor-pointer' 
      : '';

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`${baseStyles} ${variants[variant]} ${hoverStyles} ${className}`}
      >
        {children}
      </motion.div>
    );
  }
);

Card.displayName = 'Card';

export default Card;