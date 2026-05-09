// src/api/config.ts
export const API_CONFIG = {
    baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081/api/v1',
    timeouts: {
        default: 10000,
    },
} as const

export const API_ENDPOINTS = {
    organizations: '/organizations',
} as const

export const getApiUrl = (endpoint: string) =>
    `${API_CONFIG.baseUrl}${endpoint}`