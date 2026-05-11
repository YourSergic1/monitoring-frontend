import { getApiUrl } from './config'

export interface RoleResponse { role: string; displayName: string }
export interface CreateUserDTO { name: string; surname: string; patronymic: string; email: string; phone: string; role: string }
export interface UserResponse { id: string; name: string; surname: string; patronymic: string; email: string; phone: string; role: string; createdAt: string }

// ✅ Функция обновления (отправляем всё кроме email)
export async function updateUser(id: string, dto: Omit<CreateUserDTO, 'email'>): Promise<void> {
    const res = await fetch(getApiUrl(`/users/${id}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dto)
    })
    if (!res.ok) {
        const errText = await res.text().catch(() => 'Ошибка сервера')
        throw new Error(errText || `HTTP ${res.status}`)
    }
}

export interface RoleResponse { role: string; displayName: string }
export interface CreateUserDTO { name: string; surname: string; patronymic: string; email: string; phone: string; role: string }

export interface UserResponse {
    id: string
    name: string
    surname: string
    patronymic: string
    email: string
    phone: string
    role: string
    createdAt: string
}

export async function fetchUserRoles(): Promise<RoleResponse[]> {
    const res = await fetch(getApiUrl('/users/roles'))
    if (!res.ok) throw new Error('Не удалось загрузить список ролей')
    return res.json()
}

export async function createUser(dto: CreateUserDTO): Promise<void> {
    const res = await fetch(getApiUrl('/users'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dto)
    })
    if (!res.ok) throw new Error(await res.text().catch(() => 'Ошибка сервера'))
}

export async function fetchUsers(): Promise<{ id: string; name: string; surname: string; patronymic: string }[]> {
    const res = await fetch(getApiUrl('/users'))
    if (!res.ok) throw new Error('Не удалось загрузить пользователей')
    return res.json()
}

// ✅ Новое: получение данных пользователя по ID
export async function fetchUserById(id: string): Promise<UserResponse> {
    const res = await fetch(getApiUrl(`/users/${id}`))
    if (!res.ok) throw new Error('Не удалось загрузить данные пользователя')
    return res.json()
}

// ... предыдущие экспорты ...

export async function deleteUser(id: string): Promise<void> {
    const res = await fetch(getApiUrl(`/users/${id}`), {
        method: 'DELETE'
    })
    if (!res.ok) {
        const errText = await res.text().catch(() => 'Ошибка при удалении')
        throw new Error(errText || `HTTP ${res.status}`)
    }
}