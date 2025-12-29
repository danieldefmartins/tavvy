import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

const blogPosts = [
  {
    id: 1,
    title: 'Best Routes for First-Time Full-Timers',
    excerpt: 'Discover the most scenic and accessible routes perfect for those just starting their full-time RV journey. We cover essential tips, recommended stops, and important planning advice...',
    image: '/demo/rv-park-scenic.jpg',
  },
  {
    id: 2,
    title: 'Top 10 Must-Have RV Gadgets for 2024',
    excerpt: 'Upgrade your RV experience with these essential gadgets that enhance comfort, safety, and convenience on the road. From solar gear to smart tech...',
    image: '/demo/forest-campground.jpg',
  },
];

export function BlogSection() {
  return (
    <section className="py-6 px-4 bg-muted/30">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground">
            From the MUVO Blog
          </h2>
          <Link to="/blog" className="text-sm font-medium text-primary hover:text-primary/80">
            View All Posts
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {blogPosts.map((post) => (
            <article key={post.id} className="bg-card rounded-xl overflow-hidden border border-border">
              <img
                src={post.image}
                alt={post.title}
                className="w-full h-32 object-cover"
              />
              <div className="p-3">
                <h3 className="font-semibold text-sm text-foreground mb-2 line-clamp-2 leading-tight">
                  {post.title}
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-3 mb-2">
                  {post.excerpt}
                </p>
                <Link 
                  to={`/blog/${post.id}`}
                  className="inline-flex items-center text-xs font-medium text-primary hover:text-primary/80"
                >
                  Read more
                  <ChevronRight className="w-3 h-3 ml-0.5" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
