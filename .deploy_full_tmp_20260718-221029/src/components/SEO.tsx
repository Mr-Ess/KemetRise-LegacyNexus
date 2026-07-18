import { useEffect } from "react";

type SEOProps = {
  title: string;
  description?: string;
  image?: string;
  canonical?: string;
  type?: "website" | "article";
  jsonLd?: Record<string, any>;
};

const setMeta = (name: string, content: string, attr: "name" | "property" = "name") => {
  let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
  if (!el) { el = document.createElement("meta"); el.setAttribute(attr, name); document.head.appendChild(el); }
  el.content = content;
};

export default function SEO({ title, description, image, canonical, type = "website", jsonLd }: SEOProps) {
  useEffect(() => {
    document.title = title.length > 60 ? title.slice(0, 57) + "..." : title;
    const desc = (description || "").slice(0, 160);
    if (desc) setMeta("description", desc);

    setMeta("og:title", title, "property");
    if (desc) setMeta("og:description", desc, "property");
    setMeta("og:type", type, "property");
    if (image) setMeta("og:image", image, "property");

    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", title);
    if (desc) setMeta("twitter:description", desc);
    if (image) setMeta("twitter:image", image);

    if (canonical) {
      let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
      if (!link) { link = document.createElement("link"); link.rel = "canonical"; document.head.appendChild(link); }
      link.href = canonical;
    }

    let scriptEl = document.getElementById("seo-jsonld") as HTMLScriptElement | null;
    if (jsonLd) {
      if (!scriptEl) { scriptEl = document.createElement("script"); scriptEl.id = "seo-jsonld"; scriptEl.type = "application/ld+json"; document.head.appendChild(scriptEl); }
      scriptEl.textContent = JSON.stringify(jsonLd);
    } else if (scriptEl) {
      scriptEl.remove();
    }
  }, [title, description, image, canonical, type, jsonLd]);

  return null;
}
