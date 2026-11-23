const THEME_STORAGE_KEY = "theme";

function bindThemeButton(id, lightcolor, darkcolor, buttoncolor) {
  const button = document.getElementById(id);
  if (button) {
    button.addEventListener("click", () => changeTheme(lightcolor, darkcolor, buttoncolor));
  }
}

function changeTheme(lightcolor, darkcolor, buttoncolor) {
  localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify({ lightcolor, darkcolor, buttoncolor }));
  applyTheme(lightcolor, darkcolor, buttoncolor);
}

function applyTheme(lightcolor, darkcolor, buttoncolor) {
  const root = document.documentElement;
  root.style.setProperty("--theme-background", lightcolor);
  root.style.setProperty("--theme-text", darkcolor);
  root.style.setProperty("--theme-buttons", buttoncolor)
  root.dataset.themeActive = "true";
}

function restoreTheme() {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  if (!savedTheme) return;

  const { lightcolor, darkcolor, buttoncolor } = JSON.parse(savedTheme);
  applyTheme(lightcolor, darkcolor, buttoncolor || lightcolor);
}

bindThemeButton("red-theme-button", "#FFF1F2", "#2A060E", "#BE123C");
bindThemeButton("yellow-theme-button", "#FFFBEB", "#271102", "#B45309");
bindThemeButton("green-theme-button", "#F0FDF4", "#052E16", "#15803D");
bindThemeButton("blue-theme-button", "#F0F6FF", "#0A192F", "#1D4ED8");
bindThemeButton("pink-theme-button", "#FDF2F8", "#2E0518", "#BE185D");
bindThemeButton("white-theme-button", "#FFFFFF", "#000000", "#1D4ED8");

restoreTheme();