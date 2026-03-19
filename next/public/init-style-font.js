try {
  var styleMode = localStorage.getItem("sse-style-mode");
  if (styleMode === "neo" || styleMode === "clean") {
    document.documentElement.setAttribute("data-style", styleMode);
  }

  var fontMode = localStorage.getItem("sse-font-mode");
  if (fontMode === "rethink" || fontMode === "pt-serif") {
    document.documentElement.setAttribute("data-font", fontMode);
  }
} catch (e) {}
