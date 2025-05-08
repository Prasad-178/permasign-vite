import { useEffect, useState } from 'react';
import { Moon, Sun, Laptop } from 'lucide-react';
import { Button } from './ui/button'; // Assuming Button component from shadcn/ui

type Theme = 'light' | 'dark' | 'system';

export function ThemeToggle() {
  // Initialize theme state from localStorage or default to 'system'
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const storedTheme = localStorage.getItem('theme') as Theme | null;
      if (storedTheme && ['light', 'dark', 'system'].includes(storedTheme)) {
        return storedTheme;
      }
    }
    return 'system';
  });

  // Effect to apply theme and listen to system changes
  useEffect(() => {
    const root = window.document.documentElement;
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = (newTheme: Theme) => {
      root.classList.remove('light', 'dark'); // Clean up previous theme classes

      let effectiveTheme = newTheme;
      if (newTheme === 'system') {
        effectiveTheme = systemPrefersDark.matches ? 'dark' : 'light';
      }
      
      console.log('Applying theme to HTML tag:', effectiveTheme); // CHLDRN: Add for debugging
      root.classList.add(effectiveTheme); // Add 'light' or 'dark'
      localStorage.setItem('theme', newTheme); // Store the user's explicit choice (light/dark/system)
    };

    applyTheme(theme);

    // Listener for system theme changes
    const handleSystemThemeChange = (_: MediaQueryListEvent) => {
      if (theme === 'system') {
        applyTheme('system'); // Re-apply system theme to reflect change
      }
    };

    systemPrefersDark.addEventListener('change', handleSystemThemeChange);
    
    // Cleanup listener on component unmount
    return () => {
      systemPrefersDark.removeEventListener('change', handleSystemThemeChange);
    };
  }, [theme]); // Rerun effect when theme state changes

  // Function to cycle through themes
  const cycleTheme = () => {
    setTheme((prevTheme) => {
      if (prevTheme === 'light') return 'dark';
      if (prevTheme === 'dark') return 'system';
      return 'light'; // From system, cycle back to light
    });
  };

  // Function to render the correct icon based on the current theme
  const renderIcon = () => {
    if (theme === 'light') return <Sun className="h-[1.2rem] w-[1.2rem] transition-all" />;
    if (theme === 'dark') return <Moon className="h-[1.2rem] w-[1.2rem] transition-all" />;
    return <Laptop className="h-[1.2rem] w-[1.2rem] transition-all" />; // System theme icon
  };

  return (
    <Button variant="ghost" size="icon" onClick={cycleTheme} aria-label="Toggle theme">
      {renderIcon()}
    </Button>
  );
}
