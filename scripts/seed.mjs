/**
 * seed.mjs — Crea 6 usuarios con blogs en Firebase via REST API
 *
 * Uso:
 *   node scripts/seed.mjs
 *
 * Requiere Node.js 18+ (fetch nativo).
 * Lee las variables de entorno de .env.local en la raíz del proyecto.
 * Si un usuario ya existe, lo omite y continúa.
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// ── Leer .env.local ──────────────────────────────────────────────────────────
const __dir = dirname(fileURLToPath(import.meta.url));
// Buscar .env.local en el worktree y luego en la raíz del proyecto principal
const candidates = [
  resolve(__dir, '..', '.env.local'),
  resolve(__dir, '..', '.env'),
  resolve(__dir, '..', '..', '..', '..', '.env.local'),
  resolve(__dir, '..', '..', '..', '..', '.env'),
];
let envContent = '';
for (const p of candidates) {
  try { envContent = readFileSync(p, 'utf8'); break; } catch { /* seguir */ }
}
if (!envContent) {
  console.error('No se encontró .env.local ni .env. Buscado en:\n' + candidates.join('\n'));
  process.exit(1);
}
for (const line of envContent.split('\n')) {
  const [key, ...rest] = line.split('=');
  if (key && rest.length) process.env[key.trim()] = rest.join('=').trim();
}

const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

if (!API_KEY || !PROJECT_ID) {
  console.error('Faltan NEXT_PUBLIC_FIREBASE_API_KEY o NEXT_PUBLIC_FIREBASE_PROJECT_ID en .env.local');
  process.exit(1);
}

const AUTH_URL = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`;
const SIGN_IN_URL = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`;
const FS_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

// ── Datos de usuarios ────────────────────────────────────────────────────────
const USERS = [
  { displayName: 'Gerardo Perez Sanchez',        email: 'gerardo.perez@bloghub.mx',   password: 'Pass1234' },
  { displayName: 'Lesly Josselin Gonzalez Jimenez', email: 'lesly.gonzalez@bloghub.mx', password: 'Pass1234' },
  { displayName: 'David de la Luz Cuadros',      email: 'david.cuadros@bloghub.mx',   password: 'Pass1234' },
  { displayName: 'Brisa Yaremi Hernandez Reyes', email: 'brisa.hernandez@bloghub.mx', password: 'Pass1234' },
  { displayName: 'Maximo Roberto Martinez Brito',email: 'maximo.martinez@bloghub.mx', password: 'Pass1234' },
  { displayName: 'Julio Cesar Santana Becerril', email: 'julio.santana@bloghub.mx',   password: 'Pass1234' },
];

// ── Blogs por usuario (índice coincide con USERS) ────────────────────────────
const BLOGS = [
  // Gerardo – Tecnología
  [
    {
      title: 'Cómo la inteligencia artificial está cambiando el desarrollo de software',
      body: 'La inteligencia artificial ha dejado de ser ciencia ficción para convertirse en una herramienta cotidiana en el mundo del desarrollo de software. Desde la autocompletación de código hasta la generación automática de pruebas unitarias, los modelos de lenguaje grandes están redefiniendo lo que significa ser programador en 2025.\n\nHerramientas como GitHub Copilot o Cursor ya son utilizadas por millones de desarrolladores alrededor del mundo. Pero más allá de la productividad, estos sistemas plantean preguntas profundas: ¿qué habilidades serán las más valiosas en el futuro? ¿Seguirá siendo necesario entender los fundamentos de la programación?\n\nMi postura es que la IA amplifica el talento humano pero no lo reemplaza. Los desarrolladores que aprendan a trabajar de la mano con estas herramientas serán los más competitivos. La clave está en mantener el pensamiento crítico y la capacidad de revisar y entender el código generado.',
      tags: ['Tecnología'],
    },
    {
      title: 'Por qué deberías aprender Rust en 2025',
      body: 'Durante años, C y C++ dominaron los escenarios donde el rendimiento era crítico. Hoy, Rust se posiciona como una alternativa moderna que garantiza seguridad de memoria sin sacrificar velocidad. Y los números lo respaldan: por séptimo año consecutivo, Rust es el lenguaje más amado por los desarrolladores según la encuesta de Stack Overflow.\n\nLo que hace especial a Rust es su sistema de ownership: en tiempo de compilación, el compilador verifica que no existan carreras de datos ni referencias inválidas. Esto elimina categorías completas de bugs que en C++ solo se descubren en producción.\n\nSi ya sabes programar, el camino de aprendizaje de Rust es empinado pero gratificante. El compilador es tu mejor maestro: los errores son descriptivos y te enseñan los conceptos de ownership en el proceso.',
      tags: ['Tecnología'],
    },
  ],
  // Lesly – Estilo de Vida
  [
    {
      title: 'Minimalismo digital: cómo limpié mi vida de distracciones tecnológicas',
      body: 'Hace un año tenía 47 aplicaciones instaladas en el teléfono. Revisaba Instagram al despertar, antes de dormir, y en cada momento de aburrimiento. No era vida consciente; era reacción continua a estímulos diseñados para capturar mi atención.\n\nDecidí hacer un experimento: eliminar todas las apps de redes sociales por 30 días. Lo que esperaba ser un sacrificio se convirtió en liberación. Recuperé horas de tiempo, mejoró mi concentración y empecé a notar cosas que antes ignoraba: conversaciones, colores, silencios.\n\nHoy mantengo un sistema minimalista: tres apps de redes sociales a las que accedo solo desde el navegador, notificaciones desactivadas para todo excepto llamadas, y el teléfono fuera del cuarto al dormir. El resultado es más tiempo para lo que realmente importa.',
      tags: ['Estilo de Vida'],
    },
    {
      title: 'El poder de las rutinas matutinas: lo que aprendí de 6 meses de disciplina',
      body: 'Durante mucho tiempo creí que las rutinas matutinas eran para personas con más fuerza de voluntad que yo. Me despertaba, revisaba el teléfono, y ya me sentía abrumada antes de salir de la cama. Todo cambió cuando empecé de manera pequeña: solo cinco minutos de silencio sin pantallas al despertar.\n\nCon el tiempo, esos cinco minutos se convirtieron en veinte, luego en una hora. Agregué meditación, agua con limón, y escritura libre en papel. No porque algún influencer me lo dijera, sino porque noté cómo cada elemento transformaba mi energía durante el día.\n\nLa clave no es copiar la rutina perfecta de alguien más. Es experimentar hasta encontrar qué te funciona a ti. Para mí, el silencio matutino es sagrado; para ti, quizás sea el ejercicio o la lectura.',
      tags: ['Estilo de Vida'],
    },
  ],
  // David – Fotografía
  [
    {
      title: 'Fotografía callejera: el arte de capturar lo ordinario',
      body: 'La fotografía callejera es la disciplina más honesta que conozco. No hay estudio, no hay iluminación controlada, no hay segunda oportunidad. Es tú y el mundo, y tienes fracciones de segundo para capturar algo que cuente una historia.\n\nComencé a practicar street photography con miedo al rechazo. ¿Qué pensaría la gente si los fotografío? Con el tiempo aprendí que la mayoría ni siquiera nota la cámara si te mueves con confianza y naturalidad. Y los que sí notan, a menudo sonríen.\n\nEl equipo no importa tanto como la mirada. He visto fotógrafos con cámaras de 5000 dólares tomar imágenes aburridas, y he visto imágenes extraordinarias hechas con un teléfono. La diferencia está en saber qué buscar: luz, geometría, contraste humano, momentos de conexión o soledad.',
      tags: ['Fotografía'],
    },
    {
      title: 'RAW vs JPEG: la guía definitiva para elegir el formato correcto',
      body: 'Una de las primeras decisiones que enfrenta cualquier fotógrafo que sale del modo automático es elegir entre disparar en RAW o en JPEG. Ambos formatos tienen ventajas reales, y la elección correcta depende del contexto.\n\nRAW captura todos los datos del sensor sin compresión destructiva. Esto significa mayor rango dinámico, más latitud para recuperar luces y sombras en edición, y control total sobre el balance de blancos. El costo: archivos enormes (típicamente 20-30 MB por imagen) y la obligación de editar cada foto antes de compartirla.\n\nJPEG aplica compresión y procesado en cámara. Los archivos son pequeños, se pueden compartir de inmediato, y en condiciones de luz perfecta la diferencia con RAW es prácticamente imperceptible. Para fotógrafos de eventos deportivos que envían imágenes en vivo a una redacción, JPEG es la opción práctica.\n\nMi recomendación: dispara RAW+JPEG. Así tienes lo mejor de ambos mundos sin sacrificar nada.',
      tags: ['Fotografía'],
    },
  ],
  // Brisa – Viajes
  [
    {
      title: 'Viajar sola como mujer: lo que nadie te dice antes de hacerlo',
      body: 'Cuando anuncié que haría mi primer viaje sola a Europa, las reacciones fueron mixtas. "¿No te da miedo?" era la pregunta más común, seguida de consejos no solicitados sobre seguridad. Decidí ir de todas formas, y fue la mejor decisión de mi vida.\n\nViajar sola tiene una libertad que ningún viaje en grupo puede replicar. Decides cuándo despertar, cuánto tiempo pasar en cada lugar, si comer en un restaurante con vista o comprar un sándwich en el mercado. Tu itinerario es 100% tuyo.\n\nSí hay consideraciones de seguridad que vale la pena tomar: compartir tu ubicación con alguien de confianza, investigar los barrios donde vas a alojarte, confiar en tus instintos cuando una situación se siente mal. Pero la realidad es que la mayoría de los momentos de peligro percibido resultan ser solo incomodidad nueva.',
      tags: ['Viajes'],
    },
    {
      title: 'Oaxaca en 5 días: guía honesta sin filtros',
      body: 'Oaxaca tiene la reputación de ser la ciudad más mágica de México, y después de cinco días puedo confirmar que esa reputación es merecida. Pero también puede decepcionarte si llegas con expectativas erróneas.\n\nLo que nadie te dice: Oaxaca es cara para los estándares mexicanos. El turismo gastronómico ha elevado los precios en el centro histórico. Si buscas la experiencia "auténtica" de un mole por 80 pesos, tendrás que alejarte de la zona turística.\n\nLo que vale absolutamente cada peso: el mezcal artesanal en una mezcalería pequeña, una visita guiada al Mercado de Benito Juárez temprano por la mañana, y la subida al Monte Albán al atardecer cuando ya se van los tour buses. Esos momentos son exactamente lo que buscas cuando decides viajar.',
      tags: ['Viajes'],
    },
  ],
  // Maximo – Gastronomía
  [
    {
      title: 'El arte del mole: tres días cocinando el platillo más complejo de México',
      body: 'El mole negro de Oaxaca tiene entre 30 y 36 ingredientes dependiendo de la receta. No es exageración: chiles mulatos, anchos, pasilla, chilhuacle negro, tomates, tomatillos, plátano macho, almendras, cacahuates, ajonjolí, clavo, canela, pimienta, comino, hierbas de olor, chocolate amargo, y tortilla quemada para dar color. Cada elemento cumple una función.\n\nDecidí intentar hacerlo desde cero en casa. El proceso me tomó tres días: el primero para conseguir los ingredientes (algunos los encontré solo en el mercado de la Merced), el segundo para tostar, remojar, freír y licuar cada ingrediente por separado, y el tercero para integrar y cocinar el mole a fuego lento durante cuatro horas.\n\nEl resultado no fue perfecto. Le faltaba profundidad en comparación con el mole de mi abuela. Pero entendí algo: el mole no es solo una receta, es memoria cultural condensada en una salsa.',
      tags: ['Gastronomía'],
    },
    {
      title: 'Fermentación casera: kombucha, kimchi y kéfir para principiantes',
      body: 'La fermentación es la tecnología culinaria más antigua que existe. Antes de la refrigeración, fermentar era la manera de preservar alimentos y hacerlos más nutritivos. Hoy, en pleno 2025, la fermentación casera está experimentando un renacimiento por buenas razones: probióticos, sabor complejo, y la satisfacción de producir algo vivo en tu cocina.\n\nEmpecé con kombucha porque es la más permisiva. Solo necesitas té, azúcar, y un SCOBY (que puedes conseguir en grupos de fermentación locales o en línea). El proceso toma 7-14 días y el margen de error es amplio. Si algo sale mal, el olor ácido-podrido te lo dice de inmediato.\n\nEl kimchi fue más intimidante por la cantidad de ingredientes, pero también más gratificante. Hay algo profundamente satisfactorio en abrir un frasco de kimchi que hiciste tú mismo, con col que comprase en el mercado.',
      tags: ['Gastronomía'],
    },
  ],
  // Julio – Videojuegos
  [
    {
      title: 'Por qué los videojuegos indie están superando a los AAA en creatividad',
      body: 'En 2024, tres de los cinco juegos más alabados por la crítica eran títulos independientes hechos por equipos de menos de 20 personas. Mientras las grandes publishers luchan con presupuestos de cientos de millones de dólares y tienen pánico al riesgo creativo, los estudios indie experimentan libremente.\n\nHades, Celeste, Disco Elysium, Hollow Knight: estos juegos no solo son técnicamente impresionantes dado su presupuesto; son narrativamente ambiciosos de formas que los juegos AAA rara vez se atreven. ¿Cuándo fue la última vez que un Call of Duty o un FIFA te hizo reflexionar sobre algo?\n\nEl modelo de distribución digital democratizó el acceso. Steam, itch.io, y las tiendas de consolas permiten a cualquier equipo pequeño llegar a millones de jugadores sin necesitar un distribuidor tradicional. Eso cambia todo.',
      tags: ['Videojuegos'],
    },
    {
      title: 'Cómo los videojuegos me enseñaron a manejar la frustración',
      body: 'Dark Souls tiene la reputación de ser el juego más difícil que existe. Cuando lo empecé por primera vez, morí 47 veces en el primer jefe (Asylum Demon) antes de finalmente derrotarlo. En ese proceso aprendí algo que no encontré en ningún libro de autoayuda: la relación entre el fracaso, el aprendizaje, y la persistencia.\n\nCada muerte en Dark Souls contiene información. ¿Por qué morí? ¿Fui demasiado agresivo? ¿No observé el patrón de ataque? ¿Intenté la estrategia equivocada? El juego no te da la respuesta; te da la pregunta y te pide que la respondas con tu siguiente intento.\n\nEsa mentalidad se trasladó a mi vida fuera de los videojuegos. Los proyectos que no salieron como esperaba, las entrevistas de trabajo que no resultaron, los objetivos que no alcancé: ahora los proceso como información, no como fracasos definitivos.',
      tags: ['Videojuegos'],
    },
  ],
];

// ── Helpers REST API ─────────────────────────────────────────────────────────
async function createUser(email, password, displayName) {
  const res = await fetch(AUTH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, displayName, returnSecureToken: true }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return { uid: data.localId, idToken: data.idToken };
}

async function signIn(email, password) {
  const res = await fetch(SIGN_IN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return { uid: data.localId, idToken: data.idToken };
}

function toFSValue(value) {
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'number') return { integerValue: String(value) };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(toFSValue) } };
  if (value && typeof value === 'object' && value._type === 'timestamp') {
    return { timestampValue: value.value };
  }
  return { nullValue: null };
}

function toFSFields(obj) {
  const fields = {};
  for (const [k, v] of Object.entries(obj)) {
    fields[k] = toFSValue(v);
  }
  return fields;
}

async function createBlog(idToken, data) {
  const res = await fetch(`${FS_BASE}/blogs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`,
    },
    body: JSON.stringify({ fields: toFSFields(data) }),
  });
  const result = await res.json();
  if (result.error) throw new Error(JSON.stringify(result.error));
  return result.name.split('/').pop();
}

// ── Main ─────────────────────────────────────────────────────────────────────
console.log('🌱 Iniciando seed de Firebase...\n');

const createdUsers = [];

// Paso 1: crear / iniciar sesión en todos los usuarios
for (const user of USERS) {
  process.stdout.write(`  Creando usuario: ${user.displayName}... `);
  try {
    const result = await createUser(user.email, user.password, user.displayName);
    createdUsers.push({ ...user, ...result });
    console.log(`✓ (${result.uid})`);
  } catch (err) {
    if (err.message.includes('EMAIL_EXISTS')) {
      process.stdout.write('ya existe, iniciando sesión... ');
      try {
        const result = await signIn(user.email, user.password);
        createdUsers.push({ ...user, ...result });
        console.log(`✓ (${result.uid})`);
      } catch (signInErr) {
        console.log(`✗ Error al iniciar sesión: ${signInErr.message}`);
        createdUsers.push({ ...user, uid: null, idToken: null });
      }
    } else {
      console.log(`✗ Error: ${err.message}`);
      createdUsers.push({ ...user, uid: null, idToken: null });
    }
  }
}

const uids = createdUsers.map((u) => u.uid).filter(Boolean);
console.log(`\n  ${uids.length} usuarios listos.\n`);

// Paso 2: crear blogs por usuario
const now = new Date();
let totalBlogs = 0;

for (let i = 0; i < createdUsers.length; i++) {
  const user = createdUsers[i];
  if (!user.uid || !user.idToken) {
    console.log(`  Omitiendo blogs de ${user.displayName} (sin idToken)`);
    continue;
  }

  const otherUids = uids.filter((u) => u !== user.uid);
  const userBlogs = BLOGS[i];

  for (let j = 0; j < userBlogs.length; j++) {
    const blog = userBlogs[j];
    // El primer blog de cada usuario tiene más likes (todos los demás lo dieron)
    // El segundo blog tiene la mitad de likes
    const likedBy = j === 0 ? otherUids : otherUids.slice(0, Math.ceil(otherUids.length / 2));

    const createdAt = new Date(now.getTime() - (i * 2 + j) * 3600000);

    process.stdout.write(`  Publicando "${blog.title.slice(0, 50)}..."... `);
    try {
      await createBlog(user.idToken, {
        title: blog.title,
        body: blog.body,
        tags: blog.tags,
        authorId: user.uid,
        authorName: user.displayName,
        likedBy,
        createdAt: { _type: 'timestamp', value: createdAt.toISOString() },
      });
      console.log('✓');
      totalBlogs++;
    } catch (err) {
      console.log(`✗ Error: ${err.message}`);
    }
  }
}

console.log(`\n✅ Seed completo: ${createdUsers.filter(u => u.uid).length} usuarios, ${totalBlogs} blogs creados.\n`);
console.log('Credenciales de los usuarios:');
for (const u of USERS) {
  console.log(`  ${u.displayName.padEnd(36)} ${u.email}  /  ${u.password}`);
}
