import { getApiUrl } from './config'

// Тип совпадает с Java-enum AgentState
export type AgentState = 'OK' | 'WARNING' | 'CRITICAL' | 'OFFLINE'

export interface OrganizationMetricsSummary {
    id: string
    name: string
    state: AgentState
}

/**
 * Получает список организаций со статусом агентов.
 * ⚠️ Если endpoint отличается от /organizations, замени строку ниже.
 */
export async function fetchMetricsOrganizations(): Promise<OrganizationMetricsSummary[]> {
    const response = await fetch(getApiUrl('/organizations'))
    if (!response.ok) {
        const errText = await response.text().catch(() => 'Не удалось загрузить метрики')
        throw new Error(errText || `HTTP ${response.status}`)
    }
    return response.json()
}