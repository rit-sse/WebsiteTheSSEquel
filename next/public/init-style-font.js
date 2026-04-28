try {
  // Resolve theme before hydration to avoid FOUC.
  // Preference order: explicit user choice ("dark"/"light") → "system" (or
  // missing) uses prefers-color-scheme → "light" fallback.
  var storedTheme = localStorage.getItem("theme");
  var resolvedTheme;
  if (storedTheme === "dark" || storedTheme === "light") {
    resolvedTheme = storedTheme;
  } else {
    var prefersDark =
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    resolvedTheme = prefersDark ? "dark" : "light";
  }
  document.documentElement.setAttribute("data-theme", resolvedTheme);

  var styleMode = localStorage.getItem("sse-style-mode");
  if (styleMode === "neo" || styleMode === "clean") {
    document.documentElement.setAttribute("data-style", styleMode);
  }

  var fontMode = localStorage.getItem("sse-font-mode");
  if (fontMode === "rethink" || fontMode === "pt-serif") {
    document.documentElement.setAttribute("data-font", fontMode);
  }
} catch (e) {}
