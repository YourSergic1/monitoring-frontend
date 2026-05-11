import { getApiUrl } from './config'

export type AgentState = 'OK' | 'WARNING' | 'CRITICAL' | 'OFFLINE'

export interface AgentSummaryResponse {
    id: string
    localIp: string
    state: AgentState
    lastMetricReceived?: string // ✅ ISO-8601 строка от LocalDateTime (может быть null)
}

export async function fetchAgentsByOrganization(orgId: string): Promise<AgentSummaryResponse[]> {
    const response = await fetch(getApiUrl(`/organizations/${orgId}/agents`))
    if (!response.ok) {
        const errText = await response.text().catch(() => 'Не удалось загрузить список агентов')
        throw new Error(errText || `HTTP ${response.status}`)
    }
    return response.json()
}