import { useNavigate } from 'react-router-dom'
import { LayoutDashboard, Building2, Gauge, Calendar, Users } from 'lucide-react'
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
                    <div className="header-title-block">
                        <h1 className="page-title">Панель управления</h1>
                        <p className="page-subtitle">
                            Оперативная сводка по инфраструктуре и подключенным агентам
                        </p>
                    </div>
                    <div className="header-date-block">
                        <Calendar size={15} />
                        <span>{today}</span>
                    </div>
                </div>

                <div className="cards-grid">
                    <ActionCard
                        title="Организации"
                        description="Управление организациями и агентами мониторинга"
                        icon={Building2}
                        onClick={() => {
                            navigate('/organizations')
                        }}
                        delay={100}
                    />
                    <ActionCard
                        title="Метрики"
                        description="Просмотр и анализ системных метрик в реальном времени"
                        icon={Gauge}
                        onClick={() => navigate('/organizations/metrics')}
                        delay={200}
                        variant="secondary"
                    />
                    <ActionCard
                        title="Календарь дежурств"
                        description="Просмотр и управление графиками дежурств"
                        icon={Calendar}
                        onClick={() => navigate('/calendar')}
                        delay={300}
                    />
                    <ActionCard
                        title="Пользователи"
                        description="Управление учетными записями"
                        icon={Users}
                        onClick={() => navigate('/users')}
                        delay={400}
                    />
                </div>
            </div>
        </div>
    )
}