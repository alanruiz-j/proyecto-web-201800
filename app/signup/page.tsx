'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Feather, ArrowRight, Check, X } from 'lucide-react';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { signInWithGoogle, auth } from '../../lib/firebase';

interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
}

const passwordRequirements: PasswordRequirement[] = [
  { label: 'Al menos 8 caracteres', test: (p) => p.length >= 8 },
  { label: 'Una letra mayúscula', test: (p) => /[A-Z]/.test(p) },
  { label: 'Una letra minúscula', test: (p) => /[a-z]/.test(p) },
  { label: 'Un número', test: (p) => /\d/.test(p) },
  { label: 'Un carácter especial', test: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
];

function getPasswordStrength(password: string): number {
  if (!password) return 0;
  const passed = passwordRequirements.filter((req) => req.test(password)).length;
  return Math.min(passed, 5);
}

function getStrengthColor(strength: number): string {
  if (strength <= 1) return 'bg-red-500';
  if (strength <= 2) return 'bg-orange-500';
  if (strength <= 3) return 'bg-yellow-500';
  if (strength <= 4) return 'bg-lime-500';
  return 'bg-green-500';
}

function getStrengthLabel(strength: number): string {
  if (strength === 0) return '';
  if (strength <= 1) return 'Débil';
  if (strength <= 2) return 'Regular';
  if (strength <= 3) return 'Buena';
  if (strength <= 4) return 'Fuerte';
  return 'Muy Fuerte';
}

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    acceptTerms: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const passwordStrength = useMemo(() => getPasswordStrength(formData.password), [formData.password]);

  const handleGoogleSignup = async () => {
    setLoading(true);
    setError('');

    const result = await signInWithGoogle();
    if (result.success) {
      router.push('/');
    } else {
      setError('Error al registrarte con Google');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[var(--secondary)] via-[var(--accent)] to-[var(--primary)] relative"
      >
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1YWN0aW9uPSJjb2xvciI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIgZmlsbD0id2hpdGUiIG9wYWNpdHk9IjAuMSIvPjwvZz48L3N2Zz4=')] opacity-30" />
        <div className="relative z-10 flex flex-col items-center justify-center p-12 text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center max-w-md"
          >
            <div className="w-20 h-20 mx-auto mb-8 rounded-3xl bg-white/20 flex items-center justify-center">
              <Feather size={40} className="text-white" />
            </div>
            <h2 className="text-3xl font-bold mb-4">Crea tu cuenta</h2>
            <p className="text-white/80 text-lg">
              "Cada historia merece ser contada." - Anónimo
            </p>
          </motion.div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex-1 flex items-center justify-center p-8 bg-[var(--background)]"
      >
        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Link href="/" className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center">
                <span className="text-white font-bold text-sm">B</span>
              </div>
              <span className="font-bold text-xl text-[var(--foreground)]">BlogHub</span>
            </Link>

            <div className="bg-[var(--primary)]/10 border border-[var(--primary)]/20 rounded-xl p-4 mb-6">
              <p className="text-sm text-[var(--primary)]">
                Crea tu cuenta y empieza a leer en segundos.
              </p>
            </div>

            <h1 className="text-3xl font-bold mb-2">Registrarse</h1>
            <p className="text-[var(--muted-foreground)] mb-8">
              ¿Ya tienes cuenta?{' '}
              <Link href="/login" className="text-[var(--primary)] font-medium hover:underline">
                Inicia sesión
              </Link>
            </p>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-600 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-5">
              <Input
                label="Nombre Completo"
                type="text"
                placeholder="Juan Pérez"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />

              <Input
                label="Correo Electrónico"
                type="email"
                placeholder="tu@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />

              <div>
                <Input
                  label="Contraseña"
                  type="password"
                  placeholder="••••••••"
                  showPasswordToggle
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                
                {formData.password && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-[var(--muted)] rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(passwordStrength / 5) * 100}%` }}
                          className={`h-full ${getStrengthColor(passwordStrength)} transition-all duration-300`}
                        />
                      </div>
                      <span className={`text-xs font-medium ${passwordStrength <= 2 ? 'text-red-500' : passwordStrength <= 3 ? 'text-yellow-500' : 'text-green-500'}`}>
                        {getStrengthLabel(passwordStrength)}
                      </span>
                    </div>
                    <ul className="grid grid-cols-2 gap-1">
                      {passwordRequirements.map((req, index) => {
                        const passed = req.test(formData.password);
                        return (
                          <li key={index} className={`flex items-center gap-1 text-xs ${passed ? 'text-green-600' : 'text-[var(--muted-foreground)]'}`}>
                            {passed ? <Check size={12} /> : <X size={12} />}
                            {req.label}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 mt-0.5 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]"
                  checked={formData.acceptTerms}
                  onChange={(e) => setFormData({ ...formData, acceptTerms: e.target.checked })}
                />
                <span className="text-sm text-[var(--muted-foreground)]">
                  Acepto los{' '}
                  <Link href="/" className="text-[var(--primary)] hover:underline">Términos de Servicio</Link>
                  {' '}y la{' '}
                  <Link href="/" className="text-[var(--primary)] hover:underline">Política de Privacidad</Link>
                </span>
              </label>

              <Button type="button" size="lg" className="w-full" disabled={loading}>
                Crear Cuenta
                <ArrowRight className="ml-2" size={18} />
              </Button>
            </div>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[var(--border)]" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-[var(--background)] text-[var(--muted-foreground)]">o regístrate con</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignup}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-[var(--border)] hover:bg-[var(--muted)] transition-colors disabled:opacity-50"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.38-1.36-.38-2.09s.16-1.43.38-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span className="font-medium">Google</span>
            </button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}