'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  collection, getDocs, doc, getDoc, deleteDoc,
} from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '../../lib/firebase';
import Card from '../../components/Card';
import { Heart, Clock, BookOpen } from 'lucide-react';
import { tagColor } from '../../lib/tags';

interface BlogPost {
  id: string;
  title: string;
  body: string;
  tags: string[];
  authorName: string;
  createdAt: { seconds: number } | null;
}

export default function FavoritosPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
      if (!u) router.replace('/login');
    });
    return unsubscribe;
  }, [router]);

  useEffect(() => {
    if (!user) return;
    const fetchFavorites = async () => {
      try {
        const favSnap = await getDocs(collection(db, 'users', user.uid, 'favorites'));
        const blogIds = favSnap.docs.map((d) => d.id);

        const blogDocs = await Promise.all(
          blogIds.map((id) => getDoc(doc(db, 'blogs', id)))
        );

        const posts = blogDocs
          .filter((d) => d.exists())
          .map((d) => ({ id: d.id, ...(d.data() as Omit<BlogPost, 'id'>) }));

        posts.sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
        setBlogs(posts);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchFavorites();
  }, [user]);

  const handleRemoveFavorite = async (blogId: string) => {
    if (!user) return;
    setRemovingId(blogId);
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'favorites', blogId));
      setBlogs((prev) => prev.filter((b) => b.id !== blogId));
    } catch (err) {
      console.error(err);
    } finally {
      setRemovingId(null);
    }
  };

  const formatDate = (ts: { seconds: number } | null) => {
    if (!ts) return '';
    return new Date(ts.seconds * 1000).toLocaleDateString('es-MX', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  };

  if (authLoading || (user && loading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <main className="min-h-screen bg-[var(--background)] py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-400 to-pink-500 flex items-center justify-center">
            <Heart size={20} className="text-white" fill="white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[var(--foreground)]">Favoritos</h1>
            <p className="text-sm text-[var(--muted-foreground)]">{blogs.length} blog{blogs.length !== 1 ? 's' : ''} guardado{blogs.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {blogs.length === 0 ? (
          <div className="text-center py-20">
            <BookOpen size={48} className="mx-auto mb-4 text-[var(--muted-foreground)]" />
            <p className="text-lg text-[var(--muted-foreground)]">No tienes blogs favoritos aún.</p>
            <Link href="/feed" className="inline-block mt-4 text-[var(--primary)] underline text-sm">
              Explorar el Feed
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {blogs.map((post) => (
              <div key={post.id} className="relative group">
                <Link href={`/feed/${post.id}`} className="block">
                  <Card hover className="h-full flex flex-col p-6 gap-3 pr-12">
                    <h2 className="text-lg font-bold text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors line-clamp-2">
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
                  </Card>
                </Link>

                <button
                  onClick={(e) => { e.preventDefault(); handleRemoveFavorite(post.id); }}
                  disabled={removingId === post.id}
                  title="Quitar de favoritos"
                  className="absolute top-4 right-4 z-10 p-1.5 rounded-full text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
                >
                  <Heart size={16} fill="currentColor" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
