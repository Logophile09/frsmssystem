import { useEffect } from 'react';

/**
 * Fades/slides elements marked with `data-reveal` into view as they enter
 * the viewport. Part of the Culiat Public Safety design system — call once
 * near the root of the app (see Layout.tsx) and add `data-reveal` to any
 * card, heading, or section that should animate in on scroll.
 */
export function useRevealOnScroll() {
  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
    if (!('IntersectionObserver' in window)) {
      elements.forEach((el) => el.setAttribute('data-visible', 'true'));
      return;
    }
    document.documentElement.classList.add('reveal-ready');
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => (e.target as HTMLElement).setAttribute('data-visible', e.isIntersecting ? 'true' : 'false')),
      { threshold: 0.12, rootMargin: '0px 0px -40px' },
    );
    elements.forEach((el) => observer.observe(el));
    return () => {
      observer.disconnect();
      document.documentElement.classList.remove('reveal-ready');
    };
  }, []);
}
