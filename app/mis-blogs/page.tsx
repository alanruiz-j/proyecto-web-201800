'use client';

// ── Imports ───────────────────────────────────────────────────────────────────
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
// query y where permiten filtrar documentos de Firestore por un campo específico.
// deleteDoc elimina un documento de Firestore dado su referencia.
import { collection, getDocs, query, where, deleteDoc, doc } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '../../lib/firebase';
import Card from '../../components/Card';
import ConfirmModal from '../../components/ConfirmModal';
import { BookOpen, Clock, Trash2, PenLine, Plus } from 'lucide-react';
import { tagColor } from '../../lib/tags';

// ── Tipos ─────────────────────────────────────────────────────────────────────
interface BlogPost {
  id: string;
  title: string;
  body: string;
  tags: string[];
  authorName: string;
  createdAt: { seconds: number } | null;
}

// ConfirmState guarda el mensaje y la acción del modal de confirmación actual.
interface ConfirmState {
  message: string;
  onConfirm: () => void;
}

export default function MisBlogsPage() {
  const router = useRouter();

  // ── Estado ────────────────────────────────────────────────────────────────
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  // deletingId guarda el id del blog que se está eliminando para deshabilitar su botón.
  const [deletingId, setDeletingId] = useState<string | null>(null);
  // confirm guarda los datos del modal actual; null significa que no hay modal abierto.
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [deleteError, setDeleteError] = useState('');

  // ── Auth guard ────────────────────────────────────────────────────────────
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
      if (!u) router.replace('/login');
    });
    return unsubscribe;
  }, [router]);

  // ── Fetch de blogs del usuario ────────────────────────────────────────────
  useEffect(() => {
    // Este efecto depende de 'user'; si no hay usuario, no ejecutar nada.
    if (!user) return;
    const fetchBlogs = async () => {
      try {
        // query + where filtra los blogs donde el campo 'authorId' coincide con el uid del usuario.
        const q = query(collection(db, 'blogs'), where('authorId', '==', user.uid));
        const snap = await getDocs(q);
        // Combinar el id del documento con el resto de sus datos usando spread (...).
        const posts = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<BlogPost, 'id'>) }));
        // Ordenar por fecha de creación: el más reciente primero.
        posts.sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
        setBlogs(posts);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchBlogs();
  }, [user]); // Este efecto se vuelve a ejecutar cada vez que 'user' cambia

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleDelete = (blogId: string) => {
    setDeleteError('');
    // Mostrar el modal de confirmación antes de eliminar.
    // onConfirm es la función que se ejecutará si el usuario acepta.
    setConfirm({
      message: '¿Eliminar este blog? Esta acción no se puede deshacer.',
      onConfirm: async () => {
        setDeletingId(blogId);
        try {
          // deleteDoc elimina el documento de Firestore de forma permanente.
          await deleteDoc(doc(db, 'blogs', blogId));
          // Actualizar la lista local filtrando el blog eliminado (sin recargar la página).
          setBlogs((prev) => prev.filter((b) => b.id !== blogId));
        } catch (err) {
          console.error(err);
          setDeleteError('No se pudo eliminar el blog. Verifica los permisos de Firestore.');
        } finally {
          setDeletingId(null);
        }
      },
    });
  };

  // Convierte el timestamp de Firestore (segundos desde epoch) a una fecha legible.
  const formatDate = (ts: { seconds: number } | null) => {
    if (!ts) return '';
    return new Date(ts.seconds * 1000).toLocaleDateString('es-MX', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  };

  // ── Pantallas de carga y guard ────────────────────────────────────────────
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
      {/* El modal solo existe en el DOM cuando 'confirm' tiene datos (no es null) */}
      {confirm && (
        <ConfirmModal
          message={confirm.message}
          onConfirm={() => { confirm.onConfirm(); setConfirm(null); }}
          onCancel={() => setConfirm(null)}
        />
      )}

      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center">
              <PenLine size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[var(--foreground)]">Mis Blogs</h1>
              {/* Pluralización dinámica: "publicación" vs "publicaciones" */}
              <p className="text-sm text-[var(--muted-foreground)]">{blogs.length} publicación{blogs.length !== 1 ? 'es' : ''}</p>
            </div>
          </div>
          <Link
            href="/publicar"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Plus size={16} />
            Nuevo blog
          </Link>
        </div>

        {/* Mensaje de error de eliminación con botón para cerrarlo */}
        {deleteError && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm flex items-center justify-between">
            {deleteError}
            <button onClick={() => setDeleteError('')} className="ml-4 text-red-400 hover:text-red-600">✕</button>
          </div>
        )}

        {/* Estado vacío: se muestra cuando el usuario no tiene ningún blog publicado */}
        {blogs.length === 0 ? (
          <div className="text-center py-20">
            <BookOpen size={48} className="mx-auto mb-4 text-[var(--muted-foreground)]" />
            <p className="text-lg text-[var(--muted-foreground)]">Aún no has publicado ningún blog.</p>
            <Link href="/publicar" className="inline-block mt-4 text-[var(--primary)] underline text-sm">
              Publica tu primer blog
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {blogs.map((post) => (
              <Card
                key={post.id}
                hover={false}
                className="relative flex flex-col p-6 gap-3 cursor-pointer"
                // onClick navega al detalle del blog al hacer click en la card
                onClick={() => router.push(`/feed/${post.id}`)}
              >
                <div className="flex items-start justify-between gap-2 pr-8">
                  <span className="text-lg font-bold text-[var(--foreground)] hover:text-[var(--primary)] transition-colors line-clamp-2">
                    {post.title}
                  </span>
                </div>

                {/* e.stopPropagation() evita que el click en el botón active también el onClick de la card */}
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(post.id); }}
                  disabled={deletingId === post.id}
                  className="absolute top-4 right-4 p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                  title="Eliminar blog"
                >
                  <Trash2 size={16} />
                </button>

                <p className="text-sm text-[var(--muted-foreground)] line-clamp-3 flex-1">
                  {post.body.slice(0, 200)}{post.body.length > 200 ? '…' : ''}
                </p>

                {post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {/* .slice(0, 3) muestra máximo 3 etiquetas para no sobrecargar la card */}
                    {post.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full font-medium ${tagColor(tag)}`}>
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-1 text-xs text-[var(--muted-foreground)] pt-1 border-t border-[var(--border)]">
                  <Clock size={12} />
                  <span>{formatDate(post.createdAt)}</span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
