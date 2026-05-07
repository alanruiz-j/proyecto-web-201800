'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  collection, getDocs,
  doc, setDoc, deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '../../lib/firebase';
import Card from '../../components/Card';
import { BookOpen, Clock, Heart, SlidersHorizontal } from 'lucide-react';
import { tagColor, TAGS } from '../../lib/tags';

interface BlogPost {
  id: string;
  title: string;
  body: string;
  tags: string[];
  authorName: string;
  favoriteCount: number;
  createdAt: { seconds: number } | null;
}

type SortBy = 'newest' | 'favorites';

export default function FeedPage() {
  const router = useRouter();
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortBy>('newest');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return unsubscribe;
  }, []);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'blogs'));
        setBlogs(snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            title: data.title ?? '',
            body: data.body ?? '',
            tags: data.tags ?? [],
            authorName: data.authorName ?? '',
            favoriteCount: data.favoriteCount ?? 0,
            createdAt: data.createdAt ?? null,
          };
        }));
      } catch (err) {
        console.error(err);
        setError('No se pudieron cargar los blogs.');
      } finally {
        setLoading(false);
      }
    };
    fetchBlogs();
  }, []);

  useEffect(() => {
    if (!user) { setFavorites(new Set()); return; }
    getDocs(collection(db, 'users', user.uid, 'favorites')).then((snap) => {
      setFavorites(new Set(snap.docs.map((d) => d.id)));
    });
  }, [user]);

  const toggleFavorite = async (blogId: string) => {
    if (!user) return;
    const favRef = doc(db, 'users', user.uid, 'favorites', blogId);
    if (favorites.has(blogId)) {
      await deleteDoc(favRef);
      setFavorites((prev) => { const s = new Set(prev); s.delete(blogId); return s; });
    } else {
      await setDoc(favRef, { blogId, addedAt: serverTimestamp() });
      setFavorites((prev) => new Set(prev).add(blogId));
    }
  };

  const formatDate = (ts: { seconds: number } | null) => {
    if (!ts) return '';
    return new Date(ts.seconds * 1000).toLocaleDateString('es-MX', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  };

  const displayed = useMemo(() => {
    let list = selectedTag
      ? blogs.filter((b) => b.tags.includes(selectedTag))
      : blogs;
    if (sortBy === 'newest') {
      list = [...list].sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
    } else {
      list = [...list].sort((a, b) => b.favoriteCount - a.favoriteCount);
    }
    return list;
  }, [blogs, selectedTag, sortBy]);

  return (
    <main className="min-h-screen bg-[var(--background)] py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[var(--foreground)] mb-2">Feed</h1>
          <p className="text-[var(--muted-foreground)]">Descubre historias escritas por nuestra comunidad.</p>
        </div>

        {/* Filtros */}
        <div className="mb-8 space-y-4">
          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedTag === null
                  ? 'bg-[var(--primary)] text-white'
                  : 'bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--border)]'
              }`}
            >
              Todos
            </button>
            {TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  selectedTag === tag
                    ? tagColor(tag) + ' ring-2 ring-offset-1 ring-current'
                    : tagColor(tag) + ' opacity-70 hover:opacity-100'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Orden */}
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={15} className="text-[var(--muted-foreground)]" />
            <span className="text-sm text-[var(--muted-foreground)]">Ordenar:</span>
            <button
              onClick={() => setSortBy('newest')}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                sortBy === 'newest'
                  ? 'bg-[var(--foreground)] text-white'
                  : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)]'
              }`}
            >
              Más nuevos
            </button>
            <button
              onClick={() => setSortBy('favorites')}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                sortBy === 'favorites'
                  ? 'bg-[var(--foreground)] text-white'
                  : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)]'
              }`}
            >
              Más favoritos
            </button>
          </div>
        </div>

        {loading && (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {error && <p className="text-center text-red-500 py-10">{error}</p>}

        {!loading && !error && displayed.length === 0 && (
          <div className="text-center py-20">
            <BookOpen size={48} className="mx-auto mb-4 text-[var(--muted-foreground)]" />
            <p className="text-lg text-[var(--muted-foreground)]">
              {selectedTag ? `No hay blogs sobre "${selectedTag}" aún.` : 'Aún no hay blogs publicados.'}
            </p>
            {!selectedTag && (
              <p className="text-sm text-[var(--muted-foreground)] mt-1">
                ¡Sé el primero en{' '}
                <span
                  className="text-[var(--primary)] underline cursor-pointer"
                  onClick={() => router.push('/publicar')}
                >publicar uno</span>!
              </p>
            )}
          </div>
        )}

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {displayed.map((post) => {
            const faved = favorites.has(post.id);
            return (
              <Card
                key={post.id}
                hover
                className="relative h-full flex flex-col p-6 gap-3 cursor-pointer"
                onClick={() => router.push(`/feed/${post.id}`)}
              >
                <h2 className="text-lg font-bold text-[var(--foreground)] hover:text-[var(--primary)] transition-colors line-clamp-2 pr-8">
                  {post.title}
                </h2>
                <p className="text-sm text-[var(--muted-foreground)] line-clamp-3 flex-1">
                  {post.body.slice(0, 200)}{post.body.length > 200 ? '…' : ''}
                </p>
                {post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {post.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full font-medium ${tagColor(tag)}`}>
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)] pt-1 border-t border-[var(--border)]">
                  <Clock size={12} />
                  <span>{formatDate(post.createdAt)}</span>
                  <span className="ml-auto font-medium">{post.authorName}</span>
                </div>

                {/* Botón favorito + contador */}
                <button
                  onClick={(e) => { e.stopPropagation(); toggleFavorite(post.id); }}
                  title={user ? (faved ? 'Quitar de favoritos' : 'Agregar a favoritos') : 'Inicia sesión para guardar'}
                  className={`absolute top-4 right-4 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                    faved
                      ? 'text-red-500 bg-red-50'
                      : 'text-[var(--muted-foreground)] hover:text-red-500 hover:bg-red-50'
                  }`}
                >
                  <Heart size={13} fill={faved ? 'currentColor' : 'none'} />
                  {post.favoriteCount > 0 && (
                    <span>{post.favoriteCount}</span>
                  )}
                </button>
              </Card>
            );
          })}
        </div>
      </div>
    </main>
  );
}
