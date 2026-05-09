import { useNavigate } from 'react-router-dom'
import { Plus, List, ArrowLeft, Building2 } from 'lucide-react'
import ActionCard from '../components/ActionCard'

export default function OrganizationsPage() {
    const navigate = useNavigate()

    return (
        <div className="page">
            <div className="container">
                <button className="back-btn" onClick={() => navigate('/')}>
                    <ArrowLeft size={16} />
                    <span>Назад</span>
                </button>

                <div className="page-header animate-fade-in">
                    <h1 className="page-title">Организации</h1>
                    <p className="page-subtitle">
                        Создавайте и управляйте организациями для группировки агентов мониторинга
                    </p>
                </div>

                <div className="cards-grid cards-grid-small">
                    <ActionCard
                        title="Создать организацию"
                        description="Добавить новую организацию в систему"
                        icon={Plus}
                        onClick={() => alert('Форма создания организации')}
                        delay={100}
                    />
                    <ActionCard
                        title="Просмотреть организации"
                        description="Список всех доступных организаций"
                        icon={List}
                        onClick={() => alert('Список организаций')}
                        delay={200}
                        variant="secondary"
                    />
                </div>

                <div className="empty-state animate-fade-in-delay-2">
                    <Building2 size={32} className="empty-icon" />
                    <p className="text-muted">
                        Пока нет организаций. Создайте первую, чтобы начать работу.
                    </p>
                </div>
            </div>
        </div>
    )
}