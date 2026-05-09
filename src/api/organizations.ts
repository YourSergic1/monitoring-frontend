// src/api/organizations.ts
import { getApiUrl, API_ENDPOINTS } from './config'

export interface OrganizationCreateRequest {
    name: string
    address: string
    phoneNumber: string
}

export async function createOrganization(
    data: OrganizationCreateRequest
): Promise<void> {
    const response = await fetch(getApiUrl(API_ENDPOINTS.organizations), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    })

    if (!response.ok) {
        const errorBody = await response.text().catch(() => '')
        let errorMessage = `Ошибка сервера: ${response.status}`

        try {
            const json = JSON.parse(errorBody)
            errorMessage = json.message || json.error || errorMessage
        } catch {
            errorMessage = errorBody || errorMessage
        }

        throw new Error(errorMessage)
    }
}

/**
 * Краткая информация об организации для отображения в списках.
 * Соответствует бэкенд-классу OrganizationSummaryResponse.
 */
export interface OrganizationSummary {
    id: string  // UUID как строка
    name: string
}

/**
 * Получает список всех организаций с бэкенда.
 * Возвращает массив кратких сведений (id + name).
 */
export async function fetchOrganizations(): Promise<OrganizationSummary[]> {
    const response = await fetch(getApiUrl(API_ENDPOINTS.organizations), {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
        },
    })

    if (!response.ok) {
        const errorText = await response.text().catch(() => 'Неизвестная ошибка')
        throw new Error(errorText || `HTTP ${response.status}`)
    }

    return response.json()
}

/**
 * Полная информация об организации (соответствует бэкенд DTO OrganizationResponse)
 */
export interface OrganizationResponse {
    id: string
    name: string
    address: string
    phoneNumber: string
    contactPerson: string
}

/**
 * Получает организацию по UUID
 */
export async function fetchOrganizationById(id: string): Promise<OrganizationResponse> {
    const response = await fetch(getApiUrl(`${API_ENDPOINTS.organizations}/${id}`), {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
    })

    if (!response.ok) {
        const errorText = await response.text().catch(() => 'Не удалось загрузить данные')
        throw new Error(errorText || `HTTP ${response.status}`)
    }

    return response.json()
}

/**
 * Удаляет организацию по UUID.
 * Бэкенд возвращает 200/204 без тела ответа.
 */
export async function deleteOrganizationById(id: string): Promise<void> {
    const response = await fetch(getApiUrl(`${API_ENDPOINTS.organizations}/${id}`), {
        method: 'DELETE',
    })

    if (!response.ok) {
        const errorText = await response.text().catch(() => 'Не удалось удалить организацию')
        throw new Error(errorText || `HTTP ${response.status}`)
    }
}