import { useEffect, useState, useCallback, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
    ArrowLeft, Monitor, Loader2, AlertCircle, RefreshCw,
    Cpu, HardDrive, MemoryStick, Network, Server, Clock,
    Thermometer, Activity, Wifi, Table2
} from 'lucide-react'
import {
    AreaChart, Area, LineChart, Line, XAxis, YAxis,
    CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import {
    fetchAgentMetrics,
    type SystemMetricsResponse,
    type TimeRange,
    type CpuMetricsResponse,
    type MemoryMetricsResponse,
    type DiskMetricsResponse,
    type NetworkMetricsResponse
} from '../api/agentMetrics'

// === Утилиты форматирования ===
const formatBytes = (bytes: number | null): string => {
    if (!bytes || bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
}

const formatPercent = (value: number | null): string =>
    value !== null && value !== undefined ? `${value.toFixed(1)}%` : '—'

const formatTemp = (value: number | null): string =>
    value !== null && value !== undefined && value > 0 ? `${value.toFixed(1)}°C` : '—'

const formatTime = (iso: string): string => {
    return new Date(iso).toLocaleTimeString('ru-RU', {
        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
    })
}

const formatUptime = (minutes: number | null): string => {
    if (!minutes) return '—'
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return h > 0 ? `${h}ч ${m}м` : `${m}м`
}

const getFirstOrNull = <T,>(items: T[] | Set<T> | null | undefined): T | null => {
    if (!items) return null
    if (Array.isArray(items)) return items[0] || null
    if (items instanceof Set) return items.values().next().value || null
    return null
}

// === Цветовая схема ===
const COLORS = {
    cpu: '#3b82f6', memory: '#10b981', swap: '#f59e0b',
    disk: '#8b5cf6', netSent: '#06b6d4', netRecv: '#ec4899',
    temp: '#ef4444', load1: '#3b82f6', load5: '#f59e0b', load15: '#ef4444',
    grid: 'var(--color-border)', text: 'var(--color-text-muted)'
}

// === Компонент карточки графика ===
const ChartCard: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> =
    ({ icon, title, children }) => (
        <div className="chart-card">
            <div className="chart-header">{icon}<span>{title}</span></div>
            <div className="chart-content">{children}</div>
        </div>
    )

// === Custom Tooltip ===
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.length) {
        return (
            <div className="custom-tooltip">
                <p className="tooltip-time">{label}</p>
                {payload.map((entry: any, i: number) => (
                    <p key={i} style={{ color: entry.color }}>
                        {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}
                        {['Загрузка', 'Использование', 'RAM', 'Swap', 'Диск'].some(k => entry.name.includes(k)) ? '%' : ''}
                        {entry.name.includes('Температура') ? '°C' : ''}
                        {entry.name.includes('трафик') ? ' KB/s' : ''}
                    </p>
                ))}
            </div>
        )
    }
    return null
}

// === Основная страница ===
export default function AgentMetricsPage() {
    const { agentId } = useParams<{ agentId: string }>()
    const navigate = useNavigate()

    const [data, setData] = useState<SystemMetricsResponse[] | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [timeRange, setTimeRange] = useState<TimeRange>('30m')
    const [autoRefresh, setAutoRefresh] = useState(true)
    const [lastFetch, setLastFetch] = useState<Date | null>(null)
    const [viewMode, setViewMode] = useState<'charts' | 'table'>('charts')

    const loadData = useCallback(async () => {
        if (!agentId) return
        try {
            setLoading(true)
            const result = await fetchAgentMetrics(agentId, timeRange)
            setData(result)
            setError(null)
            setLastFetch(new Date())
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ошибка загрузки метрик')
        } finally { setLoading(false) }
    }, [agentId, timeRange])

    useEffect(() => { loadData() }, [loadData])
    useEffect(() => {
        if (!autoRefresh) return
        const interval = setInterval(loadData, 60_000)
        return () => clearInterval(interval)
    }, [autoRefresh, loadData])

    const latest = useMemo(() => data?.[0] || null, [data])
    const latestCpu = useMemo(() => getFirstOrNull(latest?.cpuMetricsEntities), [latest?.cpuMetricsEntities])
    const latestMem = useMemo(() => getFirstOrNull(latest?.memoryMetricsEntities), [latest?.memoryMetricsEntities])

    // === Подготовка данных для графиков ===
    const cpuUsageData = useMemo(() => data?.map(p => {
        const c = getFirstOrNull(p.cpuMetricsEntities)
        return { time: formatTime(p.dateTime), usage: c?.usagePercent ?? 0, user: c?.userPercent ?? 0, system: c?.systemPercent ?? 0 }
    }).reverse() || [], [data])

    const tempData = useMemo(() => data?.map(p => ({
        time: formatTime(p.dateTime), temp: getFirstOrNull(p.cpuMetricsEntities)?.temperature ?? 0
    })).reverse() || [], [data])

    const loadDataData = useMemo(() => data?.map(p => {
        const c = getFirstOrNull(p.cpuMetricsEntities)
        return { time: formatTime(p.dateTime), load1: c?.loadAverage1 ?? 0, load5: c?.loadAverage5 ?? 0, load15: c?.loadAverage15 ?? 0 }
    }).reverse() || [], [data])

    const memData = useMemo(() => data?.map(p => {
        const m = getFirstOrNull(p.memoryMetricsEntities)
        return {
            time: formatTime(p.dateTime),
            ram: m?.totalBytes && m.usedBytes ? (m.usedBytes / m.totalBytes) * 100 : 0,
            swap: m?.swapTotalBytes && m.swapUsedBytes ? (m.swapUsedBytes / m.swapTotalBytes) * 100 : 0
        }
    }).reverse() || [], [data])

    const diskData = useMemo(() => {
        const map: Record<string, Array<{time: string, usage: number}>> = {}
        data?.forEach(p => {
            const disks = Array.isArray(p.diskMetricsEntities) ? p.diskMetricsEntities : Array.from(p.diskMetricsEntities || [])
            disks.forEach(d => {
                if (!d.mountPoint) return
                if (!map[d.mountPoint]) map[d.mountPoint] = []
                map[d.mountPoint].push({ time: formatTime(p.dateTime), usage: d.usagePercent ?? 0 })
            })
        })
        Object.values(map).forEach(arr => arr.reverse())
        return map
    }, [data])

    // ✅ Исправленный сетевой график
    const netData = useMemo(() => {
        if (!data || data.length < 2) return []
        const chrono = [...data].reverse() // oldest -> newest
        return chrono.map((p, idx) => {
            const net = getFirstOrNull(p.networkMetricsEntities)
            const prev = idx > 0 ? getFirstOrNull(chrono[idx - 1].networkMetricsEntities) : null
            if (!net || !prev) return { time: formatTime(p.dateTime), sent: 0, recv: 0 }
            const sentRate = Math.max(0, ((net.bytesSent ?? 0) - (prev.bytesSent ?? 0)) / 120)
            const recvRate = Math.max(0, ((net.bytesRecv ?? 0) - (prev.bytesRecv ?? 0)) / 120)
            return { time: formatTime(p.dateTime), sent: sentRate / 1024, recv: recvRate / 1024 }
        })
    }, [data])

    // === Подготовка данных для таблицы ===
    const tableRows = useMemo(() => data?.map(p => {
        const c = getFirstOrNull(p.cpuMetricsEntities)
        const m = getFirstOrNull(p.memoryMetricsEntities)
        const d = getFirstOrNull(p.diskMetricsEntities)
        const n = getFirstOrNull(p.networkMetricsEntities)
        const ramPct = m?.totalBytes && m.usedBytes ? (m.usedBytes / m.totalBytes) * 100 : 0
        const swapPct = m?.swapTotalBytes && m.swapUsedBytes ? (m.swapUsedBytes / m.swapTotalBytes) * 100 : 0
        return {
            time: formatTime(p.dateTime),
            cpu: c?.usagePercent, user: c?.userPercent, sys: c?.systemPercent,
            temp: c?.temperature,
            l1: c?.loadAverage1, l5: c?.loadAverage5, l15: c?.loadAverage15,
            ram: ramPct, swap: swapPct,
            disk: d?.usagePercent,
            netSent: n ? ((n.bytesSent ?? 0) / 1024).toFixed(0) + ' KB' : '—',
            netRecv: n ? ((n.bytesRecv ?? 0) / 1024).toFixed(0) + ' KB' : '—'
        }
    }) || [], [data])

    if (loading && !data) return <div className="page"><div className="container"><div className="metrics-loading"><Loader2 size={32} className="spinner" /><span>Загрузка метрик...</span></div></div></div>
    if (error) return (
        <div className="page"><div className="container">
            <button type="button" className="back-btn" onClick={() => navigate(-1)}><ArrowLeft size={16} /><span>Назад</span></button>
            <div className="metrics-error"><AlertCircle size={24} /><span>{error}</span><button className="btn btn-primary" onClick={loadData}>Повторить</button></div>
        </div></div>
    )
    if (!latest) return null

    return (
        <div className="page">
            <div className="container">
                <div className="metrics-header">
                    <button type="button" className="back-btn" onClick={() => navigate(-1)}><ArrowLeft size={16} /><span>К агентам</span></button>
                    <div className="agent-identity">
                        <Monitor size={24} className="agent-icon" />
                        <div>
                            <h1 className="agent-hostname">{latest.hostname || 'Неизвестный хост'}</h1>
                            <p className="agent-ips"><code>{latest.localIp}</code>{latest.publicIp && <><span className="ip-separator">•</span><code>{latest.publicIp}</code></>}</p>
                        </div>
                    </div>
                    <div className="metrics-controls">
                        <div className="range-selector">
                            {(['30m', '2h', '4h'] as TimeRange[]).map(r => (
                                <button key={r} className={`range-btn ${timeRange === r ? 'active' : ''}`} onClick={() => setTimeRange(r)}>{r}</button>
                            ))}
                        </div>
                        {/* ✅ Переключатель видов */}
                        <div className="view-toggle">
                            <button className={`toggle-btn ${viewMode === 'charts' ? 'active' : ''}`} onClick={() => setViewMode('charts')}>
                                <Activity size={14} /> Графики
                            </button>
                            <button className={`toggle-btn ${viewMode === 'table' ? 'active' : ''}`} onClick={() => setViewMode('table')}>
                                <Table2 size={14} /> Таблица
                            </button>
                        </div>
                        <div className="refresh-group">
                            <button className={`refresh-toggle ${autoRefresh ? 'active' : ''}`} onClick={() => setAutoRefresh(!autoRefresh)} title={autoRefresh ? 'Авто: ВКЛ' : 'Авто: ВЫКЛ'}>
                                <RefreshCw size={16} className={autoRefresh ? 'spin' : ''} />
                            </button>
                            <button className="btn-icon" onClick={loadData} title="Обновить"><RefreshCw size={18} /></button>
                            {lastFetch && <span className="last-update">{lastFetch.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</span>}
                        </div>
                    </div>
                </div>

                <div className="info-bar">
                    <div className="info-item"><Clock size={18} /><div><span className="info-label">Аптайм</span><span className="info-value">{formatUptime(latest.uptimeMinutes)}</span></div></div>
                    <div className="info-item"><Cpu size={18} /><div><span className="info-label">CPU</span><span className="info-value">{latestCpu?.physicalCores} ядра / {latestCpu?.logicalProcessors} потоков</span></div></div>
                    <div className="info-item"><Server size={18} /><div><span className="info-label">Обновлено</span><span className="info-value">{formatTime(latest.dateTime)}</span></div></div>
                    <div className="info-item"><Activity size={18} /><div><span className="info-label">Точек</span><span className="info-value">{data?.length || 0}</span></div></div>
                </div>

                {/* === РЕЖИМ ГРАФИКОВ === */}
                {viewMode === 'charts' && (
                    <div className="charts-section">
                        <ChartCard icon={<Cpu size={18} />} title="Загрузка CPU">
                            <ResponsiveContainer width="100%" height={250}>
                                <AreaChart data={cpuUsageData}>
                                    <defs><linearGradient id="cpuG" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={COLORS.cpu} stopOpacity={0.3}/><stop offset="95%" stopColor={COLORS.cpu} stopOpacity={0}/></linearGradient></defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
                                    <XAxis dataKey="time" tick={{fontSize:11}} stroke={COLORS.text} />
                                    <YAxis domain={[0,100]} tick={{fontSize:11}} stroke={COLORS.text} />
                                    <Tooltip content={<CustomTooltip />} /><Legend />
                                    <Area type="monotone" dataKey="usage" stroke={COLORS.cpu} fill="url(#cpuG)" name="Общая" />
                                    <Area type="monotone" dataKey="user" stroke="#10b981" fill="none" strokeDasharray="4 4" name="User" />
                                    <Area type="monotone" dataKey="system" stroke="#f59e0b" fill="none" strokeDasharray="4 4" name="System" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </ChartCard>

                        <ChartCard icon={<Thermometer size={18} />} title="Температура CPU">
                            <ResponsiveContainer width="100%" height={200}>
                                <LineChart data={tempData}><CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} /><XAxis dataKey="time" tick={{fontSize:11}} stroke={COLORS.text} /><YAxis tick={{fontSize:11}} stroke={COLORS.text} /><Tooltip content={<CustomTooltip />} /><Line type="monotone" dataKey="temp" stroke={COLORS.temp} strokeWidth={2} dot={false} name="°C" /></LineChart>
                            </ResponsiveContainer>
                        </ChartCard>

                        <ChartCard icon={<Activity size={18} />} title="Load Average">
                            <ResponsiveContainer width="100%" height={200}>
                                <LineChart data={loadDataData}><CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} /><XAxis dataKey="time" tick={{fontSize:11}} stroke={COLORS.text} /><YAxis tick={{fontSize:11}} stroke={COLORS.text} /><Tooltip content={<CustomTooltip />} /><Legend /><Line type="monotone" dataKey="load1" stroke={COLORS.load1} strokeWidth={2} dot={false} name="1 мин" /><Line type="monotone" dataKey="load5" stroke={COLORS.load5} strokeWidth={2} dot={false} name="5 мин" /><Line type="monotone" dataKey="load15" stroke={COLORS.load15} strokeWidth={2} dot={false} name="15 мин" /></LineChart>
                            </ResponsiveContainer>
                        </ChartCard>

                        <ChartCard icon={<MemoryStick size={18} />} title="Память и Swap">
                            <ResponsiveContainer width="100%" height={250}>
                                <AreaChart data={memData}>
                                    <defs>
                                        <linearGradient id="ramG" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={COLORS.memory} stopOpacity={0.3}/><stop offset="95%" stopColor={COLORS.memory} stopOpacity={0}/></linearGradient>
                                        <linearGradient id="swpG" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={COLORS.swap} stopOpacity={0.3}/><stop offset="95%" stopColor={COLORS.swap} stopOpacity={0}/></linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} /><XAxis dataKey="time" tick={{fontSize:11}} stroke={COLORS.text} /><YAxis domain={[0,100]} tick={{fontSize:11}} stroke={COLORS.text} /><Tooltip content={<CustomTooltip />} /><Legend />
                                    <Area type="monotone" dataKey="ram" stroke={COLORS.memory} fill="url(#ramG)" name="RAM" />
                                    <Area type="monotone" dataKey="swap" stroke={COLORS.swap} fill="url(#swpG)" name="Swap" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </ChartCard>

                        {Object.entries(diskData).map(([mp, hist]) => (
                            <ChartCard key={mp} icon={<HardDrive size={18} />} title={`Диск: ${mp}`}>
                                <ResponsiveContainer width="100%" height={200}>
                                    <AreaChart data={hist}><CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} /><XAxis dataKey="time" tick={{fontSize:11}} stroke={COLORS.text} /><YAxis domain={[0,100]} tick={{fontSize:11}} stroke={COLORS.text} /><Tooltip content={<CustomTooltip />} /><Area type="monotone" dataKey="usage" stroke={COLORS.disk} fill="rgba(139,92,246,0.2)" name="%" /></AreaChart>
                                </ResponsiveContainer>
                            </ChartCard>
                        ))}

                        <ChartCard icon={<Network size={18} />} title="Сетевой трафик (KB/s)">
                            <ResponsiveContainer width="100%" height={250}>
                                <LineChart data={netData}><CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} /><XAxis dataKey="time" tick={{fontSize:11}} stroke={COLORS.text} /><YAxis tick={{fontSize:11}} stroke={COLORS.text} /><Tooltip content={<CustomTooltip />} /><Legend /><Line type="monotone" dataKey="sent" stroke={COLORS.netSent} strokeWidth={2} dot={false} name="Отправлено" /><Line type="monotone" dataKey="recv" stroke={COLORS.netRecv} strokeWidth={2} dot={false} name="Получено" /></LineChart>
                            </ResponsiveContainer>
                        </ChartCard>
                    </div>
                )}

                {/* === РЕЖИМ ТАБЛИЦЫ === */}
                {viewMode === 'table' && (
                    <div className="table-section">
                        <div className="table-header">
                            <Table2 size={18} />
                            <span>Сводка метрик ({tableRows.length} записей)</span>
                        </div>
                        <div className="data-table-container">
                            <table className="data-table">
                                <thead>
                                <tr>
                                    <th>Время</th><th>CPU %</th><th>User/Sys</th><th>Temp</th>
                                    <th>Load 1/5/15</th><th>RAM %</th><th>Swap %</th>
                                    <th>Disk %</th><th>Net ↑</th><th>Net ↓</th>
                                </tr>
                                </thead>
                                <tbody>
                                {tableRows.map((row, i) => (
                                    <tr key={i}>
                                        <td>{row.time}</td>
                                        <td>{formatPercent(row.cpu)}</td>
                                        <td>{row.user?.toFixed(1)}/{row.sys?.toFixed(1)}</td>
                                        <td>{formatTemp(row.temp)}</td>
                                        <td>{row.l1?.toFixed(2)}/{row.l5?.toFixed(2)}/{row.l15?.toFixed(2)}</td>
                                        <td>{formatPercent(row.ram)}</td>
                                        <td>{formatPercent(row.swap)}</td>
                                        <td>{formatPercent(row.disk)}</td>
                                        <td>{row.netSent}</td>
                                        <td>{row.netRecv}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}