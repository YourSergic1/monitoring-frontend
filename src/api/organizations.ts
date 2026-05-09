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