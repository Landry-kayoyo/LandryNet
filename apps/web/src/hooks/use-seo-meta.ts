import { useEffect } from 'react';
import { defaultCover, seoKeywords, siteUrl } from '@/lib/data';

type SeoConfig = {
  title: string;
  description: string;
  path?: string;
  image?: string;
  noindex?: boolean;
  structuredData?: Record<string, unknown> | Record<string, unknown>[];
};

function setMetaTag(
  selector: string,
  attributes: Record<string, string>,
  content: string
) {
  const tag =
    (document.head.querySelector(selector) as HTMLMetaElement | null) ??
    document.createElement('meta');
  Object.entries(attributes).forEach(([key, value]) => tag.setAttribute(key, value));
  tag.setAttribute('content', content);
  if (!tag.parentElement) document.head.appendChild(tag);
}

function resolveAbsoluteImageUrl(image: string) {
  return new URL(image, siteUrl).toString();
}

export function useSeoMeta({
  title,
  description,
  path = '/',
  image = defaultCover,
  noindex = false,
  structuredData,
}: SeoConfig) {
  useEffect(() => {
    const canonicalPath = path.startsWith('/') ? path : `/${path}`;
    const canonicalUrl = `${siteUrl}${canonicalPath}`;
    const fullTitle = `${title} | Landry Net`;
    const resolvedImage = resolveAbsoluteImageUrl(image);

    document.title = fullTitle;
    setMetaTag('meta[name="keywords"]', { name: 'keywords' }, seoKeywords);
    setMetaTag('meta[name="description"]', { name: 'description' }, description);
    setMetaTag('meta[property="og:title"]', { property: 'og:title' }, fullTitle);
    setMetaTag('meta[property="og:description"]', { property: 'og:description' }, description);
    setMetaTag('meta[property="og:type"]', { property: 'og:type' }, 'website');
    setMetaTag('meta[property="og:url"]', { property: 'og:url' }, canonicalUrl);
    setMetaTag('meta[property="og:image"]', { property: 'og:image' }, resolvedImage);
    setMetaTag('meta[property="og:image:alt"]', { property: 'og:image:alt' }, fullTitle);
    setMetaTag('meta[property="og:site_name"]', { property: 'og:site_name' }, 'Landry Net');
    setMetaTag('meta[name="twitter:card"]', { name: 'twitter:card' }, 'summary_large_image');
    setMetaTag('meta[name="twitter:title"]', { name: 'twitter:title' }, fullTitle);
    setMetaTag('meta[name="twitter:description"]', { name: 'twitter:description' }, description);
    setMetaTag('meta[name="twitter:image"]', { name: 'twitter:image' }, resolvedImage);
    setMetaTag('meta[name="twitter:image:alt"]', { name: 'twitter:image:alt' }, fullTitle);
    setMetaTag(
      'meta[name="robots"]',
      { name: 'robots' },
      noindex
        ? 'noindex, nofollow'
        : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
    );

    const canonicalLink =
      (document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null) ??
      document.createElement('link');
    canonicalLink.setAttribute('rel', 'canonical');
    canonicalLink.setAttribute('href', canonicalUrl);
    if (!canonicalLink.parentElement) document.head.appendChild(canonicalLink);

    document.head.querySelector('script[data-seo-schema="landrynet"]')?.remove();
    if (structuredData) {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-seo-schema', 'landrynet');
      script.textContent = JSON.stringify(structuredData);
      document.head.appendChild(script);
    }
  }, [description, image, noindex, path, structuredData, title]);
}
