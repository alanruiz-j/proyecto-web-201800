'use client';

// ── Imports ───────────────────────────────────────────────────────────────────
import { useEffect, useState } from 'react';
// useRouter permite navegar a otra página programáticamente (sin que el usuario haga click en un Link).
import { useRouter } from 'next/navigation';
// motion es un componente de Framer Motion que agrega animaciones fluidas.
import { motion } from 'framer-motion';
import { Sparkles, PenTool, ArrowRight } from 'lucide-react';
import Button from './Button';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export default function Hero() {
  // useRouter devuelve un objeto con métodos para navegar entre páginas.
  const router = useRouter();

  // ── Estado de autenticación ───────────────────────────────────────────────
  // false = no autenticado por defecto; se actualiza cuando Firebase responde.
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Escuchar cambios de sesión en tiempo real para saber si el usuario está logueado.
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
    });
    return unsubscribe; // Cancelar la suscripción al desmontar el componente
  }, []);

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white to-[var(--muted)] py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* grid divide la sección en 2 columnas en pantallas grandes */}
        <div className="grid lg:grid-cols-2 gap-12 items-center">

          {/* ── Columna izquierda: texto y botones ──────────────────────────── */}
          {/* initial/animate definen la animación de entrada: aparece deslizándose desde la izquierda */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] text-sm font-medium mb-6">
              <Sparkles size={16} />
              <span>La nueva forma de descubrir blogs</span>
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Comparte tus <span className="text-[var(--primary)]">historias</span> con el mundo
            </h1>
            <p className="text-lg sm:text-xl text-[var(--muted-foreground)] mb-8 max-w-lg">
              Descubre historias increíbles de creadores de todo el mundo. Comparte tu voz y conecta con una comunidad apasionada por la lectura.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              {/* El destino del botón cambia según si el usuario ya inició sesión o no */}
              <Button
                size="lg"
                className="w-full sm:w-auto"
                onClick={() => router.push(isAuthenticated ? '/publicar' : '/login')}
              >
                Empezar a Escribir
                <ArrowRight className="ml-2" size={20} />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto"
                onClick={() => router.push('/feed')}
              >
                Explorar Historias
              </Button>
            </div>
          </motion.div>

          {/* ── Columna derecha: tarjeta decorativa ─────────────────────────── */}
          {/* delay: 0.2 hace que esta columna aparezca 0.2s después que la izquierda */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative hidden lg:block"
          >
            <div className="relative w-full max-w-md mx-auto">
              {/* blur-3xl crea un efecto de resplandor de fondo */}
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/20 to-[var(--secondary)]/20 rounded-3xl blur-3xl" />
              <div className="relative bg-white rounded-3xl shadow-2xl p-6 border border-[var(--border)]">
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-[var(--border)]">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center">
                    <PenTool size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--foreground)]">Tu Dashboard</p>
                    <p className="text-sm text-[var(--muted-foreground)]">Comenzando</p>
                  </div>
                </div>
                {/* Bloques grises simulan líneas de texto (skeleton loader decorativo) */}
                <div className="space-y-3">
                  <div className="h-4 bg-[var(--muted)] rounded w-3/4" />
                  <div className="h-4 bg-[var(--muted)] rounded w-1/2" />
                  <div className="h-20 bg-[var(--muted)] rounded-lg" />
                </div>
                <div className="mt-4 pt-4 border-t border-[var(--border)] flex items-center justify-between">
                  <div className="flex -space-x-2">
                    <div className="w-8 h-8 rounded-full bg-[var(--primary)]/20" />
                    <div className="w-8 h-8 rounded-full bg-[var(--secondary)]/20" />
                    <div className="w-8 h-8 rounded-full bg-[var(--accent)]/20" />
                  </div>
                  <span className="text-sm text-[var(--muted-foreground)]">+124 lectores hoy</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
