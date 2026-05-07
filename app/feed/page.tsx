'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  collection, getDocs, orderBy, query,
  doc, setDoc, deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '../../lib/firebase';
import Card from '../../components/Card';
import { BookOpen, Clock, Heart } from 'lucide-react';
import { tagColor } from '../../lib/tags';

interface BlogPost {
  id: string;
  title: string;
  body: string;
  tags: string[];
  authorName: string;
  createdAt: { seconds: number } | null;
}

export default function FeedPage() {
  const router = useRouter();
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return unsubscribe;
  }, []);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const q = query(collection(db, 'blogs'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        setBlogs(snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<BlogPost, 'id'>) })));
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

  return (
    <main className="min-h-screen bg-[var(--background)] py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-[var(--foreground)] mb-2">Feed</h1>
          <p className="text-[var(--muted-foreground)]">Descubre historias escritas por nuestra comunidad.</p>
        </div>

        {loading && (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {error && <p className="text-center text-red-500 py-10">{error}</p>}

        {!loading && !error && blogs.length === 0 && (
          <div className="text-center py-20">
            <BookOpen size={48} className="mx-auto mb-4 text-[var(--muted-foreground)]" />
            <p className="text-lg text-[var(--muted-foreground)]">Aún no hay blogs publicados.</p>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">
              ¡Sé el primero en{' '}
              <span
                className="text-[var(--primary)] underline cursor-pointer"
                onClick={() => router.push('/publicar')}
              >publicar uno</span>!
            </p>
          </div>
        )}

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {blogs.map((post) => {
            const faved = favorites.has(post.id);
            return (
              <Card
                key={post.id}
                hover
                className="relative h-full flex flex-col p-6 gap-3 pr-12 cursor-pointer"
                onClick={() => router.push(`/feed/${post.id}`)}
              >
                <h2 className="text-lg font-bold text-[var(--foreground)] hover:text-[var(--primary)] transition-colors line-clamp-2">
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

                {user && (
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleFavorite(post.id); }}
                    title={faved ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                    className={`absolute top-4 right-4 p-1.5 rounded-full transition-colors ${
                      faved
                        ? 'text-red-500'
                        : 'text-[var(--muted-foreground)] hover:text-red-500'
                    }`}
                  >
                    <Heart size={16} fill={faved ? 'currentColor' : 'none'} />
                  </button>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </main>
  );
}
