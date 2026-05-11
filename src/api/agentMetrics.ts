import { getApiUrl } from './config'

export type TimeRange = '30m' | '2h' | '4h'

// === Response DTOs (точное соответствие Java) ===

export interface CpuMetricsResponse {
    usagePercent: number | null
    userPercent: number | null
    systemPercent: number | null
    iowaitPercent: number | null
    loadAverage1: number | null
    loadAverage5: number | null
    loadAverage15: number | null
    temperature: number | null
    physicalCores: number | null
    logicalProcessors: number | null
}

export interface MemoryMetricsResponse {
    totalBytes: number | null
    availableBytes: number | null
    usedBytes: number | null
    swapTotalBytes: number | null
    swapUsedBytes: number | null
    swapUsagePercent: number | null
}

export interface DiskMetricsResponse {
    mountPoint: string | null
    type: string | null
    totalBytes: number | null
    usedBytes: number | null
    freeBytes: number | null
    usagePercent: number | null
}

export interface NetworkMetricsResponse {
    interfaceName: string | null
    bytesSent: number | null
    bytesRecv: number | null
    packetsSent: number | null
    packetsRecv: number | null
    inErrors: number | null
    outErrors: number | null
    speed: number | null
}

export interface SystemMetricsResponse {
    hostname: string | null
    localIp: string
    publicIp: string | null
    dateTime: string // ISO-8601 от LocalDateTime
    uptimeMinutes: number | null
    cpuMetricsEntities: Set<CpuMetricsResponse>
    memoryMetricsEntities: Set<MemoryMetricsResponse>
    diskMetricsEntities: Set<DiskMetricsResponse>
    networkMetricsEntities: Set<NetworkMetricsResponse>
}

/**
 * Получает метрики агента за указанный диапазон.
 * ⚠️ Сейчас возвращает ПОСЛЕДНИЙ срез данных в диапазоне.
 * Для графиков с историей бэкенд должен вернуть массив:
 *   GET /agents/{id}/metrics?range=30m&series=true
 */
export async function fetchAgentMetrics(
    agentId: string,
    range: TimeRange = '30m'
): Promise<SystemMetricsResponse[]> {
    const url = `${getApiUrl(`/agents/${agentId}/metrics`)}?range=${range}`
    const response = await fetch(url)

    if (!response.ok) {
        const errText = await response.text().catch(() => 'Не удалось загрузить метрики')
        throw new Error(errText || `HTTP ${response.status}`)
    }
    return response.json()
}