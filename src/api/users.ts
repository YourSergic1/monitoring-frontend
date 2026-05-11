import { getApiUrl } from './config'

export interface RoleResponse {
    role: string
    displayName: string
}

export interface CreateUserDTO {
    name: string
    surname: string
    patronymic: string
    email: string
    phone: string
    role: string
}

// ✅ Новый интерфейс для списка
export interface UserSummaryResponse {
    id: string
    name: string
    surname: string
    patronymic: string
}

export async function fetchUserRoles(): Promise<RoleResponse[]> {
    const res = await fetch(getApiUrl('/users/roles'))
    if (!res.ok) throw new Error('Не удалось загрузить список ролей')
    return res.json()
}

export async function createUser(dto: CreateUserDTO): Promise<void> {
    const res = await fetch(getApiUrl('/users'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dto)
    })
    if (!res.ok) {
        const errText = await res.text().catch(() => 'Ошибка сервера')
        throw new Error(errText || `HTTP ${res.status}`)
    }
}

// ✅ Функция получения списка
export async function fetchUsers(): Promise<UserSummaryResponse[]> {
    const res = await fetch(getApiUrl('/users'))
    if (!res.ok) throw new Error('Не удалось загрузить пользователей')
    return res.json()
}