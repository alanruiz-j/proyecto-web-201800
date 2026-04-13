import Hero from '../components/Hero';
import Features from '../components/Features';
import TrendingTopics from '../components/TrendingTopics';
import BlogFeed from '../components/BlogFeed';
import CTA from '../components/CTA';
import Footer from '../components/Footer';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Hero />
      <TrendingTopics />
      <BlogFeed />
      <Features />
      <CTA />
      <Footer />
    </div>
  );
}