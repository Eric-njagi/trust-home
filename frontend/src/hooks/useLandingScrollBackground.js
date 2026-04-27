import { useEffect, useState } from 'react';

/**
 * Sets `activeSectionId` to the [data-landing-bg] section whose box contains the focal line
 * (~upper-mid viewport), so a fixed background tracks scroll without relying on hit-testing.
 */
export function useLandingScrollBackground(defaultId) {
  const [activeSectionId, setActiveSectionId] = useState(defaultId);

  useEffect(() => {
    let raf = 0;

    const update = () => {
      const y = window.innerHeight * 0.38;
      const sections = document.querySelectorAll('[data-landing-bg]');
      for (const el of sections) {
        const r = el.getBoundingClientRect();
        if (y >= r.top && y <= r.bottom) {
          const id = el.getAttribute('data-landing-bg');
          if (id) {
            setActiveSectionId(id);
            return;
          }
        }
      }
    };

    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return activeSectionId;
}
