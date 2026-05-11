import { useEffect, useState, useCallback, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
    ArrowLeft, Monitor, Loader2, AlertCircle, RefreshCw,
    Cpu, HardDrive, MemoryStick, Network, Server, Clock,
    Thermometer, Activity, Wifi, Table2, ChevronDown, ChevronUp, Info
} from 'lucide-react'
import {
    AreaChart, Area, LineChart, Line, XAxis, YAxis,
    CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import {
    fetchAgentMetrics,
    type SystemMetricsResponse,
    type TimeRange,
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

// === Цветовая схема ===
const COLORS = {
    cpu: '#3b82f6', memory: '#10b981', swap: '#f59e0b',
    disk: '#8b5cf6', netSent: '#06b6d4', netRecv: '#ec4899',
    temp: '#ef4444', grid: 'var(--color-border)', text: 'var(--color-text-muted)'
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

// === Компонент сворачиваемой легенды ===
const MetricLegend: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false)

    const items = [
        { icon: <Clock size={14} />, param: 'Время', desc: 'время снятия метрики', color: 'var(--color-text-primary)' },
        { icon: <Cpu size={14} />, param: 'CPU %', desc: 'общая загрузка процессора, %', color: COLORS.cpu },
        { icon: <Cpu size={14} />, param: 'User/Sys/IO', desc: 'время CPU: пользовательский / системный режим / ожидание I/O, %', color: '#10b981' },
        { icon: <Thermometer size={14} />, param: 'Temp °C', desc: 'температура процессора', color: COLORS.temp },
        { icon: <Activity size={14} />, param: 'Load Avg', desc: 'средняя нагрузка: процессов в очереди за 1/5/15 мин', color: '#f59e0b' },
        { icon: <MemoryStick size={14} />, param: 'RAM %', desc: 'использование оперативной памяти, %', color: COLORS.memory },
        { icon: <MemoryStick size={14} />, param: 'RAM Used/Total', desc: 'объём использованной и общей оперативной памяти', color: COLORS.memory },
        { icon: <MemoryStick size={14} />, param: 'Swap %', desc: 'использование файла подкачки, %', color: COLORS.swap },
        { icon: <HardDrive size={14} />, param: 'Disk', desc: 'точка монтирования и процент использования диска', color: COLORS.disk },
        { icon: <HardDrive size={14} />, param: 'Disk Space', desc: 'объём использованного и общего места на диске', color: COLORS.disk },
        { icon: <Network size={14} />, param: 'Network', desc: 'объём отправленных (↑) и полученных (↓) данных', color: COLORS.netSent },
        { icon: <Wifi size={14} />, param: 'Packets', desc: 'количество отправленных (↑) и полученных (↓) пакетов', color: COLORS.netRecv },
    ]

    return (
        <div className="legend-wrapper">
            <button className="legend-toggle" onClick={() => setIsOpen(!isOpen)}>
                <Info size={16} />
                <span>Описание параметров таблицы</span>
                {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            <div className={`legend-content ${isOpen ? 'open' : ''}`}>
                <div className="legend-grid">
                    {items.map((item, i) => (
                        <div key={i} className="legend-item">
                            <span className="legend-icon" style={{ color: item.color }}>{item.icon}</span>
                            <div className="legend-text">
                                <strong style={{ color: item.color }}>{item.param}</strong>
                                <span>{item.desc}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
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
    const latestCpu = useMemo(() => {
        const cpus = latest?.cpuMetricsEntities
        return Array.isArray(cpus) ? cpus[0] || null : (cpus instanceof Set ? cpus.values().next().value || null : null)
    }, [latest?.cpuMetricsEntities])
    const latestMem = useMemo(() => {
        const mems = latest?.memoryMetricsEntities
        return Array.isArray(mems) ? mems[0] || null : (mems instanceof Set ? mems.values().next().value || null : null)
    }, [latest?.memoryMetricsEntities])

    // === Подготовка данных для графиков ===
    const cpuUsageData = useMemo(() => data?.map(p => {
        const cpus = p.cpuMetricsEntities
        const c = Array.isArray(cpus) ? cpus[0] : (cpus instanceof Set ? cpus.values().next().value : null)
        return { time: formatTime(p.dateTime), usage: c?.usagePercent ?? 0, user: c?.userPercent ?? 0, system: c?.systemPercent ?? 0 }
    }).reverse() || [], [data])

    const tempData = useMemo(() => data?.map(p => {
        const cpus = p.cpuMetricsEntities
        const c = Array.isArray(cpus) ? cpus[0] : (cpus instanceof Set ? cpus.values().next().value : null)
        return { time: formatTime(p.dateTime), temp: c?.temperature ?? 0 }
    }).reverse() || [], [data])

    const memData = useMemo(() => data?.map(p => {
        const mems = p.memoryMetricsEntities
        const m = Array.isArray(mems) ? mems[0] : (mems instanceof Set ? mems.values().next().value : null)
        return {
            time: formatTime(p.dateTime),
            ram: m?.totalBytes && m.usedBytes ? (m.usedBytes / m.totalBytes) * 100 : 0,
            swap: m?.swapTotalBytes && m.swapUsedBytes ? (m.swapUsedBytes / m.swapTotalBytes) * 100 : 0
        }
    }).reverse() || [], [data])

    const diskChartData = useMemo(() => {
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

    const networkChartData = useMemo(() => {
        const map: Record<string, Array<{time: string, sent: number, recv: number}>> = {}
        if (!data || data.length < 2) return map

        const chrono = [...data].reverse()
        chrono.forEach((p, idx) => {
            const nets = Array.isArray(p.networkMetricsEntities) ? p.networkMetricsEntities : Array.from(p.networkMetricsEntities || [])
            nets.forEach(net => {
                if (!net.interfaceName) return
                if (!map[net.interfaceName]) map[net.interfaceName] = []

                const prevNets = idx > 0
                    ? (Array.isArray(chrono[idx-1].networkMetricsEntities) ? chrono[idx-1].networkMetricsEntities : Array.from(chrono[idx-1].networkMetricsEntities || []))
                    : []
                const prevNet = prevNets.find(n => n.interfaceName === net.interfaceName)

                const sentRate = prevNet && net.bytesSent !== null && prevNet.bytesSent !== null
                    ? Math.max(0, (net.bytesSent - prevNet.bytesSent) / 120)
                    : 0
                const recvRate = prevNet && net.bytesRecv !== null && prevNet.bytesRecv !== null
                    ? Math.max(0, (net.bytesRecv - prevNet.bytesRecv) / 120)
                    : 0

                map[net.interfaceName].push({
                    time: formatTime(p.dateTime),
                    sent: sentRate / 1024,
                    recv: recvRate / 1024
                })
            })
        })
        Object.values(map).forEach(arr => arr.reverse())
        return map
    }, [data])

    // === Подготовка данных для таблицы (с аккуратным форматированием) ===
    const tableRows = useMemo(() => data?.map(p => {
        const cpus = p.cpuMetricsEntities
        const c = Array.isArray(cpus) ? cpus[0] : (cpus instanceof Set ? cpus.values().next().value : null)
        const mems = p.memoryMetricsEntities
        const m = Array.isArray(mems) ? mems[0] : (mems instanceof Set ? mems.values().next().value : null)
        const disks = Array.isArray(p.diskMetricsEntities) ? p.diskMetricsEntities : Array.from(p.diskMetricsEntities || [])
        const nets = Array.isArray(p.networkMetricsEntities) ? p.networkMetricsEntities : Array.from(p.networkMetricsEntities || [])

        const ramPct = m?.totalBytes && m.usedBytes ? (m.usedBytes / m.totalBytes) * 100 : 0
        const swapPct = m?.swapTotalBytes && m.swapUsedBytes ? (m.swapUsedBytes / m.swapTotalBytes) * 100 : 0

        const formatDisk = (d: DiskMetricsResponse) =>
            `${(d.mountPoint || '—').padEnd(6)} ${formatPercent(d.usagePercent).padStart(5)}  (${formatBytes(d.usedBytes)} / ${formatBytes(d.totalBytes)})`

        const formatNet = (n: NetworkMetricsResponse) =>
            `${(n.interfaceName || 'unknown').padEnd(16)} ↑${formatBytes(n.bytesSent).padStart(8)}  ↓${formatBytes(n.bytesRecv)}`

        const formatPkt = (n: NetworkMetricsResponse) =>
            `${(n.interfaceName || 'unknown').padEnd(16)} ↑${(n.packetsSent ?? 0).toLocaleString().padStart(6)}  ↓${(n.packetsRecv ?? 0).toLocaleString()}`

        return {
            time: formatTime(p.dateTime),
            cpu: c?.usagePercent, user: c?.userPercent, sys: c?.systemPercent, iowait: c?.iowaitPercent,
            temp: c?.temperature,
            l1: c?.loadAverage1, l5: c?.loadAverage5, l15: c?.loadAverage15,
            ram: ramPct, swap: swapPct,
            ramUsed: m?.usedBytes, ramTotal: m?.totalBytes,
            diskLines: disks.length > 0 ? disks.map(formatDisk).join('\n') : '—',
            netLines: nets.length > 0 ? nets.map(formatNet).join('\n') : '—',
            pktLines: nets.length > 0 ? nets.map(formatPkt).join('\n') : '—'
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

                        {Object.entries(diskChartData).map(([mountPoint, hist]) => (
                            <ChartCard key={mountPoint} icon={<HardDrive size={18} />} title={`Диск: ${mountPoint}`}>
                                <ResponsiveContainer width="100%" height={200}>
                                    <AreaChart data={hist}><CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} /><XAxis dataKey="time" tick={{fontSize:11}} stroke={COLORS.text} /><YAxis domain={[0,100]} tick={{fontSize:11}} stroke={COLORS.text} /><Tooltip content={<CustomTooltip />} /><Area type="monotone" dataKey="usage" stroke={COLORS.disk} fill="rgba(139,92,246,0.2)" name="%" /></AreaChart>
                                </ResponsiveContainer>
                            </ChartCard>
                        ))}

                        {Object.entries(networkChartData).map(([iface, hist]) => (
                            <ChartCard key={iface} icon={<Network size={18} />} title={`Сеть: ${iface} (KB/s)`}>
                                <ResponsiveContainer width="100%" height={250}>
                                    <LineChart data={hist}><CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} /><XAxis dataKey="time" tick={{fontSize:11}} stroke={COLORS.text} /><YAxis tick={{fontSize:11}} stroke={COLORS.text} /><Tooltip content={<CustomTooltip />} /><Legend /><Line type="monotone" dataKey="sent" stroke={COLORS.netSent} strokeWidth={2} dot={false} name="Отправлено" /><Line type="monotone" dataKey="recv" stroke={COLORS.netRecv} strokeWidth={2} dot={false} name="Получено" /></LineChart>
                                </ResponsiveContainer>
                            </ChartCard>
                        ))}
                    </div>
                )}

                {/* === РЕЖИМ ТАБЛИЦЫ === */}
                {viewMode === 'table' && (
                    <div className="table-section">
                        <div className="table-header">
                            <Table2 size={18} />
                            <span>Сводка метрик ({tableRows.length} записей)</span>
                        </div>

                        <MetricLegend />

                        <div className="data-table-wrapper">
                            <table className="data-table">
                                <thead>
                                <tr>
                                    <th title="Время снятия метрики">Время</th>
                                    <th title="Общая загрузка процессора, %">CPU %</th>
                                    <th title="User / System / IOWait — время CPU в разных режимах, %">User/Sys/IO</th>
                                    <th title="Температура процессора, °C">Temp °C</th>
                                    <th title="Средняя нагрузка за 1/5/15 минут">Load Avg</th>
                                    <th title="Использование оперативной памяти, %">RAM %</th>
                                    <th title="Использовано / Всего оперативной памяти">RAM</th>
                                    <th title="Использование файла подкачки, %">Swap %</th>
                                    <th title="Все диски: точка / % / объём">Disk</th>
                                    <th title="Все интерфейсы: имя / отправлено / получено">Network</th>
                                    <th title="Все интерфейсы: имя / отправлено / получено пакетов">Packets</th>
                                </tr>
                                </thead>
                                <tbody>
                                {tableRows.map((row, i) => (
                                    <tr key={i}>
                                        <td>{row.time}</td>
                                        <td>{formatPercent(row.cpu)}</td>
                                        <td>{row.user?.toFixed(1)} / {row.sys?.toFixed(1)} / {row.iowait?.toFixed(1)}</td>
                                        <td>{formatTemp(row.temp)}</td>
                                        <td>{row.l1?.toFixed(2) ?? '—'} / {row.l5?.toFixed(2) ?? '—'} / {row.l15?.toFixed(2) ?? '—'}</td>
                                        <td>{formatPercent(row.ram)}</td>
                                        <td>{row.ramUsed ? formatBytes(row.ramUsed) : '—'}<br/><small>{row.ramTotal ? formatBytes(row.ramTotal) : '—'}</small></td>
                                        <td>{formatPercent(row.swap)}</td>
                                        <td className="multi-cell">{row.diskLines.split('\n').map((line, j) => <div key={j} className="cell-line">{line}</div>)}</td>
                                        <td className="multi-cell">{row.netLines.split('\n').map((line, j) => <div key={j} className="cell-line">{line}</div>)}</td>
                                        <td className="multi-cell">{row.pktLines.split('\n').map((line, j) => <div key={j} className="cell-line">{line}</div>)}</td>
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