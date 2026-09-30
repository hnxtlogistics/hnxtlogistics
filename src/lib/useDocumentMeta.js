import { useEffect } from 'react';

function setMeta(selector, attribute, content) {
  if (!content) return null;
  let tag = document.head.querySelector(selector);
  let created = false;
  if (!tag) {
    tag = document.createElement('meta');
    const [key, value] = attribute;
    tag.setAttribute(key, value);
    document.head.appendChild(tag);
    created = true;
  }
  const previous = tag.getAttribute('content');
  tag.setAttribute('content', content);
  return () => {
    if (created) tag.remove();
    else if (previous !== null) tag.setAttribute('content', previous);
  };
}

/** Keeps <title> and the crawler/social meta tags in step with the route. */
export function useDocumentMeta({ title, description, canonicalPath }) {
  useEffect(() => {
    const previousTitle = document.title;
    if (title) document.title = title;

    const cleanups = [
      setMeta('meta[name="description"]', ['name', 'description'], description),
      setMeta('meta[property="og:title"]', ['property', 'og:title'], title),
      setMeta('meta[property="og:description"]', ['property', 'og:description'], description),
      setMeta('meta[name="twitter:title"]', ['name', 'twitter:title'], title),
      setMeta('meta[name="twitter:description"]', ['name', 'twitter:description'], description)
    ].filter(Boolean);

    let link = null;
    let createdLink = false;
    let previousHref = null;
    if (canonicalPath) {
      link = document.head.querySelector('link[rel="canonical"]');
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', 'canonical');
        document.head.appendChild(link);
        createdLink = true;
      } else {
        previousHref = link.getAttribute('href');
      }
      link.setAttribute('href', window.location.origin + canonicalPath);
    }

    return () => {
      document.title = previousTitle;
      cleanups.forEach((fn) => fn());
      if (link) {
        if (createdLink) link.remove();
        else if (previousHref) link.setAttribute('href', previousHref);
      }
    };
  }, [title, description, canonicalPath]);
}
