import { useState, useEffect } from 'react';

/**
 * Checks if external libraries are loaded on the window object.
 * @param libraries An array of library names to check for on the window object.
 * @returns An object with a boolean `libsReady` indicating if all libraries are loaded.
 */
export const useDynamicLibraries = (libraries: string[]) => {
  const [libsReady, setLibsReady] = useState(false);

  useEffect(() => {
    if (libsReady) return;

    const checkLibs = () => {
      const allLoaded = libraries.every(lib => (window as any)[lib]);
      if (allLoaded) {
        setLibsReady(true);
      }
    };

    const interval = setInterval(() => {
      checkLibs();
      if ((window as any)[libraries[0]]) { // Optimization: if first is loaded, others might be too
        clearInterval(interval);
        const allLoaded = libraries.every(lib => (window as any)[lib]);
        if (allLoaded) setLibsReady(true);
      }
    }, 100);

    // Initial check
    checkLibs();

    return () => clearInterval(interval);
  }, [libraries, libsReady]);

  return { libsReady };
};
