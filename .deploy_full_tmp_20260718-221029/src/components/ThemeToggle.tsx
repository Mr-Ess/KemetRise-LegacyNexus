import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

const KEY = "kemet-theme";

export const ThemeToggle = () => {
  const [theme, setTheme] = useState<"dark" | "light">(() =>
    (typeof window !== "undefined" && (localStorage.getItem(KEY) as any)) || "dark"
  );

  useEffect(() => {
    document.documentElement.classList.toggle("light", theme === "light");
    localStorage.setItem(KEY, theme);
  }, [theme]);

  return (
    <button
      onClick={() => setTheme(t => (t === "dark" ? "light" : "dark"))}
      title={theme === "dark" ? "Switch to light" : "Switch to dark"}
      className="p-1.5 rounded-md hover:bg-secondary transition-colors"
    >
      {theme === "dark" ? <Sun className="w-3.5 h-3.5 text-muted-foreground" /> : <Moon className="w-3.5 h-3.5 text-muted-foreground" />}
    </button>
  );
};

export default ThemeToggle;
