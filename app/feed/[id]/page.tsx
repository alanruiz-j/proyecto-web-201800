'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  doc,
  getDoc,
  collection,
  getDocs,
  addDoc,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '../../../lib/firebase';
import { ArrowLeft, Tag, Clock, MessageCircle, Send } from 'lucide-react';

interface BlogPost {
  title: string;
  body: string;
  tags: string[];
  authorName: string;
  createdAt: { seconds: number } | null;
}

interface Comment {
  id: string;
  content: string;
  authorName: string;
  createdAt: { seconds: number } | null;
}

export default function BlogDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [post, setPost] = useState<BlogPost | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [newComment, setNewComment] = useState('');
  const [loadingPost, setLoadingPost] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [commentError, setCommentError] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return unsubscribe;
  }, []);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const docRef = doc(db, 'blogs', id);
        const snap = await getDoc(docRef);
        if (!snap.exists()) {
          setError('Blog no encontrado.');
          return;
        }
        setPost(snap.data() as BlogPost);
      } catch (err) {
        console.error(err);
        setError('Error al cargar el blog.');
      } finally {
        setLoadingPost(false);
      }
    };

    const fetchComments = async () => {
      try {
        const q = query(
          collection(db, 'blogs', id, 'comments'),
          orderBy('createdAt', 'asc')
        );
        const snap = await getDocs(q);
        setComments(
          snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Comment, 'id'>) }))
        );
      } catch (err) {
        console.error(err);
      }
    };

    fetchPost();
    fetchComments();
  }, [id]);

  const handleComment = async () => {
    if (!newComment.trim()) return;
    setSubmitting(true);
    setCommentError('');
    try {
      const commentData = {
        content: newComment.trim(),
        authorId: user!.uid,
        authorName: user!.displayName || user!.email || 'Anónimo',
        createdAt: serverTimestamp(),
      };
      const ref = await addDoc(collection(db, 'blogs', id, 'comments'), commentData);
      setComments((prev) => [
        ...prev,
        {
          id: ref.id,
          content: commentData.content,
          authorName: commentData.authorName,
          createdAt: null,
        },
      ]);
      setNewComment('');
    } catch (err) {
      console.error(err);
      setCommentError('No se pudo publicar el comentario.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (ts: { seconds: number } | null) => {
    if (!ts) return 'Justo ahora';
    return new Date(ts.seconds * 1000).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loadingPost) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-red-500 text-lg">{error}</p>
        <Link href="/feed" className="text-[var(--primary)] underline">Volver al Feed</Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--background)] py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/feed"
          className="inline-flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] mb-8 transition-colors"
        >
          <ArrowLeft size={16} />
          Volver al Feed
        </Link>

        <article className="bg-white rounded-2xl shadow-md border border-[var(--border)] p-8 mb-8">
          <h1 className="text-3xl font-bold text-[var(--foreground)] mb-4">{post!.title}</h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--muted-foreground)] mb-6 pb-6 border-b border-[var(--border)]">
            <span className="font-medium text-[var(--foreground)]">{post!.authorName}</span>
            <span className="flex items-center gap-1">
              <Clock size={14} />
              {formatDate(post!.createdAt)}
            </span>
            {post!.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {post!.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-[var(--muted)] text-[var(--muted-foreground)]"
                  >
                    <Tag size={10} />
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="prose prose-slate max-w-none text-[var(--foreground)] leading-relaxed whitespace-pre-wrap">
            {post!.body}
          </div>
        </article>

        <section className="bg-white rounded-2xl shadow-md border border-[var(--border)] p-8">
          <h2 className="text-xl font-bold text-[var(--foreground)] mb-6 flex items-center gap-2">
            <MessageCircle size={20} />
            Comentarios ({comments.length})
          </h2>

          {comments.length === 0 && (
            <p className="text-[var(--muted-foreground)] text-sm mb-6">Sé el primero en comentar.</p>
          )}

          <div className="space-y-4 mb-8">
            {comments.map((c) => (
              <div key={c.id} className="p-4 rounded-xl bg-[var(--muted)] border border-[var(--border)]">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold text-sm text-[var(--foreground)]">{c.authorName}</span>
                  <span className="text-xs text-[var(--muted-foreground)]">{formatDate(c.createdAt)}</span>
                </div>
                <p className="text-sm text-[var(--foreground)]">{c.content}</p>
              </div>
            ))}
          </div>

          {user ? (
            <div className="flex flex-col gap-3">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Escribe un comentario..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--muted)] text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              />
              {commentError && <p className="text-red-500 text-xs">{commentError}</p>}
              <button
                onClick={handleComment}
                disabled={submitting || !newComment.trim()}
                className="self-end inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[var(--primary)] text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                <Send size={14} />
                {submitting ? 'Publicando...' : 'Comentar'}
              </button>
            </div>
          ) : (
            <p className="text-sm text-[var(--muted-foreground)]">
              <Link href="/login" className="text-[var(--primary)] underline">Inicia sesión</Link> para dejar un comentario.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
