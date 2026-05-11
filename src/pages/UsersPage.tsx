import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Users, UserPlus, Shield } from 'lucide-react'
import ActionCard from '../components/ActionCard'

export default function UsersPage() {
    const navigate = useNavigate()

    return (
        <div className="page">
            <div className="container">
                {/* Кнопка Назад */}
                <button type="button" className="back-btn" onClick={() => navigate('/')}>
                    <ArrowLeft size={16} /> <span>На главную</span>
                </button>

                {/* Заголовок */}
                <div className="page-header animate-fade-in">
                    <div className="header-title-block">
                        <h1 className="page-title">Управление пользователями</h1>
                    </div>
                </div>

                {/* Сетка с действиями */}
                <div className="cards-grid cards-grid-small">
                    <ActionCard
                        title="Создать пользователя"
                        description="Добавление нового сотрудника и генерация учетных данных"
                        icon={UserPlus}
                        onClick={() => navigate('/users/create')}
                        delay={200}
                        variant="primary"
                    />
                    <ActionCard
                        title="Список пользователей"
                        description="Просмотр, редактирование и удаление учетных записей"
                        icon={Users}
                        onClick={() => navigate('/users/list')}
                        delay={100}
                        variant="secondary"
                    />
                </div>
            </div>
        </div>
    )
}