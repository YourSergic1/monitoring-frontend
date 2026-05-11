import { useNavigate, useLocation } from 'react-router-dom'
import { LayoutDashboard, Building2, Gauge, Calendar, Users } from 'lucide-react'
import ThemeToggle from './ThemeToggle'

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
                    <span className="logo-text">Сервис мониторинга</span>
                </div>

                <div className="header-right flex items-center gap-4">
                    {/* ✅ 2. Добавили flex-wrap, чтобы кнопки переносились на новую строку, если не помещаются */}
                    <nav className="nav flex items-center gap-2 flex-wrap">
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
                        <button
                            className={`nav-btn ${location.pathname === '/metrics' ? 'active' : ''}`}
                            onClick={() => navigate('/organizations/metrics')}
                        >
                            <Gauge size={16} />
                            <span>Метрики</span>
                        </button>
                        {/* ✅ 3. Новая кнопка Календарь */}
                        <button
                            className={`nav-btn ${location.pathname === '/calendar' ? 'active' : ''}`}
                            onClick={() => navigate('/calendar')}
                        >
                            <Calendar size={16} />
                            <span>Календарь</span>
                        </button>
                        <button
                            className={`nav-btn ${location.pathname.startsWith('/users') ? 'active' : ''}`}
                            onClick={() => navigate('/users')}
                        >
                            <Users size={16} />
                            <span>Пользователи</span>
                        </button>
                    </nav>

                    <ThemeToggle />
                </div>
            </div>
        </header>
    )
}