import { createContext, useContext, useEffect, useState } from "react";
import { translations } from "./i18n";

const AppSettingsContext = createContext(null);
export const useSettings = () => useContext(AppSettingsContext);

export function AppSettingsProvider({ children }) {
  const [lang, setLang] = useState(localStorage.getItem("lang") || "ar");
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

  useEffect(() => {
    localStorage.setItem("lang", lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = translations[lang].dir;
  }, [lang]);

  useEffect(() => {
    localStorage.setItem("theme", theme);
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const t = (key) => translations[lang][key] || key;
  const toggleLang = () => setLang((l) => (l === "ar" ? "en" : "ar"));
  const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));

  return (
    <AppSettingsContext.Provider value={{ lang, theme, t, toggleLang, toggleTheme }}>
      {children}
    </AppSettingsContext.Provider>
  );
}
