import { useNavigate } from 'react-router-dom'
import { Building2, Gauge, Server, Activity, Clock, Calendar, Signal } from 'lucide-react'
import ActionCard from '../components/ActionCard'

export default function HomePage() {
    const navigate = useNavigate()

    const today = new Date().toLocaleDateString('ru-RU', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    })

    return (
        <div className="page">
            <div className="container">
                <div className="page-header animate-fade-in">
                    <div className="header-status">
                        <Signal size={16} className="status-dot" />
                        <span>Система активна</span>
                    </div>
                    <h1 className="page-title">Панель управления</h1>
                    <p className="page-subtitle">
                        Оперативная сводка по инфраструктуре и подключенным агентам
                    </p>
                    <div className="dashboard-date">
                        <Calendar size={14} />
                        <span>{today}</span>
                    </div>
                </div>

                <div className="cards-grid">
                    <ActionCard
                        title="Организации"
                        description="Управление организациями и агентами мониторинга"
                        icon={Building2}
                        onClick={() => navigate('/organizations')}
                        delay={100}
                    />
                    <ActionCard
                        title="Метрики"
                        description="Просмотр и анализ системных метрик в реальном времени"
                        icon={Gauge}
                        onClick={() => alert('Раздел в разработке')}
                        delay={200}
                        variant="secondary"
                    />
                </div>

                <div className="stats-bar animate-fade-in-delay-2">
                    <div className="stat-item">
                        <Server size={18} className="stat-icon" />
                        <span className="stat-value">0</span>
                        <span className="stat-label">Организаций</span>
                    </div>
                    <div className="stat-item">
                        <Activity size={18} className="stat-icon" />
                        <span className="stat-value">0</span>
                        <span className="stat-label">Агентов</span>
                    </div>
                    <div className="stat-item">
                        <Clock size={18} className="stat-icon" />
                        <span className="stat-value">—</span>
                        <span className="stat-label">Последняя синхронизация</span>
                    </div>
                </div>
            </div>
        </div>
    )
}