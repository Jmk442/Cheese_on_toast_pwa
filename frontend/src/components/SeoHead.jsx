import { useEffect } from "react";

/**
 * Lightweight SEO helper. Sets <title>, <meta description>, canonical,
 * and injects a JSON-LD <script id="ld-dynamic"> for the current page.
 */
export const SeoHead = ({ title, description, canonicalPath, jsonLd }) => {
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

    setMeta("description", description);
    setMeta("og:title", title, "property");
    setMeta("og:description", description, "property");

    if (canonicalPath) {
      let link = document.head.querySelector('link[rel="canonical"]');
      if (!link) {
        link = document.createElement("link");
        link.setAttribute("rel", "canonical");
        document.head.appendChild(link);
      }
      link.setAttribute("href", canonicalPath);
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
  }, [title, description, canonicalPath, jsonLd]);

  return null;
};

export const buildRecipeJsonLd = (r) => ({
  "@context": "https://schema.org",
  "@type": "Recipe",
  name: r.title,
  description: r.tagline,
  image: [r.image],
  recipeCategory: r.schema?.category,
  recipeCuisine: r.schema?.cuisine,
  keywords: r.keywords,
  prepTime: r.schema?.prepTime,
  cookTime: r.schema?.cookTime,
  totalTime: r.schema?.totalTime,
  recipeYield: r.schema?.yield,
  recipeIngredient: r.ingredients,
  recipeInstructions: r.steps.map((s) => ({
    "@type": "HowToStep",
    name: s.title,
    text: s.body,
  })),
  tool: r.tools,
});
