# BlogHub — Guía completa del proyecto

Esta guía explica **cómo funciona el código** de BlogHub desde cero, pensada para alguien que está aprendiendo React, Next.js y Firebase. Aquí no solo encontrarás "qué hace cada archivo", sino también **por qué** está escrito así y qué conceptos de programación usa.

---

## ¿Qué hace esta aplicación?

BlogHub es una plataforma donde cualquier persona puede:

- **Leer** blogs publicados por otros usuarios en el Feed
- **Escribir y publicar** su propio blog con título, texto y etiquetas (Tecnología, Viajes, etc.)
- **Guardar favoritos** (corazón) y ver su colección personal
- **Comentar** en los blogs de otros y votar comentarios con 👍 o 👎
- **Registrarse e iniciar sesión** con correo/contraseña o con Google

Todo sin que el equipo de desarrollo tenga que administrar servidores — Firebase lo hace por nosotros.

---

## 1. Tecnologías y por qué las usamos

| Tecnología | ¿Para qué sirve en este proyecto? |
|---|---|
| **React** | Construir la interfaz con componentes reutilizables (como piezas de LEGO) |
| **Next.js** | Organizar las páginas por carpetas, manejar rutas dinámicas y optimizar la carga |
| **Firebase Auth** | Registro e inicio de sesión sin construir un servidor propio |
| **Firestore** | Base de datos en la nube donde guardamos blogs, comentarios y favoritos |
| **Tailwind CSS** | Dar estilos escribiendo clases directamente en el HTML, sin archivos CSS aparte |
| **Framer Motion** | Animaciones de entrada/salida fluidas con muy poco código |
| **TypeScript** | Agregar tipos a las variables para detectar errores antes de ejecutar el código |

---

## 2. Estructura de carpetas

```
proyecto/
├── app/                      ← Páginas de la aplicación (una carpeta = una ruta)
│   ├── layout.tsx            ← "Cascarón" global: Navbar y Footer en todas las páginas
│   ├── page.tsx              ← Página de inicio (la que ves al entrar)
│   ├── globals.css           ← Estilos globales y colores del tema
│   ├── feed/
│   │   ├── page.tsx          ← Lista de todos los blogs con filtros y orden
│   │   └── [id]/
│   │       └── page.tsx      ← Detalle de un blog específico (ruta dinámica)
│   ├── publicar/
│   │   └── page.tsx          ← Formulario para crear un nuevo blog
│   ├── mis-blogs/
│   │   └── page.tsx          ← Blogs publicados por el usuario actual
│   ├── favoritos/
│   │   └── page.tsx          ← Blogs guardados como favoritos
│   ├── login/
│   │   └── page.tsx          ← Inicio de sesión con email o Google
│   └── signup/
│       └── page.tsx          ← Registro de cuenta nueva
│
├── components/               ← Piezas reutilizables de la interfaz
│   ├── Navbar.tsx            ← Barra de navegación superior (fija al hacer scroll)
│   ├── Footer.tsx            ← Pie de página con links
│   ├── Hero.tsx              ← Sección grande del inicio con el mensaje principal
│   ├── BlogFeed.tsx          ← Cuadrícula de "Historias Destacadas" en el inicio
│   ├── TrendingTopics.tsx    ← Botones de etiquetas de temas populares
│   ├── CTA.tsx               ← Sección "¿Listo para compartir?" (solo para no autenticados)
│   ├── Card.tsx              ← Tarjeta blanca reutilizable con sombra y animación
│   ├── Button.tsx            ← Botón personalizado con variantes de estilo
│   └── ConfirmModal.tsx      ← Cuadro de confirmación antes de eliminar algo
│
└── lib/
    ├── firebase.ts           ← Configuración y funciones de Firebase
    └── tags.ts               ← Colores y lista de etiquetas disponibles
```

---

## 3. Conceptos de React que verás en el código

### `useState` — La memoria de un componente

Cuando React necesita "recordar" algo (un texto, un número, si algo está abierto o cerrado), usa `useState`. Cada vez que ese valor cambia, React vuelve a dibujar el componente automáticamente.

```tsx
// React recuerda la lista de blogs. Al principio está vacía.
const [blogs, setBlogs] = useState([]);

// Más tarde, cuando llegan los datos de Firestore:
setBlogs(datosDeFirestore); // ← React vuelve a dibujar la pantalla con los blogs
```

Piénsalo como un **post-it** que React guarda. Si lo cambias, la pantalla se actualiza sola.

---

### `useEffect` — Hacer algo después de que la página carga

`useEffect` es la forma de decirle a React: *"cuando este componente aparezca en pantalla, ejecuta este código"*. Se usa para traer datos de Firestore, escuchar la sesión, etc.

```tsx
useEffect(() => {
  // Este código corre UNA SOLA VEZ cuando el componente aparece
  getDocs(collection(db, 'blogs')).then((snap) => {
    setBlogs(snap.docs.map(d => d.data()));
  });
}, []); // ← El [] vacío significa "solo correr una vez al montar el componente"
```

Si el array tiene dependencias, el efecto corre cada vez que esas dependencias cambian:

```tsx
useEffect(() => {
  // Este efecto corre cada vez que 'user' cambia (login o logout)
  if (!user) return;
  getDocs(collection(db, 'users', user.uid, 'favorites')).then(...);
}, [user]); // ← Depende de 'user'
```

La función que retorna `useEffect` es la **limpieza** — se ejecuta cuando el componente desaparece:

```tsx
useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (user) => { ... });
  return unsubscribe; // ← Cancela la escucha cuando el componente se desmonta
}, []);
```

---

### `useMemo` — No recalcular lo mismo una y otra vez

`useMemo` guarda el resultado de un cálculo y solo lo recalcula cuando sus dependencias cambian. Es útil cuando tienes operaciones costosas como filtrar y ordenar arrays grandes.

```tsx
// Solo recalcula 'displayed' cuando cambian blogs, selectedTag o sortBy
const displayed = useMemo(() => {
  let list = selectedTag
    ? blogs.filter((b) => b.tags.includes(selectedTag))
    : blogs;
  return list.sort((a, b) => b.favoriteCount - a.favoriteCount);
}, [blogs, selectedTag, sortBy]);
```

Sin `useMemo`, este filtrado se ejecutaría en CADA render, aunque nada relevante haya cambiado.

---

### `useRef` — Apuntar a un elemento del DOM

`useRef` crea una referencia directa a un elemento HTML. A diferencia de `useState`, cambiar un ref **no provoca un re-render**. Se usa cuando necesitas "tocar" el DOM directamente.

En el Navbar, lo usamos para detectar cuando el usuario hace click fuera del dropdown:

```tsx
const dropdownRef = useRef(null); // Apunta al div del dropdown

useEffect(() => {
  const handleClickOutside = (event) => {
    // ¿El click fue fuera del dropdown?
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setDropdownOpen(false); // Cerrarlo
    }
  };
  document.addEventListener('mousedown', handleClickOutside);
  return () => document.removeEventListener('mousedown', handleClickOutside);
}, []);

// En el JSX:
<div ref={dropdownRef}> ... </div>
```

---

### Componentes y Props — Piezas de LEGO

Un **componente** es una función de JavaScript que retorna HTML (llamado JSX). Son como piezas de LEGO: las diseñas una vez y las usas en cualquier parte.

Las **props** son los datos que el componente padre le pasa al hijo:

```tsx
// Definición del componente hijo (Button.tsx)
function Button({ children, size, variant, onClick }) {
  return <button onClick={onClick}>{ children }</button>;
}

// Uso en el componente padre
<Button size="lg" variant="outline" onClick={() => router.push('/feed')}>
  Explorar Historias
</Button>
```

---

### Renderizado condicional — Mostrar cosas según condiciones

React puede mostrar u ocultar partes de la interfaz según el estado:

```tsx
// Con && (AND): muestra el botón SOLO si el usuario está logueado
{user && <button>Agregar a favoritos</button>}

// Con ternario (?): muestra una cosa u otra
{loading ? <Spinner /> : <ListaDeBlogsT />}

// Con null: no renderizar nada
if (!user) return null;
```

---

### Listas con `.map()` y `key`

Para renderizar una lista de elementos, usamos `.map()` que convierte cada elemento del array en un componente JSX. React requiere el prop `key` para identificar cada elemento de forma única:

```tsx
{blogs.map((post) => (
  <Card key={post.id}> {/* key es obligatorio en listas */}
    <h2>{post.title}</h2>
  </Card>
))}
```

---

### `forwardRef` — Exponer el DOM de un componente hijo al padre

Normalmente el padre no puede acceder al DOM interno de un componente hijo. `forwardRef` permite que el padre le pase un `ref` al hijo para acceder a su elemento DOM.

Se usa en `Card.tsx` para que otros componentes puedan referenciar el `<div>` interno de la card:

```tsx
const Card = forwardRef((props, ref) => {
  return <motion.div ref={ref} ...>{props.children}</motion.div>;
});
```

---

### `'use client'` — Componentes del lado del cliente

Next.js App Router tiene dos tipos de componentes:

- **Server Components** (por defecto): se renderizan en el servidor, no pueden usar hooks ni eventos del navegador.
- **Client Components** (`'use client'`): se ejecutan en el navegador y pueden usar `useState`, `useEffect`, `onClick`, etc.

Casi todos los archivos del proyecto tienen `'use client'` al inicio porque usan hooks de React o escuchan eventos:

```tsx
'use client'; // ← Esta línea indica que es un Client Component

import { useState } from 'react';
```

---

## 4. Cómo funciona Firebase en el proyecto

### `lib/firebase.ts` — La conexión con Firebase

Este archivo configura la conexión con nuestro proyecto en la nube de Firebase. Las credenciales se leen de variables de entorno (`.env.local`) para no exponerlas en el código:

```ts
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  // ...
};

const app = initializeApp(firebaseConfig); // Inicializar Firebase con las credenciales
export const auth = getAuth(app);          // Sistema de autenticación
export const db = getFirestore(app);       // Base de datos Firestore
```

También exporta funciones listas para usar: `signInWithGoogle`, `logOut`.

---

### Firebase Auth — Registro e inicio de sesión

Firebase Auth maneja todo lo relacionado con usuarios: crear cuentas, iniciar sesión, cerrar sesión y detectar si hay una sesión activa.

**`onAuthStateChanged`** es la función más importante. Es como un "guardián" que escucha en tiempo real si el usuario inicia o cierra sesión:

```tsx
useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    if (user) {
      // El usuario está logueado. 'user' tiene: uid, displayName, email, photoURL
      setIsAuthenticated(true);
      setUserName(user.displayName);
    } else {
      // No hay sesión activa
      setIsAuthenticated(false);
    }
  });
  return unsubscribe; // Cancelar la escucha al desmontar
}, []);
```

**Métodos de autenticación que usa el proyecto:**

```ts
// Login con Google (abre ventana emergente)
signInWithPopup(auth, new GoogleAuthProvider())

// Login con email y contraseña
signInWithEmailAndPassword(auth, email, password)

// Crear cuenta nueva
createUserWithEmailAndPassword(auth, email, password)

// Cerrar sesión
signOut(auth)
```

---

### Firestore — La base de datos

Firestore es una base de datos NoSQL (no tiene tablas como Excel). En cambio, tiene **colecciones** de **documentos**, como carpetas llenas de fichas.

#### Estructura de datos del proyecto

```
blogs/                          ← Colección de todos los blogs
  {blogId}/                     ← Un documento por blog
    title: "Mi primer blog"
    body: "Texto del blog..."
    tags: ["Tecnología", "Viajes"]
    authorId: "uid-del-autor"
    authorName: "Juan Pérez"
    favoriteCount: 12
    createdAt: Timestamp
    comments/                   ← Subcolección de comentarios
      {commentId}/
        content: "¡Buen artículo!"
        authorId: "uid-del-comentador"
        authorName: "María García"
        hidden: false
        likedBy: ["uid1", "uid2"]
        dislikedBy: ["uid3"]
        createdAt: Timestamp

users/                          ← Colección de usuarios
  {uid}/                        ← Un documento por usuario
    favorites/                  ← Subcolección de favoritos
      {blogId}/                 ← Un documento por blog guardado
        blogId: "abc123"
        addedAt: Timestamp
```

#### Operaciones de Firestore

**Leer todos los documentos de una colección:**
```ts
const snap = await getDocs(collection(db, 'blogs'));
const blogs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
```

**Leer un solo documento por ID:**
```ts
const snap = await getDoc(doc(db, 'blogs', blogId));
if (snap.exists()) {
  const blog = snap.data();
}
```

**Crear un documento nuevo (Firestore genera el ID):**
```ts
const ref = await addDoc(collection(db, 'blogs'), {
  title: 'Mi blog',
  createdAt: serverTimestamp(), // Fecha del servidor, más confiable
});
```

**Crear o sobreescribir un documento con ID específico:**
```ts
await setDoc(doc(db, 'users', uid, 'favorites', blogId), {
  blogId,
  addedAt: serverTimestamp(),
});
```

**Actualizar campos de un documento:**
```ts
await updateDoc(doc(db, 'blogs', blogId), {
  favoriteCount: increment(1),   // Suma 1 (o resta con increment(-1))
  likedBy: arrayUnion(uid),      // Agrega uid al array sin duplicados
  dislikedBy: arrayRemove(uid),  // Quita uid del array
});
```

**Eliminar un documento:**
```ts
await deleteDoc(doc(db, 'blogs', blogId));
```

**Filtrar documentos con `where`:**
```ts
// Solo traer los blogs del usuario actual
const q = query(
  collection(db, 'blogs'),
  where('authorId', '==', user.uid)
);
const snap = await getDocs(q);
```

**Ordenar con `orderBy`:**
```ts
const q = query(
  collection(db, 'blogs', id, 'comments'),
  orderBy('createdAt', 'asc') // De más antiguo a más reciente
);
```

---

## 5. Flujo completo de cada página

### Página de inicio (`app/page.tsx`)

Es el "ensamblador" que junta todos los componentes visuales en orden:

```tsx
export default function Home() {
  return (
    <main>
      <Hero />           {/* Sección grande con título y botones */}
      <TrendingTopics /> {/* Botones de etiquetas */}
      <BlogFeed />       {/* Cuadrícula de blogs destacados */}
      <CTA />            {/* Sección de llamada a la acción */}
    </main>
  );
}
```

---

### Feed (`app/feed/page.tsx`)

1. Al cargar, trae **todos los blogs** de Firestore con `getDocs`.
2. Si hay usuario logueado, trae su subcolección de **favoritos** para saber qué corazones mostrar activos.
3. El usuario puede **filtrar por etiqueta** (Tecnología, Viajes, etc.) y **ordenar** por más nuevos o más favoritos.
4. `useMemo` recalcula la lista mostrada solo cuando cambia el filtro, el orden o los blogs.
5. Al hacer click en el corazón: **optimistic update** (ver sección 8).

---

### Detalle de blog (`app/feed/[id]/page.tsx`)

La carpeta `[id]` crea una **ruta dinámica**: `tu-web.com/feed/abc123` y `tu-web.com/feed/xyz789` son páginas distintas generadas por el mismo archivo.

El `id` se obtiene así:

```tsx
// params llega como Promise en Next.js App Router
export default function BlogDetailPage({ params }) {
  const { id } = use(params); // 'use' desenvuelve la Promise
  // Ahora 'id' tiene el valor de la URL: "abc123", "xyz789", etc.
}
```

Luego:
1. Carga el blog con `getDoc(doc(db, 'blogs', id))`.
2. Carga los comentarios de la subcolección `blogs/{id}/comments` ordenados por fecha.
3. Si el usuario es el autor, puede **eliminar el blog** u **ocultar comentarios**.
4. Si el usuario es el autor del comentario, puede **eliminarlo**.
5. Cualquier usuario logueado puede **votar comentarios** (like/dislike) usando `arrayUnion`/`arrayRemove`.

---

### Publicar (`app/publicar/page.tsx`)

1. **Auth guard**: Si no hay sesión, redirige automáticamente al login.
2. Muestra un formulario con título, texto y selector de etiquetas.
3. Al enviar, llama a `addDoc` para crear el documento en Firestore.
4. Después de publicar, redirige al Feed.

---

### Mis Blogs (`app/mis-blogs/page.tsx`)

1. **Auth guard**: Solo accesible si hay sesión.
2. Trae los blogs filtrando por `authorId == user.uid` con `where`.
3. Al hacer click en el ícono de papelera, abre el `ConfirmModal`.
4. Si el usuario confirma, ejecuta `deleteDoc` y quita el blog de la lista local sin recargar la página.

---

### Favoritos (`app/favoritos/page.tsx`)

1. **Auth guard**: Solo accesible si hay sesión.
2. Lee la subcolección `users/{uid}/favorites` para obtener los IDs de los blogs guardados.
3. Usa `Promise.all` para obtener todos los blogs en **paralelo** (más rápido que uno por uno):

```ts
const favSnap = await getDocs(collection(db, 'users', uid, 'favorites'));
const blogIds = favSnap.docs.map(d => d.id);

// Promise.all lanza todas las peticiones al mismo tiempo
const blogDocs = await Promise.all(
  blogIds.map(id => getDoc(doc(db, 'blogs', id)))
);
```

---

### Login y Signup

- El formulario usa `useState` para guardar lo que el usuario escribe.
- Al enviar llama a `signInWithEmailAndPassword` o `createUserWithEmailAndPassword`.
- Si hay error (contraseña incorrecta, email ya registrado), muestra el mensaje de Firebase.
- Si todo está bien, `onAuthStateChanged` detecta la nueva sesión y redirige al inicio.

---

## 6. Auth guards — Cómo protegemos páginas privadas

Las páginas de Publicar, Mis Blogs y Favoritos son solo para usuarios autenticados. El patrón es siempre el mismo:

```tsx
useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    setUser(user);
    setAuthLoading(false);
    if (!user) router.replace('/login'); // Si no hay sesión, al login
  });
  return unsubscribe;
}, [router]);

// Mostrar spinner mientras Firebase verifica la sesión
if (authLoading) return <Spinner />;

// Si no hay usuario (ya redirigió), no renderizar nada
if (!user) return null;
```

Se usa `router.replace` en vez de `router.push` para que el usuario **no pueda volver** a la página protegida con el botón "atrás" del navegador.

---

## 7. Optimistic UI — La UI que no espera a la red

En el Feed, cuando el usuario hace click en el corazón de favorito, la UI **responde de inmediato** sin esperar a que Firestore confirme. Si Firestore falla, revierte el cambio:

```tsx
const toggleFavorite = async (blogId) => {
  const isFaved = favorites.has(blogId);

  // 1. Actualizar el estado local INMEDIATAMENTE (antes de la red)
  if (isFaved) {
    setFavorites(prev => { const s = new Set(prev); s.delete(blogId); return s; });
    setBlogs(prev => prev.map(b => b.id === blogId
      ? { ...b, favoriteCount: b.favoriteCount - 1 } : b));
  } else {
    setFavorites(prev => new Set(prev).add(blogId));
    setBlogs(prev => prev.map(b => b.id === blogId
      ? { ...b, favoriteCount: b.favoriteCount + 1 } : b));
  }

  try {
    // 2. Confirmar con Firestore
    if (isFaved) {
      await deleteDoc(favRef);
      await updateDoc(blogRef, { favoriteCount: increment(-1) });
    } else {
      await setDoc(favRef, { blogId, addedAt: serverTimestamp() });
      await updateDoc(blogRef, { favoriteCount: increment(1) });
    }
  } catch (err) {
    // 3. Si falla la red, revertir el cambio optimista
    // (código espejo del paso 1, pero al revés)
  }
};
```

Esto hace que la app se sienta instantánea aunque la red tarde 300ms.

---

## 8. Tailwind CSS — Cómo leer las clases

Tailwind no usa archivos CSS separados. En cambio, cada clase hace UNA cosa:

| Clase | Equivalente CSS |
|---|---|
| `flex` | `display: flex` |
| `items-center` | `align-items: center` |
| `gap-4` | `gap: 1rem` |
| `px-4 py-2` | `padding: 0.5rem 1rem` |
| `rounded-xl` | `border-radius: 0.75rem` |
| `text-sm` | `font-size: 0.875rem` |
| `font-bold` | `font-weight: 700` |
| `text-red-500` | color rojo específico |
| `hover:bg-red-50` | fondo rojo suave al pasar el cursor |
| `md:flex` | `display: flex` solo en pantallas ≥ 768px |
| `hidden md:block` | oculto en móvil, visible desde tablet |
| `lg:grid-cols-3` | 3 columnas en pantallas grandes |

Los colores del tema (azul primario, fondo, etc.) están definidos como variables CSS en `globals.css` y se usan así: `bg-[var(--primary)]`.

---

## 9. Framer Motion — Animaciones declarativas

Framer Motion permite animar componentes describiendo los estados inicial y final:

```tsx
import { motion } from 'framer-motion';

// Este div aparece deslizándose desde abajo con opacidad 0
<motion.div
  initial={{ opacity: 0, y: 20 }}   // Estado inicial (invisible, 20px abajo)
  animate={{ opacity: 1, y: 0 }}    // Estado final (visible, posición normal)
  transition={{ duration: 0.3 }}    // La transición dura 0.3 segundos
>
  Contenido
</motion.div>
```

**`whileInView`** anima el elemento solo cuando entra al área visible de la pantalla (útil para secciones que el usuario descubre al hacer scroll):

```tsx
<motion.div
  initial={{ opacity: 0 }}
  whileInView={{ opacity: 1 }}
  viewport={{ once: true }} // Solo anima una vez, no cada vez que hace scroll
>
```

**Efecto stagger** (aparición escalonada de elementos de una lista):

```tsx
{topics.map((topic, index) => (
  <motion.button
    key={topic.name}
    initial={{ opacity: 0, x: 20 }}
    whileInView={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.3, delay: index * 0.05 }} // Cada botón espera un poco más
  >
```

Con `delay: index * 0.05`, el botón 0 aparece en 0s, el 1 en 0.05s, el 2 en 0.1s, etc., creando el efecto de cascada.

---

## 10. Preguntas frecuentes

**¿Por qué todos los archivos tienen `'use client'` al inicio?**
Porque usan hooks de React (`useState`, `useEffect`) o manejan eventos del navegador (`onClick`). Sin esta directiva, Next.js intentaría renderizarlos en el servidor donde esas funciones no existen.

**¿Por qué usamos `router.replace` en vez de `router.push` en los guards?**
`push` agrega la ruta actual al historial del navegador. `replace` la sobreescribe. Así, si un usuario no autenticado es redirigido de `/mis-blogs` a `/login`, no puede presionar "atrás" para regresar a `/mis-blogs`.

**¿Por qué `serverTimestamp()` en vez de `new Date()`?**
`new Date()` usa el reloj del dispositivo del usuario, que puede estar mal configurado. `serverTimestamp()` usa el reloj de los servidores de Google, que es siempre preciso.

**¿Por qué `e.stopPropagation()` en algunos botones?**
Cuando un botón está dentro de una card clickeable, hacer click en el botón también activa el onClick de la card. `e.stopPropagation()` detiene esa propagación para que solo se ejecute la acción del botón (ej. eliminar o agregar a favoritos) y no la navegación de la card.
