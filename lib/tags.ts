export const TAG_COLORS: Record<string, string> = {
  'Tecnología':    'bg-blue-100 text-blue-600',
  'Estilo de Vida':'bg-pink-100 text-pink-600',
  'Música':        'bg-purple-100 text-purple-600',
  'Fotografía':    'bg-amber-100 text-amber-600',
  'Viajes':        'bg-cyan-100 text-cyan-600',
  'Gastronomía':   'bg-orange-100 text-orange-600',
  'Literatura':    'bg-emerald-100 text-emerald-600',
  'Videojuegos':   'bg-red-100 text-red-600',
};

export const tagColor = (tag: string) =>
  TAG_COLORS[tag] ?? 'bg-gray-100 text-gray-600';

export const TAGS = Object.keys(TAG_COLORS);
