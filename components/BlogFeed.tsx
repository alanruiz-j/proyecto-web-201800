'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Heart, Clock } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import Card from './Card';
import { tagColor } from '../lib/tags';

interface BlogPost {
  id: string;
  title: string;
  body: string;
  tags: string[];
  authorName: string;
  favoriteCount: number;
  createdAt: { seconds: number } | null;
}

const TAG_GRADIENTS: Record<string, string> = {
  'Tecnología': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'Estilo de Vida': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'Música': 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
  'Fotografía': 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'Viajes': 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'Gastronomía': 'linear-gradient(135deg, #f7971e 0%, #ffd200 100%)',
  'Literatura': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'Videojuegos': 'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)',
};

const getGradient = (tags: string[]) =>
  TAG_GRADIENTS[tags[0]] ?? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';

export default function BlogFeed() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDocs(collection(db, 'blogs'))
      .then((snap) => {
        const all = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            title: data.title ?? '',
            body: data.body ?? '',
            tags: data.tags ?? [],
            authorName: data.authorName ?? '',
            favoriteCount: data.favoriteCount ?? 0,
            createdAt: data.createdAt ?? null,
          } as BlogPost;
        });
        all.sort((a, b) => b.favoriteCount - a.favoriteCount);
        setPosts(all.slice(0, 6));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

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

        {loading && (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && posts.length === 0 && (
          <p className="text-center text-[var(--muted-foreground)] py-16">
            Aún no hay historias publicadas.{' '}
            <Link href="/publicar" className="text-[var(--primary)] underline">¡Sé el primero!</Link>
          </p>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Link href={`/feed/${post.id}`} className="block h-full">
                <Card hover className="overflow-hidden h-full flex flex-col">
                  <div
                    className="h-40 w-full"
                    style={{ background: getGradient(post.tags) }}
                  />
                  <div className="p-5 flex-1 flex flex-col">
                    {post.tags.length > 0 && (
                      <span className={`inline-flex items-center text-xs px-3 py-1 rounded-full font-medium mb-3 self-start ${tagColor(post.tags[0])}`}>
                        {post.tags[0]}
                      </span>
                    )}
                    <h3 className="text-lg font-semibold mb-2 line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="text-sm text-[var(--muted-foreground)] mb-4 line-clamp-2 flex-1">
                      {post.body.slice(0, 160)}{post.body.length > 160 ? '…' : ''}
                    </p>
                    <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center">
                          <span className="text-white text-xs font-medium">
                            {post.authorName.slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm font-medium">{post.authorName}</p>
                      </div>
                      <div className="flex items-center gap-1 text-[var(--muted-foreground)]">
                        <Heart size={14} />
                        <span className="text-xs">{post.favoriteCount}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>

        {!loading && posts.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-12 text-center"
          >
            <Link
              href="/feed"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full border-2 border-[var(--border)] text-[var(--foreground)] font-medium hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors"
            >
              Ver todos los blogs
            </Link>
          </motion.div>
        )}
      </div>
    </section>
  );
}
