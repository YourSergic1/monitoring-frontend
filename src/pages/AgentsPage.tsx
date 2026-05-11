import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Monitor, Loader2, AlertCircle, Search, ArrowUpDown } from 'lucide-react'
import { fetchAgentsByOrganization, type AgentSummaryResponse, type AgentState } from '../api/agents'

// 🔁 Новый приоритет: NULL → OFFLINE → OK → WARNING → CRITICAL
const STATE_PRIORITY: Record<AgentState | 'NULL', number> = {
    NULL: 0,      // Нет данных
    OFFLINE: 1,   // Оффлайн
    OK: 2,        // В норме
    WARNING: 3,   // Внимание
    CRITICAL: 4   // Критично
}

const STATE_LABELS: Record<AgentState, string> = {
    OK: 'В норме',
    WARNING: 'Внимание',
    CRITICAL: 'Критично',
    OFFLINE: 'Оффлайн'
}

const getStateColor = (state: AgentState | null | undefined): string => {
    if (!state) return 'var(--color-text-muted)'
    switch(state) {
        case 'OK': return 'var(--color-success)'
        case 'WARNING': return 'var(--color-warning)'
        case 'CRITICAL': return 'var(--color-error)'
        default: return 'var(--color-text-muted)'
    }
}

const formatDate = (iso: string): string => {
    if (!iso) return ''
    return new Date(iso).toLocaleString('ru-RU', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    })
}

export default function AgentsPage() {
    const { orgId } = useParams<{ orgId: string }>()
    const navigate = useNavigate()
    const [data, setData] = useState<AgentSummaryResponse[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [search, setSearch] = useState('')
    const [sortCriticalFirst, setSortCriticalFirst] = useState(true)

    useEffect(() => {
        if (!orgId) return
        setLoading(true)
        fetchAgentsByOrganization(orgId)
            .then(setData)
            .catch(err => setError(err.message))
            .finally(() => setLoading(false))
    }, [orgId])

    const filteredAndSorted = useMemo(() => {
        let items = data.filter(a => a.localIp.toLowerCase().includes(search.toLowerCase()))

        items.sort((a, b) => {
            const stateA = a.state ?? 'NULL'
            const stateB = b.state ?? 'NULL'
            const pA = STATE_PRIORITY[stateA]
            const pB = STATE_PRIORITY[stateB]
            return sortCriticalFirst ? pA - pB : pB - pA
        })

        return items
    }, [data, search, sortCriticalFirst])

    if (loading) {
        return <div className="page"><div className="container"><div className="list-loading"><Loader2 size={24} className="spinner"/><span>Загрузка агентов...</span></div></div></div>
    }

    if (error) {
        return (
            <div className="page">
                <div className="container">
                    <button type="button" className="back-btn" onClick={() => navigate(-1)}><ArrowLeft size={16}/><span>Назад</span></button>
                    <div className="list-error"><AlertCircle size={20}/><span>{error}</span><button className="btn btn-secondary" onClick={() => window.location.reload()}>Повторить</button></div>
                </div>
            </div>
        )
    }

    return (
        <div className="page">
            <div className="container">
                <button type="button" className="back-btn" onClick={() => navigate('/organizations/metrics')}>
                    <ArrowLeft size={16} /> <span>К списку организаций</span>
                </button>

                <div className="page-header animate-fade-in">
                    <div className="header-title-block">
                        <h1 className="page-title">Мониторинг агентов</h1>
                        <p className="page-subtitle">Статус мониторинга подключенных узлов</p>
                    </div>
                </div>

                <div className="controls-bar animate-fade-in-delay">
                    <div className="search-bar">
                        <Search size={18} className="search-icon" />
                        <input className="search-input" placeholder="Поиск по IP..." value={search} onChange={e => setSearch(e.target.value)} />
                        {search && <button className="search-clear" onClick={() => setSearch('')}>✕</button>}
                    </div>
                    <button className="btn-sort" onClick={() => setSortCriticalFirst(!sortCriticalFirst)} title="Изменить порядок сортировки">
                        <ArrowUpDown size={16} />
                        <span>{sortCriticalFirst ? 'Сначала критичные' : 'Сначала стабильные'}</span>
                    </button>
                </div>

                {filteredAndSorted.length === 0 ? (
                    <div className="empty-state">
                        <Monitor size={40} className="empty-icon"/>
                        <p className="text-muted">{search ? 'Агенты не найдены' : 'Нет подключенных агентов'}</p>
                    </div>
                ) : (
                    <div className="agents-list animate-fade-in-delay-2">
                        {filteredAndSorted.map(agent => (
                            <div key={agent.id} className="agents-item" style={{ borderLeftColor: getStateColor(agent.state) }}>
                                <div className="agents-icon" style={{ backgroundColor: getStateColor(agent.state) || 'var(--color-text-muted)', color: 'white' }}>
                                    <Monitor size={18} />
                                </div>
                                <div className="agents-info">
                                    <span className="agents-ip">{agent.localIp}</span>
                                    <span className="agents-status" style={{ color: getStateColor(agent.state) }}>
                    {agent.state ? STATE_LABELS[agent.state] : 'Нет данных'}
                  </span>
                                    <span className="agents-time">
                    {agent.lastMetricReceived
                        ? `Обновлено: ${formatDate(agent.lastMetricReceived)}`
                        : 'Ожидает первую метрику...'}
                  </span>
                                </div>
                                <span className="agents-id" title={agent.id}>{agent.id.slice(0, 8)}...</span>
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