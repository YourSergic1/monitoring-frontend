import { Sun, Moon } from 'lucide-react'
import { useTheme } from '../context/ThemeContext.tsx'

export default function ThemeToggle() {
    const { theme, toggleTheme } = useTheme()

    return (
        <button
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={`Переключить на ${theme === 'dark' ? 'светлую' : 'тёмную'} тему`}
            title="Переключить тему"
        >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
    )
}