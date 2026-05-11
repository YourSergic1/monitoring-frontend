import { useEffect, useState, useCallback, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
    ArrowLeft, Monitor, Loader2, AlertCircle, RefreshCw,
    Cpu, HardDrive, MemoryStick, Network, Server, Clock,
    Thermometer, Activity, Wifi, Table2, ChevronDown, ChevronUp, Info, Calendar
} from 'lucide-react'
import {
    AreaChart, Area, LineChart, Line, XAxis, YAxis,
    CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import {
    fetchAgentMetrics,
    type SystemMetricsResponse,
    type TimeRange,
    type TimeMode
} from '../api/agentMetrics'

// === Утилиты ===
const formatBytes = (bytes: number | null): string => {
    if (!bytes || bytes === 0) return '0 B'
    const k = 1024; const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
}
const formatPercent = (v: number | null): string => v !== null && v !== undefined ? `${v.toFixed(1)}%` : '—'
const formatTemp = (v: number | null): string => v !== null && v !== undefined && v > 0 ? `${v.toFixed(1)}°C` : '—'
const formatTime = (iso: string): string => new Date(iso).toLocaleTimeString('ru-RU', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' })
const formatDateTime = (iso: string): string => new Date(iso).toLocaleString('ru-RU', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' })
const formatUptime = (m: number | null): string => !m ? '—' : `${Math.floor(m/60)}ч ${m%60}м`
const toLocalInput = (iso?: string): string => iso ? iso.slice(0, 16) : ''
const toIsoFromInput = (val: string): string => val ? `${val}:00.000` : ''

const COLORS = {
    cpu: '#3b82f6', memory: '#10b981', swap: '#f59e0b', disk: '#8b5cf6',
    netSent: '#06b6d4', netRecv: '#ec4899', temp: '#ef4444',
    grid: 'var(--color-border)', text: 'var(--color-text-muted)'
}

// === Компоненты UI ===
const ChartCard: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> =
    ({ icon, title, children }) => (
        <div className="chart-card">
            <div className="chart-header">{icon}<span>{title}</span></div>
            <div className="chart-content">{children}</div>
        </div>
    )

const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
        <div className="custom-tooltip">
            <p className="tooltip-time">{label}</p>
            {payload.map((e: any, i: number) => (
                <p key={i} style={{ color: e.color }}>
                    {e.name}: {typeof e.value === 'number' ? e.value.toFixed(2) : e.value}
                    {['Загрузка','Использование','RAM','Swap','Диск'].some(k=>e.name.includes(k)) ? '%' : ''}
                    {e.name.includes('Температура') ? '°C' : ''}
                    {e.name.includes('трафик') ? ' KB/s' : ''}
                </p>
            ))}
        </div>
    )
}

const MetricLegend: React.FC = () => {
    const [open, setOpen] = useState(false)
    const items = [
        { icon: <Clock size={14}/>, param: 'Время', desc: 'момент снятия метрики', color: 'var(--color-text-primary)' },
        { icon: <Cpu size={14}/>, param: 'CPU %', desc: 'общая загрузка процессора', color: COLORS.cpu },
        { icon: <Cpu size={14}/>, param: 'User/Sys/IO', desc: 'время CPU в режимах: пользовательский/системный/ожидание I/O', color: '#10b981' },
        { icon: <Thermometer size={14}/>, param: 'Temp °C', desc: 'температура процессора', color: COLORS.temp },
        { icon: <Activity size={14}/>, param: 'Load Avg', desc: 'средняя нагрузка за 1/5/15 минут', color: '#f59e0b' },
        { icon: <MemoryStick size={14}/>, param: 'RAM %', desc: 'использование оперативной памяти', color: COLORS.memory },
        { icon: <MemoryStick size={14}/>, param: 'RAM Used/Total', desc: 'объём использованной и общей памяти', color: COLORS.memory },
        { icon: <MemoryStick size={14}/>, param: 'Swap %', desc: 'использование файла подкачки', color: COLORS.swap },
        { icon: <HardDrive size={14}/>, param: 'Disk', desc: 'точка монтирования и процент использования', color: COLORS.disk },
        { icon: <HardDrive size={14}/>, param: 'Disk Space', desc: 'объём использованного и общего места', color: COLORS.disk },
        { icon: <Network size={14}/>, param: 'Network', desc: 'отправленные (↑) и полученные (↓) данные', color: COLORS.netSent },
        { icon: <Wifi size={14}/>, param: 'Packets', desc: 'количество пакетов ↑ / ↓', color: COLORS.netRecv },
    ]
    return (
        <div className="legend-wrapper">
            <button className="legend-toggle" onClick={() => setOpen(!open)}>
                <Info size={16}/><span>Описание параметров таблицы</span>
                {open ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
            </button>
            <div className={`legend-content ${open ? 'open' : ''}`}>
                <div className="legend-grid">
                    {items.map((it, i) => (
                        <div key={i} className="legend-item">
                            <span className="legend-icon" style={{color:it.color}}>{it.icon}</span>
                            <div className="legend-text"><strong style={{color:it.color}}>{it.param}</strong><span>{it.desc}</span></div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

// === Хелпер для вставки разрывов в графики ===
const injectGaps = <T extends { time: string; timestamp: number; [k: string]: any }>(
    data: T[],
    thresholdMs = 180000 // 3 минуты
): Omit<T, 'timestamp'>[] => {
    if (data.length < 2) return data.map(({ timestamp, ...rest }) => rest)
    const sorted = [...data].sort((a, b) => a.timestamp - b.timestamp)
    const result: T[] = [sorted[0]]

    for (let i = 1; i < sorted.length; i++) {
        const prev = sorted[i - 1]
        const curr = sorted[i]
        if (curr.timestamp - prev.timestamp > thresholdMs) {
            const gapTime = prev.timestamp + thresholdMs
            const gapPoint = { ...prev, time: formatTime(new Date(gapTime).toISOString()), timestamp: gapTime }
            Object.keys(gapPoint).forEach(k => { if (k !== 'time' && k !== 'timestamp' && typeof gapPoint[k] === 'number') gapPoint[k] = null })
            result.push(gapPoint as T)
        }
        result.push(curr)
    }
    return result.reverse().map(({ timestamp, ...rest }) => rest)
}

// === Основная страница ===
export default function AgentMetricsPage() {
    const { agentId } = useParams<{ agentId: string }>()
    const navigate = useNavigate()

    const [data, setData] = useState<SystemMetricsResponse[] | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [autoRefresh, setAutoRefresh] = useState(true)
    const [lastFetch, setLastFetch] = useState<Date | null>(null)
    const [viewMode, setViewMode] = useState<'charts' | 'table'>('charts')

    const [timeMode, setTimeMode] = useState<TimeMode>('relative')
    const [range, setRange] = useState<TimeRange>('30m')
    const [customFrom, setCustomFrom] = useState('')
    const [customTo, setCustomTo] = useState('')

    useEffect(() => {
        if (timeMode === 'absolute' && !customFrom) {
            const now = new Date()
            const from = new Date(now.getTime() - 30*60000)
            setCustomFrom(toLocalInput(from.toISOString()))
            setCustomTo(toLocalInput(now.toISOString()))
        }
    }, [timeMode])

    const loadData = useCallback(async () => {
        if (!agentId) return
        setLoading(true)
        setError(null)
        try {
            const query = timeMode === 'relative'
                ? { mode: 'relative' as const, range }
                : { mode: 'absolute' as const, from: toIsoFromInput(customFrom), to: toIsoFromInput(customTo) }

            const result = await fetchAgentMetrics(agentId, query)
            setData(result)
            setLastFetch(new Date())
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ошибка загрузки')
        } finally { setLoading(false) }
    }, [agentId, timeMode, range, customFrom, customTo])

    useEffect(() => { loadData() }, [loadData])
    useEffect(() => {
        if (!autoRefresh || timeMode === 'absolute') return
        const id = setInterval(loadData, 60_000)
        return () => clearInterval(id)
    }, [autoRefresh, loadData, timeMode])

    const latest = useMemo(() => data?.[0] || null, [data])
    const latestCpu = useMemo(() => Array.isArray(latest?.cpuMetricsEntities) ? latest.cpuMetricsEntities[0] : null, [latest?.cpuMetricsEntities])
    const latestMem = useMemo(() => Array.isArray(latest?.memoryMetricsEntities) ? latest.memoryMetricsEntities[0] : null, [latest?.memoryMetricsEntities])

    // Данные для графиков с автоматическими разрывами
    const cpuUsageData = useMemo(() => injectGaps((data?.map(p => {
        const c = Array.isArray(p.cpuMetricsEntities) ? p.cpuMetricsEntities[0] : null
        return { time: formatTime(p.dateTime), timestamp: new Date(p.dateTime).getTime(), usage: c?.usagePercent ?? null, user: c?.userPercent ?? null, system: c?.systemPercent ?? null }
    }) || [])), [data])

    const tempData = useMemo(() => injectGaps((data?.map(p => {
        const c = Array.isArray(p.cpuMetricsEntities) ? p.cpuMetricsEntities[0] : null
        return { time: formatTime(p.dateTime), timestamp: new Date(p.dateTime).getTime(), temp: c?.temperature ?? null }
    }) || [])), [data])

    const memData = useMemo(() => injectGaps((data?.map(p => {
        const m = Array.isArray(p.memoryMetricsEntities) ? p.memoryMetricsEntities[0] : null
        return {
            time: formatTime(p.dateTime), timestamp: new Date(p.dateTime).getTime(),
            ram: m?.totalBytes && m.usedBytes ? (m.usedBytes/m.totalBytes)*100 : null,
            swap: m?.swapTotalBytes && m.swapUsedBytes ? (m.swapUsedBytes/m.swapTotalBytes)*100 : null
        }
    }) || [])), [data])

    const diskChartData = useMemo(() => {
        const map: Record<string, Array<{time: string, timestamp: number, usage: number | null}>> = {}
        data?.forEach(p => {
            const disks = Array.isArray(p.diskMetricsEntities) ? p.diskMetricsEntities : []
            disks.forEach(d => {
                if (!d.mountPoint) return
                if (!map[d.mountPoint]) map[d.mountPoint] = []
                map[d.mountPoint].push({ time: formatTime(p.dateTime), timestamp: new Date(p.dateTime).getTime(), usage: d.usagePercent ?? null })
            })
        })
        const result: Record<string, Array<{time: string, usage: number | null}>> = {}
        Object.entries(map).forEach(([k, v]) => result[k] = injectGaps(v))
        return result
    }, [data])

    const networkChartData = useMemo(() => {
        const map: Record<string, Array<{time: string, timestamp: number, sent: number | null, recv: number | null}>> = {}
        if (!data || data.length < 2) return {}
        const chrono = [...data].reverse()
        chrono.forEach((p, idx) => {
            const nets = Array.isArray(p.networkMetricsEntities) ? p.networkMetricsEntities : []
            nets.forEach(net => {
                if (!net.interfaceName) return
                if (!map[net.interfaceName]) map[net.interfaceName] = []
                const prevNets = idx > 0 ? (Array.isArray(chrono[idx-1].networkMetricsEntities) ? chrono[idx-1].networkMetricsEntities : []) : []
                const prev = prevNets.find(n => n.interfaceName === net.interfaceName)
                const ts = new Date(p.dateTime).getTime()
                const sent = prev && net.bytesSent != null && prev.bytesSent != null ? Math.max(0, (net.bytesSent - prev.bytesSent)/120) : null
                const recv = prev && net.bytesRecv != null && prev.bytesRecv != null ? Math.max(0, (net.bytesRecv - prev.bytesRecv)/120) : null
                map[net.interfaceName].push({ time: formatTime(p.dateTime), timestamp: ts, sent, recv })
            })
        })
        const result: Record<string, Array<{time: string, sent: number | null, recv: number | null}>> = {}
        Object.entries(map).forEach(([k, v]) => result[k] = injectGaps(v))
        return result
    }, [data])

    const tableRows = useMemo(() => data?.map(p => {
        const c = Array.isArray(p.cpuMetricsEntities) ? p.cpuMetricsEntities[0] : null
        const m = Array.isArray(p.memoryMetricsEntities) ? p.memoryMetricsEntities[0] : null
        const disks = Array.isArray(p.diskMetricsEntities) ? p.diskMetricsEntities : []
        const nets = Array.isArray(p.networkMetricsEntities) ? p.networkMetricsEntities : []
        const ramPct = m?.totalBytes && m.usedBytes ? (m.usedBytes/m.totalBytes)*100 : null
        const swapPct = m?.swapTotalBytes && m.swapUsedBytes ? (m.swapUsedBytes/m.swapTotalBytes)*100 : null
        return {
            time: formatTime(p.dateTime), cpu: c?.usagePercent, user: c?.userPercent, sys: c?.systemPercent, iowait: c?.iowaitPercent, temp: c?.temperature,
            l1: c?.loadAverage1, l5: c?.loadAverage5, l15: c?.loadAverage15, ram: ramPct, swap: swapPct,
            ramUsed: m?.usedBytes, ramTotal: m?.totalBytes,
            diskLines: disks.length ? disks.map(d => `${(d.mountPoint||'—').padEnd(6)} ${formatPercent(d.usagePercent).padStart(5)} (${formatBytes(d.usedBytes)} / ${formatBytes(d.totalBytes)})`).join('\n') : '—',
            netLines: nets.length ? nets.map(n => `${(n.interfaceName||'unknown').padEnd(16)} ↑${formatBytes(n.bytesSent).padStart(8)} ↓${formatBytes(n.bytesRecv)}`).join('\n') : '—',
            pktLines: nets.length ? nets.map(n => `${(n.interfaceName||'unknown').padEnd(16)} ↑${(n.packetsSent??0).toLocaleString().padStart(6)} ↓${(n.packetsRecv??0).toLocaleString()}`).join('\n') : '—'
        }
    }) || [], [data])

    const EmptyState = () => (
        <div className="empty-state-box">
            <Activity size={40} className="empty-icon" />
            <h3>Нет данных за выбранный период</h3>
            <p>Агент не отправлял метрики в указанное время или ещё не инициирован.</p>
            {timeMode === 'absolute' && (
                <button className="btn btn-secondary" onClick={() => { setTimeMode('relative'); setRange('30m'); }}>
                    Показать последние 30 минут
                </button>
            )}
        </div>
    )

    return (
        <div className="page">
            <div className="container">
                <div className="metrics-header">
                    <button type="button" className="back-btn" onClick={() => navigate(-1)}><ArrowLeft size={16}/><span>К агентам</span></button>
                    <div className="agent-identity">
                        <Monitor size={24} className="agent-icon"/><div>
                        <h1 className="agent-hostname">{latest?.hostname || 'Загрузка...'}</h1>
                        <p className="agent-ips"><code>{latest?.localIp || '—'}</code>{latest?.publicIp && <><span className="ip-separator">•</span><code>{latest.publicIp}</code></>}</p>
                    </div>
                    </div>
                    <div className="metrics-controls">
                        <div className="time-mode-toggle">
                            <button className={`mode-btn ${timeMode==='relative'?'active':''}`} onClick={()=>setTimeMode('relative')}>Относительно</button>
                            <button className={`mode-btn ${timeMode==='absolute'?'active':''}`} onClick={()=>setTimeMode('absolute')}>Период</button>
                        </div>

                        {timeMode === 'relative' ? (
                            <div className="range-selector">
                                {(['30m','1h','2h','4h','24h'] as TimeRange[]).map(r => (
                                    <button key={r} className={`range-btn ${range===r?'active':''}`} onClick={()=>setRange(r)}>{r}</button>
                                ))}
                            </div>
                        ) : (
                            <div className="absolute-picker">
                                <div className="picker-field"><Calendar size={14}/><input type="datetime-local" value={customFrom} onChange={e=>setCustomFrom(e.target.value)} /></div>
                                <span>—</span>
                                <div className="picker-field"><Calendar size={14}/><input type="datetime-local" value={customTo} onChange={e=>setCustomTo(e.target.value)} /></div>
                            </div>
                        )}

                        <div className="refresh-group">
                            <button className={`refresh-toggle ${autoRefresh?'active':''}`} onClick={()=>setAutoRefresh(!autoRefresh)} title={autoRefresh?'Авто: ВКЛ':'Авто: ВЫКЛ'}>
                                <RefreshCw size={16} className={autoRefresh?'spin':''}/>
                            </button>
                            <button className="btn-icon" onClick={loadData} title="Обновить"><RefreshCw size={18}/></button>
                            {lastFetch && <span className="last-update">{lastFetch.toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'})}</span>}
                        </div>
                    </div>
                </div>

                <div className="info-bar">
                    <div className="info-item"><Clock size={18}/><div><span className="info-label">Аптайм</span><span className="info-value">{formatUptime(latest?.uptimeMinutes)}</span></div></div>
                    <div className="info-item"><Cpu size={18}/><div><span className="info-label">CPU</span><span className="info-value">{latestCpu?.physicalCores} ядра / {latestCpu?.logicalProcessors} потоков</span></div></div>
                    <div className="info-item"><Server size={18}/><div><span className="info-label">Обновлено</span><span className="info-value">{latest ? formatDateTime(latest.dateTime) : '—'}</span></div></div>
                    <div className="info-item"><Activity size={18}/><div><span className="info-label">Точек</span><span className="info-value">{data?.length || 0}</span></div></div>
                </div>

                {error ? (
                    <div className="metrics-error"><AlertCircle size={24}/><span>{error}</span><button className="btn btn-primary" onClick={loadData}>Повторить</button></div>
                ) : loading && !data ? (
                    <div className="metrics-loading"><Loader2 size={32} className="spinner"/><span>Загрузка метрик...</span></div>
                ) : data?.length === 0 ? (
                    <EmptyState />
                ) : (
                    <>
                        {viewMode === 'charts' && (
                            <div className="charts-section">
                                <ChartCard icon={<Cpu size={18}/>} title="Загрузка CPU">
                                    <ResponsiveContainer width="100%" height={250}>
                                        <AreaChart data={cpuUsageData}><defs><linearGradient id="cpuG" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={COLORS.cpu} stopOpacity={0.3}/><stop offset="95%" stopColor={COLORS.cpu} stopOpacity={0}/></linearGradient></defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid}/><XAxis dataKey="time" tick={{fontSize:11}} stroke={COLORS.text}/><YAxis domain={[0,100]} tick={{fontSize:11}} stroke={COLORS.text}/>
                                            <Tooltip content={<CustomTooltip/>}/><Legend/>
                                            <Area type="monotone" dataKey="usage" stroke={COLORS.cpu} fill="url(#cpuG)" name="Общая" connectNulls={false}/>
                                            <Area type="monotone" dataKey="user" stroke="#10b981" fill="none" strokeDasharray="4 4" name="User" connectNulls={false}/>
                                            <Area type="monotone" dataKey="system" stroke="#f59e0b" fill="none" strokeDasharray="4 4" name="System" connectNulls={false}/></AreaChart>
                                    </ResponsiveContainer>
                                </ChartCard>

                                <ChartCard icon={<Thermometer size={18}/>} title="Температура CPU">
                                    <ResponsiveContainer width="100%" height={200}>
                                        <LineChart data={tempData}><CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid}/><XAxis dataKey="time" tick={{fontSize:11}} stroke={COLORS.text}/><YAxis tick={{fontSize:11}} stroke={COLORS.text}/>
                                            <Tooltip content={<CustomTooltip/>}/><Line type="monotone" dataKey="temp" stroke={COLORS.temp} strokeWidth={2} dot={false} name="°C" connectNulls={false}/></LineChart>
                                    </ResponsiveContainer>
                                </ChartCard>

                                <ChartCard icon={<MemoryStick size={18}/>} title="Память и Swap">
                                    <ResponsiveContainer width="100%" height={250}>
                                        <AreaChart data={memData}><defs><linearGradient id="ramG" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={COLORS.memory} stopOpacity={0.3}/><stop offset="95%" stopColor={COLORS.memory} stopOpacity={0}/></linearGradient><linearGradient id="swpG" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={COLORS.swap} stopOpacity={0.3}/><stop offset="95%" stopColor={COLORS.swap} stopOpacity={0}/></linearGradient></defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid}/><XAxis dataKey="time" tick={{fontSize:11}} stroke={COLORS.text}/><YAxis domain={[0,100]} tick={{fontSize:11}} stroke={COLORS.text}/>
                                            <Tooltip content={<CustomTooltip/>}/><Legend/>
                                            <Area type="monotone" dataKey="ram" stroke={COLORS.memory} fill="url(#ramG)" name="RAM" connectNulls={false}/>
                                            <Area type="monotone" dataKey="swap" stroke={COLORS.swap} fill="url(#swpG)" name="Swap" connectNulls={false}/></AreaChart>
                                    </ResponsiveContainer>
                                </ChartCard>

                                {Object.entries(diskChartData).map(([mp, hist]) => (
                                    <ChartCard key={mp} icon={<HardDrive size={18}/>} title={`Диск: ${mp}`}>
                                        <ResponsiveContainer width="100%" height={200}><AreaChart data={hist}><CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid}/><XAxis dataKey="time" tick={{fontSize:11}} stroke={COLORS.text}/><YAxis domain={[0,100]} tick={{fontSize:11}} stroke={COLORS.text}/>
                                            <Tooltip content={<CustomTooltip/>}/><Area type="monotone" dataKey="usage" stroke={COLORS.disk} fill="rgba(139,92,246,0.2)" name="%" connectNulls={false}/></AreaChart></ResponsiveContainer>
                                    </ChartCard>
                                ))}

                                {Object.entries(networkChartData).map(([iface, hist]) => (
                                    <ChartCard key={iface} icon={<Network size={18}/>} title={`Сеть: ${iface} (KB/s)`}>
                                        <ResponsiveContainer width="100%" height={250}><LineChart data={hist}><CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid}/><XAxis dataKey="time" tick={{fontSize:11}} stroke={COLORS.text}/><YAxis tick={{fontSize:11}} stroke={COLORS.text}/>
                                            <Tooltip content={<CustomTooltip/>}/><Legend/><Line type="monotone" dataKey="sent" stroke={COLORS.netSent} strokeWidth={2} dot={false} name="Отправлено" connectNulls={false}/><Line type="monotone" dataKey="recv" stroke={COLORS.netRecv} strokeWidth={2} dot={false} name="Получено" connectNulls={false}/></LineChart></ResponsiveContainer>
                                    </ChartCard>
                                ))}
                            </div>
                        )}

                        {viewMode === 'table' && (
                            <div className="table-section">
                                <div className="table-header"><Table2 size={18}/><span>Сводка метрик ({data?.length || 0} записей)</span></div>
                                <MetricLegend />
                                <div className="data-table-wrapper">
                                    <table className="data-table">
                                        <thead><tr>
                                            <th>Время</th><th>CPU %</th><th>User/Sys/IO</th><th>Temp °C</th>
                                            <th>Load Avg</th><th>RAM %</th><th>RAM</th><th>Swap %</th><th>Disk</th><th>Network</th><th>Packets</th>
                                        </tr></thead>
                                        <tbody>{tableRows.map((r, i) => (
                                            <tr key={i}><td>{r.time}</td><td>{formatPercent(r.cpu)}</td>
                                                <td>{r.user?.toFixed(1)} / {r.sys?.toFixed(1)} / {r.iowait?.toFixed(1)}</td>
                                                <td>{formatTemp(r.temp)}</td><td>{r.l1?.toFixed(2)??'—'} / {r.l5?.toFixed(2)??'—'} / {r.l15?.toFixed(2)??'—'}</td>
                                                <td>{formatPercent(r.ram)}</td><td>{r.ramUsed?formatBytes(r.ramUsed):'—'}<br/><small>{r.ramTotal?formatBytes(r.ramTotal):'—'}</small></td>
                                                <td>{formatPercent(r.swap)}</td>
                                                <td className="multi-cell">{r.diskLines.split('\n').map((l,j)=><div key={j} className="cell-line">{l}</div>)}</td>
                                                <td className="multi-cell">{r.netLines.split('\n').map((l,j)=><div key={j} className="cell-line">{l}</div>)}</td>
                                                <td className="multi-cell">{r.pktLines.split('\n').map((l,j)=><div key={j} className="cell-line">{l}</div>)}</td>
                                            </tr>
                                        ))}</tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}