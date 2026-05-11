import { getApiUrl } from './config'

export interface EmployeeBrief {
    id: string
    fullName: string
}

export interface CalendarDay {
    id: string
    date: string           // ISO: "2026-05-01"
    dayOfWeek: string      // "ПОНЕДЕЛЬНИК"
    workingDay: boolean
    employee: EmployeeBrief | null
}

export async function fetchCalendarMonth(
    year: number,
    month: number // 1-12
): Promise<CalendarDay[]> {
    const url = `${getApiUrl('/calendar/month')}?year=${year}&month=${month}`
    const response = await fetch(url)

    if (!response.ok) {
        const errText = await response.text().catch(() => 'Ошибка загрузки календаря')
        throw new Error(errText || `HTTP ${response.status}`)
    }

    return response.json()
}