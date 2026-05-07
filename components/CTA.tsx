'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Button from './Button';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export default function CTA() {
  // null = aún no sabemos si hay sesión; true/false = ya lo sabemos.
  // Empezar en null evita mostrar la sección un instante antes de saber el estado real.
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // onAuthStateChanged escucha cambios en la sesión en tiempo real.
    // Llama al callback cada vez que el usuario inicia o cierra sesión.
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user); // !! convierte el objeto user en true/false
    });
    // Retornar unsubscribe detiene la escucha cuando el componente se desmonta,
    // evitando actualizaciones de estado en componentes que ya no existen.
    return unsubscribe;
  }, []); // [] significa que este efecto solo corre una vez al montar el componente

  // Si aún no sabemos el estado de auth, o el usuario ya inició sesión: no renderizar nada.
  // Retornar null en React es la forma de no mostrar ningún elemento.
  if (isAuthenticated === null || isAuthenticated) return null;

  return (
    <section className="py-16 sm:py-24 bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1YWN0aW9uPSJjb2xvciI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIgZmlsbD0id2hpdGUiIG9wYWNpdHk9IjAuMSIvPjwvZz48L3N2Zz4=')] opacity-30" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            ¿Listo para compartir tu historia?
          </h2>
          <p className="text-lg sm:text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            Únete a nuestra comunidad de escritores y lectores. Comparte tu voz y conecta con historias que importan.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/signup">
              <Button
                size="lg"
                className="bg-[#0ea5e9] hover:bg-[#0284c7] text-white font-bold w-full sm:w-auto"
              >
                Crear Cuenta Gratis
                <ArrowRight className="ml-2" size={20} />
              </Button>
            </Link>
            <Link href="/login">
              <Button
                variant="outline"
                size="lg"
                className="border-white text-white hover:bg-white/10 w-full sm:w-auto"
              >
                Iniciar Sesión
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
