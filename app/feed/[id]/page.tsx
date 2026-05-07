'use client';

// ── Imports ───────────────────────────────────────────────────────────────────
// 'use' desenvuelve una Promise; aquí lo usamos para leer los params de la URL dinámica.
import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
// arrayUnion agrega un valor a un array en Firestore sin duplicados.
// arrayRemove quita un valor específico de un array en Firestore.
import {
  doc, getDoc, setDoc, deleteDoc, collection, getDocs, addDoc,
  updateDoc, arrayUnion, arrayRemove, orderBy, query, serverTimestamp, increment,
} from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '../../../lib/firebase';
import { tagColor } from '../../../lib/tags';
import ConfirmModal from '../../../components/ConfirmModal';
import {
  ArrowLeft, Clock, MessageCircle, Send,
  Trash2, EyeOff, Eye, ThumbsUp, ThumbsDown, Heart,
} from 'lucide-react';

// ── Tipos ─────────────────────────────────────────────────────────────────────
interface BlogPost {
  title: string;
  body: string;
  tags: string[];
  authorId: string;
  authorName: string;
  favoriteCount: number;
  createdAt: { seconds: number } | null;
}

interface Comment {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  hidden: boolean;
  // likedBy y dislikedBy son arrays de uids que votaron por el comentario.
  likedBy: string[];
  dislikedBy: string[];
  createdAt: { seconds: number } | null;
}

// ConfirmState guarda el mensaje y la acción del modal de confirmación activo.
interface ConfirmState {
  message: string;
  onConfirm: () => void;
}

// params llega como Promise porque Next.js resuelve los params de forma asíncrona en App Router.
export default function BlogDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // use(params) extrae el valor del id sin necesidad de useEffect + useState.
  const { id } = use(params);
  const router = useRouter();

  // ── Estado ────────────────────────────────────────────────────────────────
  const [post, setPost] = useState<BlogPost | null>(null);
  // favoriteCount se guarda separado para poder actualizarlo sin recargar todo el post.
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [comments, setComments] = useState<Comment[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [loadingPost, setLoadingPost] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingBlog, setDeletingBlog] = useState(false);
  const [actionError, setActionError] = useState('');
  const [commentError, setCommentError] = useState('');
  const [pageError, setPageError] = useState('');
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);

  // ── Efectos ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return unsubscribe;
  }, []);

  useEffect(() => {
    // Cuando cambia el usuario, verificar si este blog ya está en sus favoritos.
    if (!user) { setIsFavorite(false); return; }
    // getDoc trae un solo documento; .exists() verifica si el documento existe.
    getDoc(doc(db, 'users', user.uid, 'favorites', id)).then((snap) => {
      setIsFavorite(snap.exists());
    });
  }, [user, id]);

  useEffect(() => {
    // Cargar el post y los comentarios cuando el componente se monta.
    const fetchPost = async () => {
      try {
        const snap = await getDoc(doc(db, 'blogs', id));
        if (!snap.exists()) { setPageError('Blog no encontrado.'); return; }
        const data = snap.data() as BlogPost;
        setPost(data);
        setFavoriteCount(data.favoriteCount ?? 0);
      } catch (err) {
        console.error(err);
        setPageError('Error al cargar el blog.');
      } finally {
        setLoadingPost(false);
      }
    };

    const fetchComments = async () => {
      try {
        // query + orderBy trae los comentarios ordenados por fecha de creación.
        const q = query(collection(db, 'blogs', id, 'comments'), orderBy('createdAt', 'asc'));
        const snap = await getDocs(q);
        setComments(snap.docs.map((d) => {
          // Desestructurar con valores por defecto para campos que podrían no existir.
          const { likedBy = [], dislikedBy = [], hidden = false, ...rest } = d.data() as Omit<Comment, 'id'>;
          return { id: d.id, likedBy, dislikedBy, hidden, ...rest };
        }));
      } catch (err) {
        console.error(err);
      }
    };

    fetchPost();
    fetchComments();
  }, [id]); // Se vuelve a ejecutar si el id de la URL cambia

  // ── Verificaciones de autoría ─────────────────────────────────────────────
  // isAuthor es true solo si el usuario logueado es el autor del blog.
  const isAuthor = !!(user && post && user.uid === post.authorId);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleToggleFavorite = async () => {
    if (!user) return;
    const favRef = doc(db, 'users', user.uid, 'favorites', id);
    const blogRef = doc(db, 'blogs', id);
    try {
      if (isFavorite) {
        await deleteDoc(favRef);
        // increment(-1) resta 1 al campo favoriteCount en Firestore de forma atómica.
        await updateDoc(blogRef, { favoriteCount: increment(-1) });
        setIsFavorite(false);
        // (n) => ... usa la función de actualización para asegurar el valor más reciente.
        setFavoriteCount((n) => Math.max(0, n - 1));
      } else {
        await setDoc(favRef, { blogId: id, addedAt: serverTimestamp() });
        await updateDoc(blogRef, { favoriteCount: increment(1) });
        setIsFavorite(true);
        setFavoriteCount((n) => n + 1);
      }
    } catch (err) {
      console.error(err);
      setActionError('No se pudo actualizar favoritos.');
    }
  };

  const handleDeleteBlog = () => {
    // Mostrar modal de confirmación antes de borrar el blog.
    setConfirm({
      message: '¿Eliminar este blog? Esta acción no se puede deshacer.',
      onConfirm: async () => {
        setDeletingBlog(true);
        try {
          await deleteDoc(doc(db, 'blogs', id));
          router.push('/feed'); // Redirigir al feed después de eliminar
        } catch (err) {
          console.error(err);
          setActionError('No se pudo eliminar el blog. Verifica los permisos de Firestore.');
          setDeletingBlog(false);
        }
      },
    });
  };

  const handleDeleteComment = (commentId: string) => {
    setConfirm({
      message: '¿Eliminar este comentario?',
      onConfirm: async () => {
        try {
          // Los comentarios son una subcolección dentro del blog: blogs/{id}/comments/{commentId}
          await deleteDoc(doc(db, 'blogs', id, 'comments', commentId));
          // Filtrar el comentario eliminado del estado local.
          setComments((prev) => prev.filter((c) => c.id !== commentId));
        } catch (err) {
          console.error(err);
          setActionError('No se pudo eliminar el comentario. Verifica los permisos de Firestore.');
        }
      },
    });
  };

  const handleToggleHidden = async (comment: Comment) => {
    try {
      // Alternar el campo 'hidden' del comentario en Firestore.
      await updateDoc(doc(db, 'blogs', id, 'comments', comment.id), { hidden: !comment.hidden });
      // Actualizar el estado local sin recargar todos los comentarios.
      setComments((prev) =>
        prev.map((c) => (c.id === comment.id ? { ...c, hidden: !c.hidden } : c))
      );
    } catch (err) {
      console.error(err);
      setActionError('No se pudo ocultar el comentario. Verifica los permisos de Firestore.');
    }
  };

  const handleVote = async (comment: Comment, vote: 'like' | 'dislike') => {
    if (!user) return;
    const uid = user.uid;
    const hasLiked = comment.likedBy.includes(uid);
    const hasDisliked = comment.dislikedBy.includes(uid);
    const commentRef = doc(db, 'blogs', id, 'comments', comment.id);

    // Construir el objeto de actualización según el tipo de voto y el estado actual.
    let updates: Record<string, unknown>;
    if (vote === 'like') {
      // Si ya le dio like, quitarlo; si no, agregarlo y quitar dislike si lo tenía.
      updates = hasLiked
        ? { likedBy: arrayRemove(uid) }
        : { likedBy: arrayUnion(uid), dislikedBy: arrayRemove(uid) };
    } else {
      updates = hasDisliked
        ? { dislikedBy: arrayRemove(uid) }
        : { dislikedBy: arrayUnion(uid), likedBy: arrayRemove(uid) };
    }

    try {
      await updateDoc(commentRef, updates);
      // Actualizar el estado local reflejando el nuevo voto.
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
    } catch (err) {
      console.error(err);
      setActionError('No se pudo registrar el voto. Verifica los permisos de Firestore.');
    }
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
      // addDoc agrega el comentario como nuevo documento en la subcolección comments.
      const ref = await addDoc(collection(db, 'blogs', id, 'comments'), data);
      // Agregar el comentario al estado local inmediatamente (createdAt = null hasta que Firestore responda).
      setComments((prev) => [...prev, { id: ref.id, ...data, createdAt: null }]);
      setNewComment(''); // Limpiar el textarea después de publicar
    } catch (err) {
      console.error(err);
      setCommentError('No se pudo publicar el comentario.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (ts: { seconds: number } | null) => {
    // Si no hay timestamp aún (comentario recién creado), mostrar texto provisional.
    if (!ts) return 'Justo ahora';
    return new Date(ts.seconds * 1000).toLocaleDateString('es-MX', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  };

  // netVotes calcula la puntuación neta de un comentario (likes - dislikes).
  const netVotes = (c: Comment) => c.likedBy.length - c.dislikedBy.length;

  // ── Ordenar comentarios ───────────────────────────────────────────────────
  // Los comentarios visibles se ordenan por puntuación neta; los ocultos van al final.
  const visibleComments = comments
    .filter((c) => !c.hidden)
    .sort((a, b) => {
      const diff = netVotes(b) - netVotes(a);
      // Si tienen el mismo score, ordenar por fecha de creación (más antiguo primero).
      return diff !== 0 ? diff : (a.createdAt?.seconds ?? 0) - (b.createdAt?.seconds ?? 0);
    });
  const sortedComments = [...visibleComments, ...comments.filter((c) => c.hidden)];

  // ── Pantallas de carga y error ────────────────────────────────────────────
  if (loadingPost) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (pageError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-red-500 text-lg">{pageError}</p>
        <Link href="/feed" className="text-[var(--primary)] underline">Volver al Feed</Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--background)] py-12 px-4">
      {/* El modal se monta solo cuando 'confirm' tiene datos */}
      {confirm && (
        <ConfirmModal
          message={confirm.message}
          onConfirm={() => { confirm.onConfirm(); setConfirm(null); }}
          onCancel={() => setConfirm(null)}
        />
      )}

      <div className="max-w-3xl mx-auto">
        <Link
          href="/feed"
          className="inline-flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] mb-8 transition-colors"
        >
          <ArrowLeft size={16} />
          Volver al Feed
        </Link>

        {actionError && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm flex items-center justify-between">
            {actionError}
            <button onClick={() => setActionError('')} className="ml-4 text-red-400 hover:text-red-600">✕</button>
          </div>
        )}

        {/* ── Artículo principal ────────────────────────────────────────── */}
        <article className="bg-white rounded-2xl shadow-md border border-[var(--border)] p-8 mb-8">
          <div className="flex items-start justify-between gap-4 mb-4">
            <h1 className="text-3xl font-bold text-[var(--foreground)]">{post!.title}</h1>
            <div className="flex items-center gap-2 shrink-0">
              {/* Botón de favorito solo visible para usuarios autenticados */}
              {user && (
                <button
                  onClick={handleToggleFavorite}
                  title={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
                    isFavorite
                      ? 'bg-red-50 border-red-200 text-red-500'
                      : 'border-[var(--border)] text-[var(--muted-foreground)] hover:bg-red-50 hover:border-red-200 hover:text-red-500'
                  }`}
                >
                  <Heart size={15} fill={isFavorite ? 'currentColor' : 'none'} />
                  <span>{favoriteCount}</span>
                </button>
              )}
              {/* Botón de eliminar solo visible para el autor del blog */}
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
                  <span key={tag} className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${tagColor(tag)}`}>
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* whitespace-pre-wrap respeta los saltos de línea del texto guardado en Firestore */}
          <div className="prose prose-slate max-w-none text-[var(--foreground)] leading-relaxed whitespace-pre-wrap">
            {post!.body}
          </div>
        </article>

        {/* ── Sección de comentarios ─────────────────────────────────────── */}
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
                  // Los comentarios ocultos tienen apariencia atenuada para distinguirlos
                  className={`p-4 rounded-xl border ${
                    c.hidden ? 'bg-gray-50 border-gray-200 opacity-60' : 'bg-[var(--muted)] border-[var(--border)]'
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
                    {/* Botones de like/dislike; deshabilitados si el usuario no está logueado */}
                    <button
                      onClick={() => handleVote(c, 'like')}
                      disabled={!user}
                      title={!user ? 'Inicia sesión para votar' : ''}
                      className={`inline-flex items-center gap-1 text-xs rounded-full px-2 py-1 transition-colors ${
                        userLiked ? 'bg-green-100 text-green-600' : 'text-[var(--muted-foreground)] hover:text-green-600 hover:bg-green-50'
                      } disabled:opacity-40 disabled:cursor-not-allowed`}
                    >
                      <ThumbsUp size={12} />
                      {c.likedBy.length}
                    </button>
                    <button
                      onClick={() => handleVote(c, 'dislike')}
                      disabled={!user}
                      title={!user ? 'Inicia sesión para votar' : ''}
                      className={`inline-flex items-center gap-1 text-xs rounded-full px-2 py-1 transition-colors ${
                        userDisliked ? 'bg-red-100 text-red-500' : 'text-[var(--muted-foreground)] hover:text-red-500 hover:bg-red-50'
                      } disabled:opacity-40 disabled:cursor-not-allowed`}
                    >
                      <ThumbsDown size={12} />
                      {c.dislikedBy.length}
                    </button>

                    <div className="ml-auto flex gap-3">
                      {/* Solo el autor del blog puede ocultar/mostrar comentarios */}
                      {isAuthor && (
                        <button
                          onClick={() => handleToggleHidden(c)}
                          className="inline-flex items-center gap-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                        >
                          {c.hidden ? <Eye size={12} /> : <EyeOff size={12} />}
                          {c.hidden ? 'Mostrar' : 'Ocultar'}
                        </button>
                      )}
                      {/* Solo el autor del comentario puede eliminarlo */}
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

          {/* ── Formulario de nuevo comentario ──────────────────────────── */}
          {/* Solo se muestra si el usuario está logueado */}
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
                // Deshabilitar si ya está publicando o si el textarea está vacío
                disabled={submitting || !newComment.trim()}
                className="self-end inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[var(--primary)] text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                <Send size={14} />
                {submitting ? 'Publicando...' : 'Comentar'}
              </button>
            </div>
          ) : (
            // Si no hay sesión, invitar al usuario a iniciarla para poder comentar.
            <p className="text-sm text-[var(--muted-foreground)]">
              <Link href="/login" className="text-[var(--primary)] underline">Inicia sesión</Link> para votar y comentar.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
