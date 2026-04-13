'use client';

import { motion } from 'framer-motion';
import { Clock, User } from 'lucide-react';
import Card from './Card';
import Button from './Button';

interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  category: string;
  author: string;
  authorAvatar: string;
  coverImage: string;
  readTime: string;
  date: string;
}

const blogPosts: BlogPost[] = [
  {
    id: 1,
    title: 'El Arte de Escribir Historias que Conectan',
    excerpt: 'Descubre los secretos para escribir historias que permanecen en la memoria de tus lectores.',
    category: 'Escritura Creativa',
    author: 'María García',
    authorAvatar: 'MG',
    coverImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    readTime: '8 min',
    date: '2 horas atrás',
  },
  {
    id: 2,
    title: 'Cómo Construir una Comunidad de Lectores',
    excerpt: 'Estrategias probadas para construir una audiencia leal y comprometida con tu contenido.',
    category: 'Marketing Digital',
    author: 'Carlos López',
    authorAvatar: 'CL',
    coverImage: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    readTime: '6 min',
    date: '5 horas atrás',
  },
  {
    id: 3,
    title: '10 Herramientas que Todo Escritor Necesita',
    excerpt: 'Las mejores herramientas tecnológicas para mejorar tu productividad como escritor.',
    category: 'Tecnología',
    author: 'Ana Martínez',
    authorAvatar: 'AM',
    coverImage: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    readTime: '12 min',
    date: '1 día atrás',
  },
  {
    id: 4,
    title: 'Encontrando tu Voz como Escritor',
    excerpt: 'Guía práctica para desarrollar un estilo único y auténtico en tu escritura.',
    category: 'Desarrollo Personal',
    author: 'David Chen',
    authorAvatar: 'DC',
    coverImage: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    readTime: '10 min',
    date: '1 día atrás',
  },
  {
    id: 5,
    title: 'El Futuro de los Blogs en la Era Digital',
    excerpt: 'Análisis de las tendencias actuales y lo que viene para el blogging.',
    category: 'Tendencias',
    author: 'Laura Torres',
    authorAvatar: 'LT',
    coverImage: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    readTime: '7 min',
    date: '2 días atrás',
  },
  {
    id: 6,
    title: 'Cómo Monetizar tu Blog Ética y Efectivamente',
    excerpt: 'Métodos transparentes para generar ingresos sin perder la confianza de tus lectores.',
    category: 'Negocios',
    author: 'Roberto Silva',
    authorAvatar: 'RS',
    coverImage: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
    readTime: '9 min',
    date: '3 días atrás',
  },
];

export default function BlogFeed() {
  return (
    <section className="py-16 sm:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Historias Destacadas
          </h2>
          <p className="text-lg text-[var(--muted-foreground)]">
            Explora las mejores historias de nuestra comunidad
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogPosts.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card hover className="overflow-hidden h-full flex flex-col">
                <div 
                  className="h-40 w-full"
                  style={{ background: post.coverImage }}
                />
                <div className="p-5 flex-1 flex flex-col">
                  <span className="inline-block px-3 py-1 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] text-xs font-medium mb-3 self-start">
                    {post.category}
                  </span>
                  <h3 className="text-lg font-semibold mb-2 line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="text-sm text-[var(--muted-foreground)] mb-4 line-clamp-2 flex-1">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center">
                        <span className="text-white text-xs font-medium">{post.authorAvatar}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">{post.author}</p>
                        <p className="text-xs text-[var(--muted-foreground)]">{post.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-[var(--muted-foreground)]">
                      <Clock size={14} />
                      <span className="text-xs">{post.readTime}</span>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <Button variant="outline" size="lg">
            Cargar Más Historias
          </Button>
        </motion.div>
      </div>
    </section>
  );
}