'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '../../lib/firebase';
import { PenLine, Code, Heart, Music, Camera, Plane, Utensils, Book, Gamepad2 } from 'lucide-react';

const PREDEFINED_TAGS = [
  { name: 'Tecnología', icon: Code, color: 'bg-blue-100 text-blue-600 border-blue-200', activeColor: 'bg-blue-500 text-white border-blue-500' },
  { name: 'Estilo de Vida', icon: Heart, color: 'bg-pink-100 text-pink-600 border-pink-200', activeColor: 'bg-pink-500 text-white border-pink-500' },
  { name: 'Música', icon: Music, color: 'bg-purple-100 text-purple-600 border-purple-200', activeColor: 'bg-purple-500 text-white border-purple-500' },
  { name: 'Fotografía', icon: Camera, color: 'bg-amber-100 text-amber-600 border-amber-200', activeColor: 'bg-amber-500 text-white border-amber-500' },
  { name: 'Viajes', icon: Plane, color: 'bg-cyan-100 text-cyan-600 border-cyan-200', activeColor: 'bg-cyan-500 text-white border-cyan-500' },
  { name: 'Gastronomía', icon: Utensils, color: 'bg-orange-100 text-orange-600 border-orange-200', activeColor: 'bg-orange-500 text-white border-orange-500' },
  { name: 'Literatura', icon: Book, color: 'bg-emerald-100 text-emerald-600 border-emerald-200', activeColor: 'bg-emerald-500 text-white border-emerald-500' },
  { name: 'Videojuegos', icon: Gamepad2, color: 'bg-red-100 text-red-600 border-red-200', activeColor: 'bg-red-500 text-white border-red-500' },
];

export default function PublicarPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
      if (!u) router.replace('/login');
    });
    return unsubscribe;
  }, [router]);

  const toggleTag = (name: string) => {
    setTags((prev) =>
      prev.includes(name) ? prev.filter((t) => t !== name) : [...prev, name]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      setError('El título y el cuerpo son obligatorios.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await addDoc(collection(db, 'blogs'), {
        title: title.trim(),
        body: body.trim(),
        tags,
        authorId: user!.uid,
        authorName: user!.displayName || user!.email || 'Anónimo',
        createdAt: serverTimestamp(),
      });
      router.push('/feed');
    } catch (err) {
      console.error(err);
      setError('No se pudo publicar el blog. Intenta de nuevo.');
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <main className="min-h-screen bg-[var(--background)] py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center">
            <PenLine size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[var(--foreground)]">Publicar Blog</h1>
            <p className="text-sm text-[var(--muted-foreground)]">Comparte tu historia con la comunidad.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-md border border-[var(--border)] p-8 flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-[var(--foreground)]">Título</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Dale un título a tu blog..."
              className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--muted)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-[var(--foreground)]">Cuerpo</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Escribe tu historia aquí..."
              rows={10}
              className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--muted)] text-sm resize-y focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-[var(--foreground)]">
              Etiquetas
              <span className="ml-2 font-normal text-[var(--muted-foreground)]">
                ({tags.length} seleccionada{tags.length !== 1 ? 's' : ''})
              </span>
            </label>
            <div className="flex flex-wrap gap-2">
              {PREDEFINED_TAGS.map(({ name, icon: Icon, color, activeColor }) => {
                const selected = tags.includes(name);
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => toggleTag(name)}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all ${
                      selected ? activeColor : color
                    }`}
                  >
                    <Icon size={14} />
                    {name}
                  </button>
                );
              })}
            </div>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {submitting ? 'Publicando...' : 'Publicar Blog'}
          </button>
        </form>
      </div>
    </main>
  );
}
