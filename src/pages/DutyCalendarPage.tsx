import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, User, Calendar as CalendarIcon, Loader2, AlertCircle } from 'lucide-react'
import { fetchCalendarMonth, type CalendarDay } from '../api/calendar'

const MONTHS = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
]

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

export default function DutyCalendarPage() {
    const navigate = useNavigate()
    const [year, setYear] = useState(new Date().getFullYear())
    const [month, setMonth] = useState(new Date().getMonth() + 1) // 1-12
    const [days, setDays] = useState<CalendarDay[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Загрузка данных при смене месяца/года
    useEffect(() => {
        setLoading(true)
        setError(null)
        fetchCalendarMonth(year, month)
            .then(setDays)
            .catch(err => setError(err.message))
            .finally(() => setLoading(false))
    }, [year, month])

    // Группировка дней по неделям для сетки календаря
    const weeks = useMemo(() => {
        if (!days.length) return []

        // Создаём сетку: добавляем пустые ячейки в начало, чтобы 1-е число попало на правильный день недели
        const firstDay = new Date(days[0].date)
        const startWeekday = firstDay.getDay() // 0=Вс, 1=Пн, ...
        const paddingDays = startWeekday === 0 ? 6 : startWeekday - 1 // сдвиг для Пн-Вс

        const allCells: (CalendarDay | null)[] = []

        // Пустые ячейки до первого дня месяца
        for (let i = 0; i < paddingDays; i++) {
            allCells.push(null)
        }

        // Дни месяца
        days.forEach(d => allCells.push(d))

        // Разбиваем на недели по 7 дней
        const result: (CalendarDay | null)[][] = []
        for (let i = 0; i < allCells.length; i += 7) {
            result.push(allCells.slice(i, i + 7))
        }

        return result
    }, [days])

    const handlePrevMonth = () => {
        if (month === 1) {
            setMonth(12)
            setYear(y => y - 1)
        } else {
            setMonth(m => m - 1)
        }
    }

    const handleNextMonth = () => {
        if (month === 12) {
            setMonth(1)
            setYear(y => y + 1)
        } else {
            setMonth(m => m + 1)
        }
    }

    if (loading && days.length === 0) {
        return (
            <div className="page">
                <div className="container">
                    <div className="calendar-loading">
                        <Loader2 size={32} className="spinner" />
                        <span>Загрузка календаря...</span>
                    </div>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="page">
                <div className="container">
                    <div className="calendar-error">
                        <AlertCircle size={24} />
                        <span>{error}</span>
                        <button className="btn btn-primary" onClick={() => fetchCalendarMonth(year, month).then(setDays).catch(e => setError(e.message))}>
                            Повторить
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="page">
            <div className="container">
                {/* Header */}
                <div className="calendar-header">
                    <button type="button" className="back-btn" onClick={() => navigate('/')}>
                        <ChevronLeft size={16} /> <span>На главную</span>
                    </button>

                    <div className="calendar-title">
                        <CalendarIcon size={24} />
                        <h1>Календарь дежурств</h1>
                    </div>

                    <div className="calendar-navigation">
                        <button className="nav-btn" onClick={handlePrevMonth} title="Предыдущий месяц">
                            <ChevronLeft size={20} />
                        </button>

                        <select
                            className="month-select"
                            value={month}
                            onChange={e => setMonth(Number(e.target.value))}
                        >
                            {MONTHS.map((m, i) => (
                                <option key={i} value={i + 1}>{m}</option>
                            ))}
                        </select>

                        <select
                            className="year-select"
                            value={year}
                            onChange={e => setYear(Number(e.target.value))}
                        >
                            {Array.from({ length: 10 }, (_, i) => year - 5 + i).map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>

                        <button className="nav-btn" onClick={handleNextMonth} title="Следующий месяц">
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>

                {/* Calendar Grid */}
                <div className="calendar-grid">
                    {/* Weekday headers */}
                    {WEEKDAYS.map(day => (
                        <div key={day} className="calendar-weekday">{day}</div>
                    ))}

                    {/* Days */}
                    {weeks.map((week, weekIdx) => (
                        <div key={weekIdx} className="calendar-week">
                            {week.map((day, dayIdx) => (
                                <div
                                    key={dayIdx}
                                    className={`calendar-day ${!day ? 'empty' : ''} ${day?.workingDay ? 'working' : 'weekend'} ${day?.employee ? 'has-duty' : ''}`}
                                >
                                    {day ? (
                                        <>
                                            <span className="day-number">{new Date(day.date).getDate()}</span>
                                            {day.employee ? (
                                                <div className="duty-info">
                                                    <User size={12} />
                                                    <span className="duty-name" title={day.employee.fullName}>
                            {day.employee.fullName.split(' ')[0]}
                          </span>
                                                </div>
                                            ) : (
                                                <span className="no-duty">—</span>
                                            )}
                                        </>
                                    ) : (
                                        <span className="empty-cell" />
                                    )}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>

                {/* Legend */}
                <div className="calendar-legend">
                    <div className="legend-item"><span className="legend-dot working" />Рабочий день</div>
                    <div className="legend-item"><span className="legend-dot weekend" />Выходной</div>
                    <div className="legend-item"><span className="legend-dot has-duty" />Есть дежурный</div>
                </div>
            </div>
        </div>
    )
}