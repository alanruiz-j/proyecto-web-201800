'use client';

// ── Imports ───────────────────────────────────────────────────────────────────
// useEffect ejecuta código después de que el componente aparece en pantalla.
// useState guarda un valor que, al cambiar, vuelve a renderizar el componente.
import { useEffect, useState } from 'react';
// Link de Next.js hace navegación entre páginas sin recargar toda la página.
import Link from 'next/link';
import { auth } from '../lib/firebase';
// onAuthStateChanged escucha en tiempo real si el usuario inicia o cierra sesión.
import { onAuthStateChanged } from 'firebase/auth';

export default function Footer() {
  // new Date().getFullYear() obtiene el año actual para el copyright dinámico.
  const currentYear = new Date().getFullYear();

  // ── Estado de autenticación ───────────────────────────────────────────────
  // false = usuario no autenticado por defecto; se actualiza cuando Firebase responde.
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Suscribirse a cambios de sesión. Cada vez que el usuario entra o sale, se actualiza isAuthenticated.
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user); // !! convierte el objeto user en true o false
    });
    // Al desmontar el componente, cancelamos la suscripción para evitar fugas de memoria.
    return unsubscribe;
  }, []); // [] significa que este efecto solo corre una vez al montar el componente

  return (
    <footer className="bg-[var(--foreground)] text-white py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-8 mb-8">
          {/* Logo + descripción */}
          <div className="max-w-xs">
            <Link href="/" className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center">
                <span className="text-white font-bold text-sm">B</span>
              </div>
              <span className="font-bold text-xl">BlogHub</span>
            </Link>
            <p className="text-white/60 text-sm">
              Descubre y comparte historias increíbles con nuestra comunidad.
            </p>
          </div>

          {/* Navegación */}
          <div className="flex gap-12">
            <div>
              <h4 className="font-semibold mb-3 text-sm">Explorar</h4>
              <ul className="space-y-2">
                <li><Link href="/feed" className="text-white/60 hover:text-white transition-colors text-sm">Feed</Link></li>
                <li><Link href="/publicar" className="text-white/60 hover:text-white transition-colors text-sm">Publicar Blog</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm">Mi Cuenta</h4>
              <ul className="space-y-2">
                <li><Link href="/mis-blogs" className="text-white/60 hover:text-white transition-colors text-sm">Mis Blogs</Link></li>
                <li><Link href="/favoritos" className="text-white/60 hover:text-white transition-colors text-sm">Favoritos</Link></li>
                {/* Solo mostramos Login/Signup si el usuario NO ha iniciado sesión */}
                {!isAuthenticated && (
                  <>
                    <li><Link href="/login" className="text-white/60 hover:text-white transition-colors text-sm">Iniciar Sesión</Link></li>
                    <li><Link href="/signup" className="text-white/60 hover:text-white transition-colors text-sm">Crear Cuenta</Link></li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-white/10">
          {/* {currentYear} inserta el año actual automáticamente en el texto */}
          <p className="text-white/40 text-sm text-center">
            © {currentYear} BlogHub. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
