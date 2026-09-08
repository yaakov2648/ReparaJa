export const THEME_STORAGE_KEY = "reparaja-theme";

// Corre antes da hidratação (ver layout.tsx) para aplicar o tema guardado
// sem "flash" da cor errada. Mantém-se em sync com ThemeToggle.tsx.
export const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem("${THEME_STORAGE_KEY}");
    var dark = stored ? stored === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.classList.toggle("dark", dark);
  } catch (e) {}
})();
`;
