import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Building2, Loader2, AlertCircle, Search, ArrowUpDown } from 'lucide-react'
import { fetchMetricsOrganizations, type OrganizationMetricsSummary, type AgentState } from '../api/metrics'

// Приоритет сортировки (по убыванию критичности)
const STATE_PRIORITY: Record<AgentState, number> = {
    CRITICAL: 1,
    WARNING: 2,
    OFFLINE: 3,
    OK: 4
}

const STATE_LABELS: Record<AgentState, string> = {
    OK: 'В норме',
    WARNING: 'Внимание',
    CRITICAL: 'Критично',
    OFFLINE: 'Оффлайн'
}

export default function MetricsPage() {
    const navigate = useNavigate()
    const [data, setData] = useState<OrganizationMetricsSummary[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [search, setSearch] = useState('')
    const [sortCriticalFirst, setSortCriticalFirst] = useState(true)

    useEffect(() => {
        fetchMetricsOrganizations()
            .then(setData)
            .catch(err => setError(err.message))
            .finally(() => setLoading(false))
    }, [])

    const filteredAndSorted = useMemo(() => {
        let items = data.filter(org => org.name.toLowerCase().includes(search.toLowerCase()))

        items.sort((a, b) => {
            const pA = STATE_PRIORITY[a.state]
            const pB = STATE_PRIORITY[b.state]
            return sortCriticalFirst ? pA - pB : pB - pA
        })

        return items
    }, [data, search, sortCriticalFirst])

    const getStateColor = (state: AgentState): string => {
        switch(state) {
            case 'OK': return 'var(--color-success)'
            case 'WARNING': return 'var(--color-warning)'
            case 'CRITICAL': return 'var(--color-error)'
            default: return 'var(--color-text-muted)'
        }
    }

    if (loading) {
        return <div className="page"><div className="container"><div className="list-loading"><Loader2 size={24} className="spinner"/><span>Загрузка данных...</span></div></div></div>
    }

    if (error) {
        return (
            <div className="page">
                <div className="container">
                    <button type="button" className="back-btn" onClick={() => navigate(-1)}><ArrowLeft size={16}/><span>Назад</span></button>
                    <div className="list-error"><AlertCircle size={20}/><span>{error}</span></div>
                </div>
            </div>
        )
    }

    return (
        <div className="page">
            <div className="container">
                <button type="button" className="back-btn" onClick={() => navigate('/')}>
                    <ArrowLeft size={16} /> <span>На главную</span>
                </button>

                <div className="page-header animate-fade-in">
                    <div className="header-title-block">
                        <h1 className="page-title">Мониторинг организаций</h1>
                        <p className="page-subtitle">Текущий статус подключенных агентов</p>
                    </div>
                </div>

                <div className="controls-bar animate-fade-in-delay">
                    <div className="search-bar">
                        <Search size={18} className="search-icon" />
                        <input
                            className="search-input"
                            placeholder="Поиск организации..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                        {search && <button className="search-clear" onClick={() => setSearch('')}>✕</button>}
                    </div>
                    <button className="btn-sort" onClick={() => setSortCriticalFirst(!sortCriticalFirst)} title="Изменить порядок сортировки">
                        <ArrowUpDown size={16} />
                        <span>{sortCriticalFirst ? 'Сначала критичные' : 'Сначала стабильные'}</span>
                    </button>
                </div>

                {filteredAndSorted.length === 0 ? (
                    <div className="empty-state">
                        <Building2 size={40} className="empty-icon"/>
                        <p className="text-muted">{search ? 'Ничего не найдено' : 'Нет данных для отображения'}</p>
                    </div>
                ) : (
                    <div className="metrics-list animate-fade-in-delay-2">
                        {filteredAndSorted.map(org => (
                            <div
                                key={org.id}
                                className="metrics-item"
                                style={{ borderLeftColor: getStateColor(org.state) }}
                                onClick={() => navigate(`/organizations/details/${org.id}`)}
                            >
                                <div className="metrics-icon">
                                    <Building2 size={20} />
                                </div>
                                <div className="metrics-info">
                                    <span className="metrics-name">{org.name}</span>
                                    <span className="metrics-status" style={{ color: getStateColor(org.state) }}>
                    {STATE_LABELS[org.state]}
                  </span>
                                </div>
                                <span className="metrics-id" title={org.id}>{org.id.slice(0, 8)}...</span>
                            </div>
                        ))}
                    </div>
                )}

                <div className="list-footer">
                    <span className="text-muted">Показано {filteredAndSorted.length} из {data.length}</span>
                </div>
            </div>
        </div>
    )
}