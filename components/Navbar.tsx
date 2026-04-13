'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Menu, X, LogOut } from 'lucide-react';
import Button from './Button';

export default function Navbar() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('authToken');
    router.push('/');
  };

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-[var(--border)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center">
              <span className="text-white font-bold text-sm">B</span>
            </div>
            <span className="font-bold text-xl text-[var(--foreground)]">BlogHub</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
              Explorar
            </Link>
            <Link href="/" className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
              Comunidad
            </Link>
            <Link href="/" className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
              Creadores
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" size={18} />
              <input
                type="text"
                placeholder="Buscar blogs..."
                className="pl-10 pr-4 py-2 rounded-full bg-[var(--muted)] text-sm w-48 lg:w-64 focus:w-72 lg:focus:w-80 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              />
            </div>
            {isAuthenticated ? (
              <div className="relative" ref={dropdownRef}>
                <Button 
                  size="sm" 
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                >
                  Cuenta
                </Button>
                {dropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-[var(--border)] py-2 z-50">
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

          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-[var(--border)] px-4 py-4">
          <div className="flex flex-col gap-4">
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" size={18} />
              <input
                type="text"
                placeholder="Buscar blogs..."
                className="w-full pl-10 pr-4 py-2 rounded-full bg-[var(--muted)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              />
            </div>
            <Link href="/" className="py-2 text-[var(--foreground)]">
              Explorar
            </Link>
            <Link href="/" className="py-2 text-[var(--foreground)]">
              Comunidad
            </Link>
            <Link href="/" className="py-2 text-[var(--foreground)]">
              Creadores
            </Link>
            <div className="flex gap-3 pt-2 border-t border-[var(--border)]">
              {isAuthenticated ? (
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-red-600 bg-red-50 rounded-full flex items-center justify-center gap-2 transition-colors"
                >
                  <LogOut size={16} />
                  Cerrar Sesión
                </button>
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