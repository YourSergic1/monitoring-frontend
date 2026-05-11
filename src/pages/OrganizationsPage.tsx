import { useNavigate } from 'react-router-dom'
import { Plus, List, ArrowLeft } from 'lucide-react'
import ActionCard from '../components/ActionCard'

export default function OrganizationsPage() {
    const navigate = useNavigate()

    return (
        <div className="page">
            <div className="container">
                <button className="back-btn" onClick={() => navigate('/')}>
                    <ArrowLeft size={16} />
                    <span>На главную</span>
                </button>

                <div className="page-header animate-fade-in">
                    <div className="header-title-block">
                        <h1 className="page-title">Организации</h1>
                    </div>
                </div>

                <div className="cards-grid cards-grid-small">
                    <ActionCard
                        title="Создать организацию"
                        description="Зарегистрировать новую организацию в системе"
                        icon={Plus}
                        onClick={() => navigate('/organizations/new')}
                        delay={100}
                    />
                    <ActionCard
                        title="Список организаций"
                        description="Просмотр данных и подключённых агентов"
                        icon={List}
                        onClick={() => navigate('/organizations/list')}
                        delay={200}
                        variant="secondary"
                    />
                </div>
            </div>
        </div>
    )
}