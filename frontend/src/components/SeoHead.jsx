import { useEffect } from "react";

const SITE_ORIGIN = "https://toasted-cheese-map.emergent.host";

const toAbsoluteUrl = (path) => {
  if (!path) return undefined;
  if (/^https?:\/\//i.test(path)) return path;
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_ORIGIN}${clean}`;
};

/**
 * Lightweight SEO helper. Sets <title>, <meta description>, canonical
 * (always absolute), Open Graph + Twitter card meta, JSON-LD, and fires
 * a GA4 page_view on each client-side route change (this is a SPA).
 */
export const SeoHead = ({ title, description, canonicalPath, jsonLd, image }) => {
  useEffect(() => {
    if (title) document.title = title;

    const setMeta = (name, content, attr = "name") => {
      if (!content) return;
      let el = document.head.querySelector(`meta[${attr}="${name}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    const absoluteCanonical = toAbsoluteUrl(canonicalPath);

    setMeta("description", description);
    setMeta("og:title", title, "property");
    setMeta("og:description", description, "property");
    if (absoluteCanonical) setMeta("og:url", absoluteCanonical, "property");
    if (image) setMeta("og:image", image, "property");
    setMeta("twitter:title", title);
    setMeta("twitter:description", description);
    if (image) setMeta("twitter:image", image);

    if (absoluteCanonical) {
      let link = document.head.querySelector('link[rel="canonical"]');
      if (!link) {
        link = document.createElement("link");
        link.setAttribute("rel", "canonical");
        document.head.appendChild(link);
      }
      link.setAttribute("href", absoluteCanonical);
    }

    let ld = document.getElementById("ld-dynamic");
    if (jsonLd) {
      if (!ld) {
        ld = document.createElement("script");
        ld.type = "application/ld+json";
        ld.id = "ld-dynamic";
        document.head.appendChild(ld);
      }
      ld.textContent = JSON.stringify(jsonLd);
    } else if (ld) {
      ld.remove();
    }

    // SPA route change → fire GA4 page_view manually
    // (the gtag('config',...) call in index.html only fires once on initial load)
    try {
      if (typeof window !== "undefined" && typeof window.gtag === "function" && absoluteCanonical) {
        window.gtag("event", "page_view", {
          page_location: absoluteCanonical,
          page_title: title,
        });
      }
    } catch { /* noop */ }
  }, [title, description, canonicalPath, jsonLd, image]);

  return null;
};

export const buildRecipeJsonLd = (r) => ({
  "@context": "https://schema.org",
  "@type": "Recipe",
  name: r.title,
  description: r.tagline,
  image: r.image ? [r.image] : undefined,
  author: { "@type": "Organization", name: "Cheese on Toast" },
  recipeCategory: r.schema?.category,
  recipeCuisine: r.schema?.cuisine,
  keywords: r.keywords,
  prepTime: r.schema?.prepTime,
  cookTime: r.schema?.cookTime,
  totalTime: r.schema?.totalTime,
  recipeYield: r.schema?.yield,
  recipeIngredient: r.ingredients,
  recipeInstructions: (r.steps || []).map((s) => ({
    "@type": "HowToStep",
    name: s.title,
    text: s.body,
  })),
  tool: r.tools,
});
