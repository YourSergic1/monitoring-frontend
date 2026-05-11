import { getApiUrl } from './config'

export type TimeRange = '30m' | '1h' | '2h' | '4h' | '24h'
export type TimeMode = 'relative' | 'absolute'

export interface SystemMetricsResponse {
    hostname: string | null
    localIp: string
    publicIp: string | null
    dateTime: string
    uptimeMinutes: number | null
    cpuMetricsEntities: any[] | Set<any>
    memoryMetricsEntities: any[] | Set<any>
    diskMetricsEntities: any[] | Set<any>
    networkMetricsEntities: any[] | Set<any>
}

export async function fetchAgentMetrics(
    agentId: string,
    params: { mode: 'relative', range: string } | { mode: 'absolute', from: string, to: string }
): Promise<SystemMetricsResponse[]> {
    let endpoint = ''
    if (params.mode === 'relative') {
        endpoint = `/agents/${agentId}/metrics/range?range=${params.range}`
    } else {
        endpoint = `/agents/${agentId}/metrics/dates?startTime=${params.from}&endTime=${params.to}`
    }

    const response = await fetch(getApiUrl(endpoint))
    if (!response.ok) {
        const errText = await response.text().catch(() => 'Ошибка загрузки метрик')
        throw new Error(errText || `HTTP ${response.status}`)
    }

    const json = await response.json()
    return Array.isArray(json) ? json : []
}