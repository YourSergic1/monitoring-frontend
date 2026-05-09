import { useNavigate, useLocation } from 'react-router-dom'
import { LayoutDashboard, Building2, Gauge } from 'lucide-react' // Убрали Sun, Moon
import ThemeToggle from './ThemeToggle' // useTheme тоже не нужен здесь

export default function Header() {
    const navigate = useNavigate()
    const location = useLocation()

    return (
        <header className="header">
            <div className="container flex items-center justify-between">
                <div
                    className="logo"
                    onClick={() => navigate('/')}
                    style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
                >
                    <LayoutDashboard className="logo-icon" size={24} />
                    <span className="logo-text">Сервер мониторинга</span>
                </div>

                <div className="header-right flex items-center gap-4">
                    <nav className="nav flex items-center gap-2">
                        <button
                            className={`nav-btn ${location.pathname === '/' ? 'active' : ''}`}
                            onClick={() => navigate('/')}
                        >
                            <LayoutDashboard size={16} />
                            <span>Главная</span>
                        </button>
                        <button
                            className={`nav-btn ${location.pathname === '/organizations' ? 'active' : ''}`}
                            onClick={() => navigate('/organizations')}
                        >
                            <Building2 size={16} />
                            <span>Организации</span>
                        </button>
                        <button className="nav-btn disabled" disabled title="Скоро">
                            <Gauge size={16} />
                            <span>Метрики</span>
                        </button>
                    </nav>

                    <ThemeToggle />
                </div>
            </div>
        </header>
    )
}