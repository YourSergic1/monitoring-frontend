import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, User, Search, Loader2, AlertCircle, Eye } from 'lucide-react'
import { fetchUsers, type UserSummaryResponse } from '../api/users'

export default function UsersListPage() {
    const navigate = useNavigate()
    const [data, setData] = useState<UserSummaryResponse[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [search, setSearch] = useState('')

    useEffect(() => {
        fetchUsers()
            .then(setData)
            .catch(err => setError(err.message))
            .finally(() => setLoading(false))
    }, [])

    const filteredUsers = useMemo(() => {
        const q = search.toLowerCase()
        return data.filter(u => {
            const fullName = `${u.surname} ${u.name} ${u.patronymic}`.toLowerCase()
            return fullName.includes(q)
        })
    }, [data, search])

    if (loading) {
        return (
            <div className="page">
                <div className="container">
                    <div className="list-loading">
                        <Loader2 size={24} className="spinner" />
                        <span>Загрузка пользователей...</span>
                    </div>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="page">
                <div className="container">
                    <button type="button" className="back-btn" onClick={() => navigate(-1)}>
                        <ArrowLeft size={16} /> <span>Назад</span>
                    </button>
                    <div className="list-error">
                        <AlertCircle size={20} />
                        <span>{error}</span>
                        <button className="btn btn-secondary" onClick={() => window.location.reload()}>Повторить</button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="page">
            <div className="container">
                <button type="button" className="back-btn" onClick={() => navigate('/users')}>
                    <ArrowLeft size={16} /> <span>К управлению</span>
                </button>

                <div className="page-header animate-fade-in">
                    <div className="header-title-block">
                        <h1 className="page-title">Пользователи системы</h1>
                        <p className="page-subtitle">Список сотрудников с доступом к сервису</p>
                    </div>
                </div>

                <div className="controls-bar animate-fade-in-delay">
                    <div className="search-bar">
                        <Search size={18} className="search-icon" />
                        <input className="search-input" placeholder="Поиск по ФИО..." value={search} onChange={e => setSearch(e.target.value)} />
                        {search && <button className="search-clear" onClick={() => setSearch('')}>✕</button>}
                    </div>
                </div>

                {filteredUsers.length === 0 ? (
                    <div className="empty-state">
                        <User size={40} className="empty-icon" />
                        <p className="text-muted">{search ? 'Пользователи не найдены' : 'Нет зарегистрированных пользователей'}</p>
                    </div>
                ) : (
                    <div className="metrics-list animate-fade-in-delay-2">
                        {filteredUsers.map(user => (
                            <div key={user.id} className="metrics-item">
                                <div className="metrics-icon">
                                    <User size={20} />
                                </div>
                                <div className="metrics-info">
                  <span className="metrics-name">
                    {user.surname} {user.name} {user.patronymic}
                  </span>
                                    {/* ✅ UUID отображается полностью */}
                                    <span className="metrics-id" title={user.id}>{user.id}</span>
                                </div>
                                {/* ✅ Кнопка-глазик для перехода к карточке */}
                                <button
                                    className="btn-icon"
                                    onClick={(e) => {
                                        e.stopPropagation() // На всякий случай предотвращаем всплытие
                                        navigate(`/users/${user.id}`)
                                    }}
                                    title="Просмотреть карточку"
                                >
                                    <Eye size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <div className="list-footer">
                    <span className="text-muted">Всего: {filteredUsers.length} из {data.length}</span>
                </div>
            </div>
        </div>
    )
}