import { getApiUrl } from './config'


export interface CalendarDay {
    id: string
    date: string
    dayOfWeek: string
    workingDay: boolean
    fullName: string | null
    employeeId: string | null  // ✅ Добавили
}

export async function assignDuty(dayId: string, employeeId: string | null): Promise<void> {
    // ✅ Если employeeId есть — добавляем параметр, если null — не добавляем вообще
    const param = employeeId ? `?employeeId=${employeeId}` : ''

    const res = await fetch(`${getApiUrl(`/calendar/days/${dayId}`)}${param}`, {
        method: 'PATCH',
        // Тело не передаём — всё в URL
    })

    if (!res.ok) {
        const err = await res.text().catch(() => 'Ошибка назначения')
        throw new Error(err)
    }
}
export interface ManagerSummary {
    id: string
    name: string
    surname: string
    patronymic: string
}

export async function fetchCalendarMonth(year: number, month: number): Promise<CalendarDay[]> {
    const url = `${getApiUrl('/calendar/month')}?year=${year}&month=${month}`
    const res = await fetch(url)
    if (!res.ok) throw new Error(await res.text().catch(() => 'Ошибка загрузки календаря'))
    return res.json()
}

export async function fetchManagers(): Promise<ManagerSummary[]> {
    const res = await fetch(getApiUrl('/users/manager'))
    if (!res.ok) throw new Error('Не удалось загрузить список менеджеров')
    return res.json()
}