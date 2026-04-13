'use client';

import { motion } from 'framer-motion';
import { BookOpen, PenTool, Heart, Users, TrendingUp, Shield } from 'lucide-react';
import Card from './Card';

const features = [
  {
    icon: BookOpen,
    title: 'Descubre Contenido',
    description: 'Explora millones de historias personalizadas para ti según tus intereses.',
    color: 'bg-blue-100',
    iconColor: 'text-blue-600',
  },
  {
    icon: PenTool,
    title: 'Escribe Fácilmente',
    description: 'Editor intuitivo con herramientas powerfules para dar vida a tus ideas.',
    color: 'bg-purple-100',
    iconColor: 'text-purple-600',
  },
  {
    icon: Heart,
    title: 'Comunidad Activa',
    description: 'Conecta con lectores y escritores que comparten tu pasión.',
    color: 'bg-pink-100',
    iconColor: 'text-pink-600',
  },
  {
    icon: Users,
    title: 'Sígue Creadores',
    description: 'Encuentra a tus escritores favoritos y nunca te pierdas una publicación.',
    color: 'bg-indigo-100',
    iconColor: 'text-indigo-600',
  },
  {
    icon: TrendingUp,
    title: 'Contenido Viral',
    description: 'Tus historias pueden alcanzar a millones de lectores alrededor del mundo.',
    color: 'bg-amber-100',
    iconColor: 'text-amber-600',
  },
  {
    icon: Shield,
    title: 'Plataforma Segura',
    description: 'Tu contenido está protegido y tú controlas quién puede verlo.',
    color: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
  },
];

export default function Features() {
  return (
    <section className="py-16 sm:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Todo lo que necesitas para crear y descubrir
          </h2>
          <p className="text-lg text-[var(--muted-foreground)] max-w-2xl mx-auto">
            Herramientas powerfules diseñados para escritores y lectores exigentes
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card hover className="p-6 h-full">
                <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-4`}>
                  <feature.icon size={24} className={feature.iconColor} />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-[var(--muted-foreground)]">{feature.description}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}