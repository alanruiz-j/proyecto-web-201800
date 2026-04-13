'use client';

import { motion } from 'framer-motion';
import { Code, Heart, Music, Camera, Plane, Utensils, Book, Gamepad2 } from 'lucide-react';

const topics = [
  { name: 'Tecnología', icon: Code, color: 'bg-blue-100 text-blue-600' },
  { name: 'Estilo de Vida', icon: Heart, color: 'bg-pink-100 text-pink-600' },
  { name: 'Música', icon: Music, color: 'bg-purple-100 text-purple-600' },
  { name: 'Fotografía', icon: Camera, color: 'bg-amber-100 text-amber-600' },
  { name: 'Viajes', icon: Plane, color: 'bg-cyan-100 text-cyan-600' },
  { name: 'Gastronomía', icon: Utensils, color: 'bg-orange-100 text-orange-600' },
  { name: 'Literatura', icon: Book, color: 'bg-emerald-100 text-emerald-600' },
  { name: 'Videojuegos', icon: Gamepad2, color: 'bg-red-100 text-red-600' },
];

export default function TrendingTopics() {
  return (
    <section className="py-8 bg-[var(--muted)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-hide"
        >
          <span className="text-sm font-medium text-[var(--muted-foreground)] shrink-0">
           Temas Populares:
          </span>
          <div className="flex gap-3">
            {topics.map((topic, index) => (
              <motion.button
                key={topic.name}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${topic.color} hover:shadow-md`}
              >
                <topic.icon size={16} />
                <span className="text-sm font-medium">{topic.name}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}