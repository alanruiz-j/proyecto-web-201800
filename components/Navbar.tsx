'use client';

// ── Imports ───────────────────────────────────────────────────────────────────
// useRef crea una referencia a un elemento del DOM sin causar re-renders.
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu, X, LogOut, BookOpen, Heart } from 'lucide-react';
import Button from './Button';
import { auth, logOut } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export default function Navbar() {
  const router = useRouter();

  // ── Estado ────────────────────────────────────────────────────────────────
  // mobileMenuOpen controla si el menú hamburguesa está abierto en pantallas pequeñas.
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  // userName y userEmail guardan los datos del usuario logueado para mostrarlos en el dropdown.
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');

  // ── Autenticación ─────────────────────────────────────────────────────────
  useEffect(() => {
    // Escuchar cambios de sesión en tiempo real; actualizar todos los datos del usuario.
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
      // ?? retorna el string de la derecha si el valor de la izquierda es null o undefined.
      setUserName(user?.displayName ?? '');
      setUserEmail(user?.email ?? '');
    });
    return unsubscribe;
  }, []);

  // dropdownOpen controla si el menú desplegable de "Cuenta" está visible.
  const [dropdownOpen, setDropdownOpen] = useState(false);
  // dropdownRef apunta al elemento div del dropdown para detectar clicks fuera de él.
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Cerrar el dropdown cuando el usuario hace click en cualquier parte fuera de él.
    const handleClickOutside = (event: MouseEvent) => {
      // .contains() verifica si el elemento clickeado está dentro del dropdown.
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    // addEventListener escucha el evento a nivel de todo el documento.
    document.addEventListener('mousedown', handleClickOutside);
    // Al desmontar, remover el listener para no acumular eventos duplicados.
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    await logOut();
    // Redirigir a la página de inicio después de cerrar sesión.
    router.push('/');
  };

  return (
    // sticky top-0 hace que el navbar se quede fijo en la parte superior al hacer scroll.
    // backdrop-blur-md aplica un desenfoque al contenido que queda detrás del navbar.
    <nav className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-[var(--border)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center">
              <span className="text-white font-bold text-sm">B</span>
            </div>
            <span className="font-bold text-xl text-[var(--foreground)]">BlogHub</span>
          </Link>

          {/* ── Links de navegación (solo visible en pantallas medianas y grandes) ── */}
          {/* hidden md:flex oculta este bloque en móvil y lo muestra en pantallas >= md */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/feed" className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
              Feed
            </Link>
            <Link href="/publicar" className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
              Publicar Blog
            </Link>
          </div>

          {/* ── Botones de auth (solo en pantallas medianas y grandes) ── */}
          <div className="hidden md:flex items-center gap-3">
            {/* Renderizado condicional: si está autenticado, mostrar dropdown; si no, botones de login */}
            {isAuthenticated ? (
              <div className="relative" ref={dropdownRef}>
                <Button
                  size="sm"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                >
                  Cuenta
                </Button>
                {/* El dropdown solo existe en el DOM cuando dropdownOpen es true */}
                {dropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-[var(--border)] py-2 z-50">
                    {/* Información del usuario logueado */}
                    <div className="px-4 py-3 border-b border-[var(--border)]">
                      {userName && <p className="text-sm font-semibold text-[var(--foreground)] truncate">{userName}</p>}
                      {userEmail && <p className="text-xs text-[var(--muted-foreground)] truncate">{userEmail}</p>}
                    </div>
                    <Link
                      href="/mis-blogs"
                      onClick={() => setDropdownOpen(false)}
                      className="w-full px-4 py-2 text-left text-[var(--foreground)] hover:bg-[var(--muted)] flex items-center gap-2 transition-colors"
                    >
                      <BookOpen size={16} />
                      Mis Blogs
                    </Link>
                    <Link
                      href="/favoritos"
                      onClick={() => setDropdownOpen(false)}
                      className="w-full px-4 py-2 text-left text-[var(--foreground)] hover:bg-[var(--muted)] flex items-center gap-2 transition-colors"
                    >
                      <Heart size={16} />
                      Favoritos
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                    >
                      <LogOut size={16} />
                      Cerrar Sesión
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">Iniciar Sesión</Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm">Crear Cuenta</Button>
                </Link>
              </>
            )}
          </div>

          {/* ── Botón hamburguesa (solo visible en móvil) ────────────────────── */}
          {/* md:hidden oculta este botón en pantallas medianas y grandes */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {/* Cambia el ícono según si el menú está abierto o cerrado */}
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* ── Menú móvil desplegable ────────────────────────────────────────── */}
      {/* Solo se renderiza cuando mobileMenuOpen es true */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-[var(--border)] px-4 py-4">
          <div className="flex flex-col gap-4">
            <Link href="/feed" className="py-2 text-[var(--foreground)]">
              Feed
            </Link>
            <Link href="/publicar" className="py-2 text-[var(--foreground)]">
              Publicar Blog
            </Link>
            <div className="flex gap-3 pt-2 border-t border-[var(--border)]">
              {isAuthenticated ? (
                <div className="w-full flex flex-col gap-2">
                  <div className="px-2 py-1">
                    {userName && <p className="text-sm font-semibold text-[var(--foreground)] truncate">{userName}</p>}
                    {userEmail && <p className="text-xs text-[var(--muted-foreground)] truncate">{userEmail}</p>}
                  </div>
                  <Link
                    href="/mis-blogs"
                    className="w-full px-4 py-2 text-[var(--foreground)] bg-[var(--muted)] rounded-full flex items-center justify-center gap-2 transition-colors"
                  >
                    <BookOpen size={16} />
                    Mis Blogs
                  </Link>
                  <Link
                    href="/favoritos"
                    className="w-full px-4 py-2 text-[var(--foreground)] bg-[var(--muted)] rounded-full flex items-center justify-center gap-2 transition-colors"
                  >
                    <Heart size={16} />
                    Favoritos
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-red-600 bg-red-50 rounded-full flex items-center justify-center gap-2 transition-colors"
                  >
                    <LogOut size={16} />
                    Cerrar Sesión
                  </button>
                </div>
              ) : (
                <>
                  <Link href="/login" className="flex-1">
                    <Button variant="ghost" size="sm" className="w-full">Iniciar Sesión</Button>
                  </Link>
                  <Link href="/signup" className="flex-1">
                    <Button size="sm" className="w-full">Crear Cuenta</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
