import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Building2, Loader2, AlertCircle, Search } from 'lucide-react'
import { fetchOrganizations, type OrganizationSummary } from '../api/organizations'

export default function OrganizationsListPage() {
    const navigate = useNavigate()
    const [organizations, setOrganizations] = useState<OrganizationSummary[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => {
        let mounted = true

        const loadOrganizations = async () => {
            try {
                setLoading(true)
                const data = await fetchOrganizations()
                if (mounted) {
                    setOrganizations(data)
                    setError(null)
                }
            } catch (err) {
                if (mounted) {
                    console.error('❌ Ошибка загрузки организаций:', err)
                    setError(err instanceof Error ? err.message : 'Не удалось загрузить список')
                }
            } finally {
                if (mounted) setLoading(false)
            }
        }

        loadOrganizations()
        return () => { mounted = false }
    }, [])

    const filtered = organizations.filter(org =>
        org.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="page">
            <div className="container">
                <button type="button" className="back-btn" onClick={() => navigate('/organizations')}>
                    <ArrowLeft size={16} />
                    <span>Назад</span>
                </button>

                <div className="page-header animate-fade-in">
                    <div className="header-title-block">
                        <h1 className="page-title">Список организаций</h1>
                        <p className="page-subtitle">
                            Все зарегистрированные организации в системе
                        </p>
                    </div>
                </div>

                {/* Поиск */}
                <div className="search-bar animate-fade-in-delay">
                    <Search size={18} className="search-icon" />
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Поиск по названию..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <button className="search-clear" onClick={() => setSearchQuery('')}>✕</button>
                    )}
                </div>

                {/* Состояния */}
                {loading && (
                    <div className="list-loading">
                        <Loader2 size={24} className="spinner" />
                        <span>Загрузка организаций...</span>
                    </div>
                )}

                {error && !loading && (
                    <div className="list-error">
                        <AlertCircle size={20} />
                        <span>{error}</span>
                        <button className="btn btn-secondary" onClick={() => window.location.reload()}>
                            Повторить
                        </button>
                    </div>
                )}

                {!loading && !error && filtered.length === 0 && (
                    <div className="empty-state">
                        <Building2 size={40} className="empty-icon" />
                        <p className="text-muted">
                            {searchQuery ? 'Ничего не найдено по запросу' : 'Пока нет зарегистрированных организаций'}
                        </p>
                        {!searchQuery && (
                            <button className="btn btn-primary" onClick={() => navigate('/organizations/new')}>
                                Создать первую
                            </button>
                        )}
                    </div>
                )}

                {/* Список */}
                {!loading && !error && filtered.length > 0 && (
                    <div className="organizations-list animate-fade-in-delay-2">
                        {filtered.map((org, index) => (
                            <div
                                key={org.id}
                                className="organization-item"
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                <div className="org-icon">
                                    <Building2 size={20} />
                                </div>
                                <div className="org-info">
                                    <span className="org-name">{org.name}</span>
                                    <span className="org-id">ID: {org.id}</span>
                                </div>
                                <div className="org-actions">
                                    <button
                                        className="btn-icon"
                                        title="Просмотреть детали"
                                        onClick={() => navigate(`/organizations/details/${org.id}`)}
                                    >
                                        👁
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Счётчик */}
                {!loading && !error && organizations.length > 0 && (
                    <div className="list-footer">
            <span className="text-muted">
              Показано {filtered.length} из {organizations.length} организаций
            </span>
                    </div>
                )}
            </div>
        </div>
    )
}