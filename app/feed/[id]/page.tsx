'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  addDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '../../../lib/firebase';
import {
  ArrowLeft, Tag, Clock, MessageCircle, Send,
  Trash2, EyeOff, Eye, ThumbsUp, ThumbsDown, Heart,
} from 'lucide-react';

interface BlogPost {
  title: string;
  body: string;
  tags: string[];
  authorId: string;
  authorName: string;
  createdAt: { seconds: number } | null;
}

interface Comment {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  hidden: boolean;
  likedBy: string[];
  dislikedBy: string[];
  createdAt: { seconds: number } | null;
}

export default function BlogDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [post, setPost] = useState<BlogPost | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [loadingPost, setLoadingPost] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingBlog, setDeletingBlog] = useState(false);
  const [error, setError] = useState('');
  const [commentError, setCommentError] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return unsubscribe;
  }, []);

  // Check favorite status when user changes
  useEffect(() => {
    if (!user) { setIsFavorite(false); return; }
    getDoc(doc(db, 'users', user.uid, 'favorites', id)).then((snap) => {
      setIsFavorite(snap.exists());
    });
  }, [user, id]);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const snap = await getDoc(doc(db, 'blogs', id));
        if (!snap.exists()) { setError('Blog no encontrado.'); return; }
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
        const q = query(collection(db, 'blogs', id, 'comments'), orderBy('createdAt', 'asc'));
        const snap = await getDocs(q);
        setComments(snap.docs.map((d) => ({
          id: d.id,
          likedBy: [],
          dislikedBy: [],
          hidden: false,
          ...(d.data() as Omit<Comment, 'id'>),
        })));
      } catch (err) {
        console.error(err);
      }
    };

    fetchPost();
    fetchComments();
  }, [id]);

  const isAuthor = user && post && user.uid === post.authorId;

  const handleToggleFavorite = async () => {
    if (!user) return;
    const favRef = doc(db, 'users', user.uid, 'favorites', id);
    if (isFavorite) {
      await deleteDoc(favRef);
      setIsFavorite(false);
    } else {
      await setDoc(favRef, { blogId: id, addedAt: serverTimestamp() });
      setIsFavorite(true);
    }
  };

  const handleDeleteBlog = async () => {
    if (!confirm('¿Eliminar este blog? Esta acción no se puede deshacer.')) return;
    setDeletingBlog(true);
    try {
      await deleteDoc(doc(db, 'blogs', id));
      router.push('/feed');
    } catch (err) {
      console.error(err);
      setDeletingBlog(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteDoc(doc(db, 'blogs', id, 'comments', commentId));
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleHidden = async (comment: Comment) => {
    try {
      await updateDoc(doc(db, 'blogs', id, 'comments', comment.id), { hidden: !comment.hidden });
      setComments((prev) =>
        prev.map((c) => (c.id === comment.id ? { ...c, hidden: !c.hidden } : c))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleVote = async (comment: Comment, vote: 'like' | 'dislike') => {
    if (!user) return;
    const uid = user.uid;
    const hasLiked = comment.likedBy.includes(uid);
    const hasDisliked = comment.dislikedBy.includes(uid);
    const commentRef = doc(db, 'blogs', id, 'comments', comment.id);

    let updates: Record<string, unknown>;
    if (vote === 'like') {
      updates = hasLiked
        ? { likedBy: arrayRemove(uid) }
        : { likedBy: arrayUnion(uid), dislikedBy: arrayRemove(uid) };
    } else {
      updates = hasDisliked
        ? { dislikedBy: arrayRemove(uid) }
        : { dislikedBy: arrayUnion(uid), likedBy: arrayRemove(uid) };
    }

    await updateDoc(commentRef, updates);

    setComments((prev) =>
      prev.map((c) => {
        if (c.id !== comment.id) return c;
        if (vote === 'like') {
          return {
            ...c,
            likedBy: hasLiked ? c.likedBy.filter((x) => x !== uid) : [...c.likedBy.filter((x) => x !== uid), uid],
            dislikedBy: c.dislikedBy.filter((x) => x !== uid),
          };
        } else {
          return {
            ...c,
            dislikedBy: hasDisliked ? c.dislikedBy.filter((x) => x !== uid) : [...c.dislikedBy.filter((x) => x !== uid), uid],
            likedBy: c.likedBy.filter((x) => x !== uid),
          };
        }
      })
    );
  };

  const handleComment = async () => {
    if (!newComment.trim()) return;
    setSubmitting(true);
    setCommentError('');
    try {
      const data = {
        content: newComment.trim(),
        authorId: user!.uid,
        authorName: user!.displayName || user!.email || 'Anónimo',
        hidden: false,
        likedBy: [] as string[],
        dislikedBy: [] as string[],
        createdAt: serverTimestamp(),
      };
      const ref = await addDoc(collection(db, 'blogs', id, 'comments'), data);
      setComments((prev) => [...prev, { id: ref.id, ...data, createdAt: null }]);
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
      year: 'numeric', month: 'long', day: 'numeric',
    });
  };

  const netVotes = (c: Comment) => c.likedBy.length - c.dislikedBy.length;

  const visibleComments = comments
    .filter((c) => !c.hidden)
    .sort((a, b) => {
      const diff = netVotes(b) - netVotes(a);
      return diff !== 0 ? diff : (a.createdAt?.seconds ?? 0) - (b.createdAt?.seconds ?? 0);
    });
  const hiddenComments = comments.filter((c) => c.hidden);
  const sortedComments = [...visibleComments, ...hiddenComments];

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
          <div className="flex items-start justify-between gap-4 mb-4">
            <h1 className="text-3xl font-bold text-[var(--foreground)]">{post!.title}</h1>
            <div className="flex items-center gap-2 shrink-0">
              {user && (
                <button
                  onClick={handleToggleFavorite}
                  title={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                  className={`p-2 rounded-lg border transition-colors ${
                    isFavorite
                      ? 'bg-red-50 border-red-200 text-red-500'
                      : 'border-[var(--border)] text-[var(--muted-foreground)] hover:bg-red-50 hover:border-red-200 hover:text-red-500'
                  }`}
                >
                  <Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} />
                </button>
              )}
              {isAuthor && (
                <button
                  onClick={handleDeleteBlog}
                  disabled={deletingBlog}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-red-600 hover:bg-red-50 border border-red-200 text-sm transition-colors disabled:opacity-50"
                >
                  <Trash2 size={14} />
                  {deletingBlog ? 'Eliminando…' : 'Eliminar'}
                </button>
              )}
            </div>
          </div>

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
            {sortedComments.map((c) => {
              const userLiked = user ? c.likedBy.includes(user.uid) : false;
              const userDisliked = user ? c.dislikedBy.includes(user.uid) : false;
              return (
                <div
                  key={c.id}
                  className={`p-4 rounded-xl border transition-colors ${
                    c.hidden
                      ? 'bg-gray-50 border-gray-200 opacity-60'
                      : 'bg-[var(--muted)] border-[var(--border)]'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`font-semibold text-sm ${c.hidden ? 'text-gray-500' : 'text-[var(--foreground)]'}`}>
                      {c.authorName}
                    </span>
                    <span className="text-xs text-[var(--muted-foreground)]">{formatDate(c.createdAt)}</span>
                    {c.hidden && (
                      <span className="ml-auto text-xs text-gray-400 italic">Oculto por el autor</span>
                    )}
                  </div>

                  <p className={`text-sm ${c.hidden ? 'text-gray-400' : 'text-[var(--foreground)]'}`}>
                    {c.content}
                  </p>

                  <div className="flex items-center gap-3 mt-3">
                    {/* Like / Dislike */}
                    <button
                      onClick={() => handleVote(c, 'like')}
                      disabled={!user}
                      className={`inline-flex items-center gap-1 text-xs rounded-full px-2 py-1 transition-colors ${
                        userLiked
                          ? 'bg-green-100 text-green-600'
                          : 'text-[var(--muted-foreground)] hover:text-green-600 hover:bg-green-50'
                      } disabled:cursor-not-allowed`}
                    >
                      <ThumbsUp size={12} />
                      {c.likedBy.length}
                    </button>
                    <button
                      onClick={() => handleVote(c, 'dislike')}
                      disabled={!user}
                      className={`inline-flex items-center gap-1 text-xs rounded-full px-2 py-1 transition-colors ${
                        userDisliked
                          ? 'bg-red-100 text-red-500'
                          : 'text-[var(--muted-foreground)] hover:text-red-500 hover:bg-red-50'
                      } disabled:cursor-not-allowed`}
                    >
                      <ThumbsDown size={12} />
                      {c.dislikedBy.length}
                    </button>

                    <div className="ml-auto flex gap-2">
                      {isAuthor && (
                        <button
                          onClick={() => handleToggleHidden(c)}
                          className="inline-flex items-center gap-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                        >
                          {c.hidden ? <Eye size={12} /> : <EyeOff size={12} />}
                          {c.hidden ? 'Mostrar' : 'Ocultar'}
                        </button>
                      )}
                      {user && user.uid === c.authorId && (
                        <button
                          onClick={() => handleDeleteComment(c.id)}
                          className="inline-flex items-center gap-1 text-xs text-red-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 size={12} />
                          Eliminar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
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
              <Link href="/login" className="text-[var(--primary)] underline">Inicia sesión</Link> para votar y comentar.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
