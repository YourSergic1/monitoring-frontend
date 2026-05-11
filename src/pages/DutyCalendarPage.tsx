import { useEffect, useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, User, Calendar as CalendarIcon, Loader2, AlertCircle, X, Check, Trash2 } from 'lucide-react'
import { fetchCalendarMonth, fetchManagers, assignDuty, type CalendarDay, type ManagerSummary } from '../api/calendar'

const MONTHS = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']
const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

export default function DutyCalendarPage() {
    const [year, setYear] = useState(new Date().getFullYear())
    const [month, setMonth] = useState(new Date().getMonth() + 1)
    const [days, setDays] = useState<CalendarDay[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Модалка назначения
    const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null)
    const [managers, setManagers] = useState<ManagerSummary[]>([])
    const [selectedManagerId, setSelectedManagerId] = useState<string | null>(null)
    const [assigning, setAssigning] = useState(false)
    const [assignError, setAssignError] = useState<string | null>(null)

    // Загрузка календаря
    const loadCalendar = useMemo(() => async (y: number, m: number) => {
        setLoading(true); setError(null)
        try {
            const data = await fetchCalendarMonth(y, m)
            setDays(data)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ошибка')
        } finally { setLoading(false) }
    }, [])

    useEffect(() => { loadCalendar(year, month) }, [year, month, loadCalendar])

    // Загрузка менеджеров при открытии модалки
    useEffect(() => {
        if (selectedDay && managers.length === 0) {
            fetchManagers().then(setManagers).catch(() => setManagers([]))
        }
    }, [selectedDay])

    // Обработчики навигации
    const handlePrev = () => month === 1 ? (setMonth(12), setYear(y => y - 1)) : setMonth(m => m - 1)
    const handleNext = () => month === 12 ? (setMonth(1), setYear(y => y + 1)) : setMonth(m => m + 1)

    // ✅ Открытие модалки — используем employeeId (плоская структура)
    const openAssignModal = (day: CalendarDay) => {
        const today = new Date(); today.setHours(0,0,0,0)
        const dayDate = new Date(day.date); dayDate.setHours(0,0,0,0)
        if (dayDate < today) {
            setAssignError('Нельзя изменить прошедшие даты')
            setTimeout(() => setAssignError(null), 3000)
            return
        }
        setSelectedDay(day)
        setSelectedManagerId(day.employeeId || null) // ✅ Было: day.employee?.id
        setAssignError(null)
    }

    // Назначение / Снятие
    const handleAssign = async () => {
        if (!selectedDay) return
        setAssigning(true); setAssignError(null)
        try {
            await assignDuty(selectedDay.id, selectedManagerId)
            await loadCalendar(year, month)
            setSelectedDay(null)
        } catch (err) {
            setAssignError(err instanceof Error ? err.message : 'Ошибка сохранения')
        } finally { setAssigning(false) }
    }

    // Группировка дней по неделям
    const weeks = useMemo(() => {
        if (!days.length) return []
        const firstDay = new Date(days[0].date)
        const startWeekday = firstDay.getDay()
        const padding = startWeekday === 0 ? 6 : startWeekday - 1

        const cells: (CalendarDay | null)[] = Array(padding).fill(null)
        days.forEach(d => cells.push(d))

        const result: (CalendarDay | null)[][] = []
        for (let i = 0; i < cells.length; i += 7) result.push(cells.slice(i, i + 7))
        return result
    }, [days])

    if (loading && days.length === 0) {
        return <div className="page"><div className="container"><div className="calendar-loading"><Loader2 size={32} className="spinner"/><span>Загрузка календаря...</span></div></div></div>
    }

    return (
        <div className="page">
            <div className="container">
                <div className="calendar-header">
                    <div className="calendar-title"><CalendarIcon size={24}/><h1>Календарь дежурств</h1></div>
                    <div className="calendar-navigation">
                        <button className="nav-btn" onClick={handlePrev}><ChevronLeft size={20}/></button>
                        <select className="month-select" value={month} onChange={e=>setMonth(Number(e.target.value))}>{MONTHS.map((m,i)=><option key={i} value={i+1}>{m}</option>)}</select>
                        <select className="year-select" value={year} onChange={e=>setYear(Number(e.target.value))}>{Array.from({length:10},(_,i)=>year-5+i).map(y=><option key={y} value={y}>{y}</option>)}</select>
                        <button className="nav-btn" onClick={handleNext}><ChevronRight size={20}/></button>
                    </div>
                </div>

                {error && <div className="date-error"><AlertCircle size={16}/> {error}</div>}
                {assignError && <div className="date-error"><AlertCircle size={16}/> {assignError}</div>}

                <div className="calendar-grid">
                    {WEEKDAYS.map(d => <div key={d} className="calendar-weekday">{d}</div>)}
                    {weeks.map((week, wi) => (
                        <div key={wi} className="calendar-week">
                            {week.map((day, di) => {
                                const isPast = day ? new Date(day.date) < new Date(new Date().toDateString()) : false
                                return (
                                    <div
                                        key={di}
                                        // ✅ Проверяем fullName для класса has-duty
                                        className={`calendar-day ${!day?'empty':''} ${day?.workingDay?'working':'weekend'} ${day?.fullName?'has-duty':''} ${isPast?'past':''}`}
                                        onClick={() => day && !isPast && openAssignModal(day)}
                                        title={isPast ? 'Прошедшие даты нельзя изменить' : day ? 'Нажмите для назначения дежурного' : ''}
                                    >
                                        {day ? (
                                            <>
                                                <span className="day-number">{new Date(day.date).getDate()}</span>
                                                {day.fullName ? (
                                                    <div className="duty-info">
                                                        <User size={12}/>
                                                        <span className="duty-name">{day.fullName.split(' ')[0]}</span>
                                                    </div>
                                                ) : <span className="no-duty">—</span>}
                                            </>
                                        ) : <span className="empty-cell"/>}
                                    </div>
                                )
                            })}
                        </div>
                    ))}
                </div>
            </div>

            {/* === МОДАЛКА НАЗНАЧЕНИЯ === */}
            {selectedDay && (
                <div className="modal-overlay" onClick={()=>!assigning && setSelectedDay(null)}>
                    <div className="modal-dialog" onClick={e=>e.stopPropagation()}>
                        <button className="modal-close" onClick={()=>!assigning && setSelectedDay(null)} disabled={assigning}><X size={18}/></button>

                        <div className="modal-icon" style={{background:'rgba(59,130,246,0.1)',color:'var(--color-accent)'}}>
                            <CalendarIcon size={28}/>
                        </div>
                        <h2 className="modal-title">
                            {new Date(selectedDay.date).toLocaleDateString('ru-RU',{weekday:'long',day:'numeric',month:'long'})}
                        </h2>
                        <p className="modal-text" style={{marginBottom:20}}>
                            {/* ✅ Используем fullName вместо employee.fullName */}
                            {selectedDay.fullName
                                ? `Текущий дежурный: ${selectedDay.fullName}. Выберите нового или снимите дежурство.`
                                : 'Назначьте менеджера на дежурство'}
                        </p>

                        <div className="form-group" style={{marginBottom:20}}>
                            <label className="form-label">Дежурный менеджер</label>
                            <select
                                className="form-input"
                                value={selectedManagerId || ''}
                                onChange={e=>setSelectedManagerId(e.target.value || null)}
                                disabled={assigning}
                            >
                                <option value="">— Не назначен —</option>
                                {managers.map(m => (
                                    <option key={m.id} value={m.id}>
                                        {m.surname} {m.name} {m.patronymic}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {assignError && <div className="modal-error"><AlertCircle size={16}/><span>{assignError}</span></div>}

                        <div className="modal-actions" style={{justifyContent:'space-between'}}>
                            {/* ✅ Кнопка "Снять" активна, если есть employeeId */}
                            <button
                                className="btn btn-secondary"
                                onClick={() => {
                                    // ✅ Передаём null напрямую, не ждём обновления стейта
                                    setAssigning(true)
                                    setAssignError(null)
                                    assignDuty(selectedDay!.id, null)
                                        .then(() => {
                                            loadCalendar(year, month)
                                            setSelectedDay(null)
                                        })
                                        .catch(err => setAssignError(err instanceof Error ? err.message : 'Ошибка'))
                                        .finally(() => setAssigning(false))
                                }}
                                disabled={assigning || !selectedDay?.employeeId}
                            >
                                <Trash2 size={16}/> Снять дежурного
                            </button>
                            <div style={{display:'flex',gap:10}}>
                                <button className="btn btn-secondary" onClick={()=>setSelectedDay(null)} disabled={assigning}>Отмена</button>
                                {/* ✅ Текст кнопки зависит от employeeId */}
                                <button className="btn btn-primary" onClick={handleAssign} disabled={assigning}>
                                    {assigning ? <Loader2 size={16} className="spinner"/> : <><Check size={16}/> {selectedDay.employeeId ? 'Изменить' : 'Назначить'}</>}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}