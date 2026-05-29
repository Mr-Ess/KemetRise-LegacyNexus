import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Calendar, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { tenantDb } from "@/lib/tenantDb";
import SEO from "@/components/SEO";

export default function Blog() {
  const nav = useNavigate();
  const { slug } = useParams();
  const [posts, setPosts] = useState<any[]>([]);
  const [post, setPost] = useState<any>(null);

  useEffect(() => {
    if (slug) {
      tenantDb.select("blog_posts", { eq: { slug }, limit: 1 }).then((rows) => setPost(rows?.[0] || null));
    } else {
      tenantDb.select("blog_posts", { eq: { published: true }, orderBy: "published_at", ascending: false }).then((data) => setPosts((data as any) || []));
    }
  }, [slug]);

  if (slug) {
    return (
      <div className="min-h-screen bg-background p-6">
        {post && <SEO title={`${post.title} — KemetRise Blog`} description={post.excerpt} image={post.cover_url} canonical={`https://kemetrise.com/blog/${post.slug}`} type="article" jsonLd={{ "@context": "https://schema.org", "@type": "Article", headline: post.title, author: post.author, datePublished: post.published_at }} />}
        <div className="max-w-3xl mx-auto">
          <Button variant="ghost" onClick={() => nav("/blog")} className="mb-6"><ArrowLeft className="w-4 h-4 mr-2" />All Posts</Button>
          {post && (
            <article>
              <h1 className="font-display text-4xl text-primary mb-4">{post.title}</h1>
              <div className="flex items-center gap-4 text-xs text-muted-foreground mb-8">
                <span className="flex items-center gap-1"><User className="w-3 h-3" />{post.author}</span>
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(post.published_at).toLocaleDateString()}</span>
              </div>
              <div className="prose prose-invert max-w-none whitespace-pre-wrap text-foreground">{post.content}</div>
            </article>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <SEO title="KemetRise Blog — Empire Building Insights" description="Articles, automation tips, and CRM best practices for global brand operators." canonical="https://kemetrise.com/blog" />
      <div className="max-w-5xl mx-auto">
        <Button variant="ghost" onClick={() => nav("/")} className="mb-6"><ArrowLeft className="w-4 h-4 mr-2" />Home</Button>
        <h1 className="font-display text-4xl text-primary mb-2">Blog</h1>
        <p className="text-muted-foreground mb-8">Insights from the empire builders.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {posts.map(p => (
            <Card key={p.id} className="p-6 cursor-pointer hover:border-primary transition-colors" onClick={() => nav(`/blog/${p.slug}`)}>
              <h2 className="font-display text-xl text-primary mb-2">{p.title}</h2>
              <p className="text-sm text-muted-foreground mb-4">{p.excerpt}</p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>{p.author}</span>
                <span>·</span>
                <span>{new Date(p.published_at).toLocaleDateString()}</span>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
