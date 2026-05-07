'use client';

// ── Imports ───────────────────────────────────────────────────────────────────
// useMemo recalcula un valor derivado solo cuando sus dependencias cambian (optimización).
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
// increment() incrementa o decrementa un número en Firestore de forma atómica (sin condiciones de carrera).
// setDoc crea o sobreescribe un documento; deleteDoc lo elimina.
import {
  collection, getDocs,
  doc, setDoc, deleteDoc, updateDoc, increment,
  serverTimestamp,
} from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '../../lib/firebase';
import Card from '../../components/Card';
import { BookOpen, Clock, Heart, SlidersHorizontal } from 'lucide-react';
// TAGS es el array de todas las etiquetas disponibles; tagColor devuelve el color de cada una.
import { tagColor, TAGS } from '../../lib/tags';

// ── Tipos ─────────────────────────────────────────────────────────────────────
interface BlogPost {
  id: string;
  title: string;
  body: string;
  tags: string[];
  authorName: string;
  favoriteCount: number;
  createdAt: { seconds: number } | null;
}

// SortBy es un tipo de unión: solo puede ser uno de estos dos valores.
type SortBy = 'newest' | 'favorites';

export default function FeedPage() {
  const router = useRouter();

  // ── Estado ────────────────────────────────────────────────────────────────
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState<User | null>(null);
  // Set es una estructura que solo almacena valores únicos; ideal para ids de favoritos.
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  // selectedTag filtra los blogs por etiqueta; null significa "mostrar todos".
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortBy>('newest');

  // ── Efectos ───────────────────────────────────────────────────────────────
  useEffect(() => {
    // Escuchar cambios de sesión y guardar el usuario actual.
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return unsubscribe;
  }, []);

  useEffect(() => {
    // getDocs trae todos los documentos de la colección 'blogs' de Firestore.
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
    // Si no hay usuario logueado, limpiar la lista de favoritos.
    if (!user) { setFavorites(new Set()); return; }
    // Traer la subcolección de favoritos del usuario para saber cuáles blogs ya guardó.
    getDocs(collection(db, 'users', user.uid, 'favorites')).then((snap) => {
      // new Set(array) convierte el array de ids en un Set para búsqueda eficiente con .has().
      setFavorites(new Set(snap.docs.map((d) => d.id)));
    });
  }, [user]); // Se ejecuta cada vez que cambia el usuario (login/logout)

  // ── Toggle de favoritos ───────────────────────────────────────────────────
  const toggleFavorite = async (blogId: string) => {
    if (!user) return;
    const isFaved = favorites.has(blogId);
    const favRef = doc(db, 'users', user.uid, 'favorites', blogId);
    const blogRef = doc(db, 'blogs', blogId);

    // Actualización optimista: cambiar el estado local ANTES de esperar a Firestore.
    // Esto hace la UI sentirse instantánea aunque la red tarde.
    if (isFaved) {
      setFavorites((prev) => { const s = new Set(prev); s.delete(blogId); return s; });
      setBlogs((prev) => prev.map((b) => b.id === blogId ? { ...b, favoriteCount: Math.max(0, b.favoriteCount - 1) } : b));
    } else {
      setFavorites((prev) => new Set(prev).add(blogId));
      setBlogs((prev) => prev.map((b) => b.id === blogId ? { ...b, favoriteCount: b.favoriteCount + 1 } : b));
    }

    try {
      if (isFaved) {
        // Quitar de favoritos: eliminar el documento y decrementar el contador en el blog.
        await deleteDoc(favRef);
        await updateDoc(blogRef, { favoriteCount: increment(-1) });
      } else {
        // Agregar a favoritos: crear el documento y aumentar el contador en el blog.
        await setDoc(favRef, { blogId, addedAt: serverTimestamp() });
        await updateDoc(blogRef, { favoriteCount: increment(1) });
      }
    } catch (err) {
      console.error(err);
      // Si Firestore falla, revertir el cambio optimista para mantener consistencia.
      if (isFaved) {
        setFavorites((prev) => new Set(prev).add(blogId));
        setBlogs((prev) => prev.map((b) => b.id === blogId ? { ...b, favoriteCount: b.favoriteCount + 1 } : b));
      } else {
        setFavorites((prev) => { const s = new Set(prev); s.delete(blogId); return s; });
        setBlogs((prev) => prev.map((b) => b.id === blogId ? { ...b, favoriteCount: Math.max(0, b.favoriteCount - 1) } : b));
      }
    }
  };

  const formatDate = (ts: { seconds: number } | null) => {
    if (!ts) return '';
    return new Date(ts.seconds * 1000).toLocaleDateString('es-MX', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  };

  // ── Lista filtrada y ordenada ─────────────────────────────────────────────
  // useMemo recalcula 'displayed' solo cuando cambia blogs, selectedTag o sortBy.
  // Evita ordenar y filtrar todo el array en cada render.
  const displayed = useMemo(() => {
    // Filtrar por etiqueta si hay una seleccionada.
    let list = selectedTag
      ? blogs.filter((b) => b.tags.includes(selectedTag))
      : blogs;
    // Ordenar por criterio: fecha más reciente o más favoritos.
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
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[var(--foreground)] mb-2">Feed</h1>
          <p className="text-[var(--muted-foreground)]">Descubre historias escritas por nuestra comunidad.</p>
        </div>

        {/* ── Filtros ─────────────────────────────────────────────────────── */}
        <div className="mb-8 space-y-4">
          {/* Filtro por etiqueta: "Todos" + un botón por cada etiqueta disponible */}
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
            {/* TAGS.map() renderiza un botón por cada etiqueta */}
            {TAGS.map((tag) => (
              <button
                key={tag}
                // Clic en la etiqueta activa la selecciona o la deselecciona
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

          {/* Selector de orden */}
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

        {/* ── Grid de cards ───────────────────────────────────────────────── */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {displayed.map((post) => {
            // favorites.has() es O(1): verificación instantánea de si el blog está en favoritos.
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

                {/* Botón de favorito con contador; e.stopPropagation() evita abrir el blog al hacer click */}
                <button
                  onClick={(e) => { e.stopPropagation(); toggleFavorite(post.id); }}
                  title={user ? (faved ? 'Quitar de favoritos' : 'Agregar a favoritos') : 'Inicia sesión para guardar'}
                  className={`absolute top-4 right-4 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                    faved
                      ? 'text-red-500 bg-red-50'
                      : 'text-[var(--muted-foreground)] hover:text-red-500 hover:bg-red-50'
                  }`}
                >
                  {/* fill cambia entre relleno y vacío según si el blog está en favoritos */}
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
