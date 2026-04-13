'use client';

import Link from 'next/link';
import { Mail, Send } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[var(--foreground)] text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center">
                <span className="text-white font-bold text-sm">B</span>
              </div>
              <span className="font-bold text-xl">BlogHub</span>
            </Link>
            <p className="text-white/60 text-sm mb-4">
              La plataforma perfecta para descubrir y compartir historias increíbles con el mundo.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-white/60 hover:text-white transition-colors">
                <Send size={20} />
              </a>
              <a href="#" className="text-white/60 hover:text-white transition-colors">
                <Mail size={20} />
              </a>
              <a href="#" className="text-white/60 hover:text-white transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.52.26 3.76 1.98-.14.08-.33.26-.58.26-.38 0-.73-.36-.83-.56-.2-.45-.61-.89-.86-1.23-.17-.23-.45-.51-.04-.72.2-.1.42-.12.62-.12.42 0 1.09.56 2.41.44 1.62-.15 2.82-1.04 3.41-2.29.6 1.39 1.65 2.91 3.1 2.91 1.79 0 2.99-.98 3.29-1.85.01-.03.04-.07.06-.1-.1-.06-.2-.12-.29-.17z" /></svg>
              </a>
              <a href="#" className="text-white/60 hover:text-white transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Explorar</h4>
            <ul className="space-y-2">
              <li><Link href="/" className="text-white/60 hover:text-white transition-colors">Últimas Historias</Link></li>
              <li><Link href="/" className="text-white/60 hover:text-white transition-colors">Más Vistas</Link></li>
              <li><Link href="/" className="text-white/60 hover:text-white transition-colors">Creadores Populares</Link></li>
              <li><Link href="/" className="text-white/60 hover:text-white transition-colors">Categorías</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Comunidad</h4>
            <ul className="space-y-2">
              <li><Link href="/" className="text-white/60 hover:text-white transition-colors">Acerca de</Link></li>
              <li><Link href="/" className="text-white/60 hover:text-white transition-colors">Únete al Equipo</Link></li>
              <li><Link href="/" className="text-white/60 hover:text-white transition-colors">Blog</Link></li>
              <li><Link href="/" className="text-white/60 hover:text-white transition-colors">Ayuda</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Newsletter</h4>
            <p className="text-white/60 text-sm mb-4">
              Recibe las mejores historias directamente en tu correo.
            </p>
            <form className="flex gap-2">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" size={16} />
                <input
                  type="email"
                  placeholder="Tu correo"
                  className="w-full pl-10 pr-4 py-2 rounded-full bg-white/10 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 rounded-full bg-[var(--primary)] text-white font-medium hover:bg-[var(--primary-hover)] transition-colors"
              >
                Unirse
              </button>
            </form>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/40 text-sm">
            © {currentYear} BlogHub. Todos los derechos reservados.
          </p>
          <div className="flex gap-6 text-sm">
            <Link href="/" className="text-white/40 hover:text-white transition-colors">Términos</Link>
            <Link href="/" className="text-white/40 hover:text-white transition-colors">Privacidad</Link>
            <Link href="/" className="text-white/40 hover:text-white transition-colors">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}