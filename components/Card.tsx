'use client';

// forwardRef permite que el componente padre acceda directamente al elemento DOM interno.
// ReactNode es el tipo de TypeScript para cualquier cosa que React pueda renderizar (texto, elementos, etc.).
import { forwardRef, ReactNode } from 'react';
// motion es un componente de Framer Motion que agrega animaciones de entrada/salida.
import { motion } from 'framer-motion';

// ── Tipos ─────────────────────────────────────────────────────────────────────
// TypeScript: definimos qué valores acepta la prop "variant".
type CardVariant = 'default' | 'outlined' | 'filled';
type CardHover = boolean;

// La interfaz describe todas las props que acepta el componente Card.
// El signo ? indica que la prop es opcional (tiene un valor por defecto).
interface CardProps {
  variant?: CardVariant;
  hover?: CardHover;
  className?: string;
  children?: ReactNode;
  // onClick es una función que se ejecuta cuando el usuario hace click en la card.
  onClick?: () => void;
}

// forwardRef envuelve el componente para exponer el ref al padre si lo necesita.
const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', variant = 'default', hover = false, children, onClick }, ref) => {
    // Clases base que siempre se aplican, independientemente de la variante.
    const baseStyles = 'rounded-2xl bg-white transition-all duration-300';

    // Objeto que mapea cada variante a sus clases de Tailwind correspondientes.
    const variants: Record<CardVariant, string> = {
      default: 'shadow-md border border-[var(--border)]',
      outlined: 'border-2 border-[var(--border)]',
      filled: 'bg-[var(--card-bg)]',
    };

    // Si hover es true, se agregan clases para elevar la card al pasar el cursor.
    const hoverStyles = hover
      ? 'hover:shadow-xl hover:-translate-y-1 cursor-pointer'
      : '';

    return (
      // motion.div anima la entrada del componente: aparece desde abajo con opacidad 0.
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20 }}   // estado inicial antes de la animación
        animate={{ opacity: 1, y: 0 }}    // estado final después de la animación
        transition={{ duration: 0.3 }}    // duración de la transición en segundos
        // Template literals combinan múltiples strings de clases en uno solo.
        className={`${baseStyles} ${variants[variant]} ${hoverStyles} ${className}`}
        onClick={onClick}
      >
        {/* children renderiza todo lo que se ponga entre <Card>...</Card> */}
        {children}
      </motion.div>
    );
  }
);

// displayName ayuda a identificar el componente en las herramientas de desarrollo de React.
Card.displayName = 'Card';

export default Card;
