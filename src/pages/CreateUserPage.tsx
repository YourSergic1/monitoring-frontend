import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Loader2, AlertCircle, CheckCircle2, UserPlus, Shield } from 'lucide-react'
import { fetchUserRoles, createUser, type RoleResponse, type CreateUserDTO } from '../api/users'

// === Маска телефона +7 (XXX) XXX-XX-XX ===
const formatPhone = (value: string): string => {
    const digits = value.replace(/\D/g, '')
    if (!digits) return ''
    let result = '+7'
    if (digits.length > 1) result += ` (${digits.substring(1, 4)}`
    if (digits.length >= 4) result += `) ${digits.substring(4, 7)}`
    if (digits.length >= 7) result += `-${digits.substring(7, 9)}`
    if (digits.length >= 9) result += `-${digits.substring(9, 11)}`
    return result
}

export default function CreateUserPage() {
    const navigate = useNavigate()
    const [roles, setRoles] = useState<RoleResponse[]>([])
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const [form, setForm] = useState<CreateUserDTO>({
        name: '', surname: '', patronymic: '', email: '', phone: '', role: ''
    })

    useEffect(() => {
        fetchUserRoles()
            .then(setRoles)
            .catch(err => setError(err.message))
            .finally(() => setLoading(false))
    }, [])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    }

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/\D/g, '')
        setForm(prev => ({ ...prev, phone: formatPhone(raw) }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        if (!form.surname.trim() || !form.name.trim()) {
            setError('Укажите Фамилию и Имя')
            return
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
            setError('Введите корректный Email')
            return
        }
        if (form.phone.replace(/\D/g, '').length < 11) {
            setError('Введите полный номер телефона')
            return
        }
        if (!form.role) {
            setError('Выберите роль пользователя')
            return
        }

        setSubmitting(true)
        try {
            await createUser(form)
            setSuccess(true)
            setTimeout(() => navigate('/users'), 2000)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Не удалось создать пользователя')
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className="page">
                <div className="container">
                    <div className="metrics-loading"><Loader2 size={32} className="spinner" /><span>Загрузка ролей...</span></div>
                </div>
            </div>
        )
    }

    if (success) {
        return (
            <div className="page">
                <div className="container">
                    <div className="form-success">
                        <CheckCircle2 size={48} className="success-icon" />
                        <h2>Пользователь создан!</h2>
                        <p>Учетные данные сгенерированы и отправлены на почту.</p>
                        <button className="btn btn-primary" onClick={() => navigate('/users')}>К списку пользователей</button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="page">
            <div className="container">
                <button type="button" className="back-btn" onClick={() => navigate(-1)}>
                    <ArrowLeft size={16} /> <span>К пользователям</span>
                </button>

                <div className="form-card">
                    <div className="form-header" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                        <UserPlus size={24} className="logo-icon" />
                        <div>
                            <h2 className="form-title" style={{ margin: 0 }}>Новый пользователь</h2>
                            <p className="text-muted" style={{ margin: '4px 0 0', fontSize: '0.9rem' }}>Заполните данные для генерации учетной записи</p>
                        </div>
                    </div>

                    {error && (
                        <div className="form-error">
                            <AlertCircle size={16} /> <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {/* ФИО */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                            <div className="form-group">
                                <label className="form-label">Фамилия <span className="required">*</span></label>
                                <input className="form-input" name="surname" value={form.surname} onChange={handleChange} placeholder="Иванов" required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Имя <span className="required">*</span></label>
                                <input className="form-input" name="name" value={form.name} onChange={handleChange} placeholder="Иван" required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Отчество</label>
                                <input className="form-input" name="patronymic" value={form.patronymic} onChange={handleChange} placeholder="Иванович" />
                            </div>
                        </div>

                        {/* Контакты */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                            <div className="form-group">
                                <label className="form-label">Email <span className="required">*</span></label>
                                <input className="form-input" name="email" type="email" value={form.email} onChange={handleChange} placeholder="ivanov@company.ru" required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Телефон <span className="required">*</span></label>
                                <input className="form-input" name="phone" value={form.phone} onChange={handlePhoneChange} placeholder="+7 (___) ___-__-__" maxLength={18} required />
                            </div>
                        </div>

                        {/* Роль */}
                        <div className="form-group">
                            <label className="form-label">Роль доступа <span className="required">*</span></label>
                            <select className="form-input" name="role" value={form.role} onChange={handleChange} required>
                                <option value="" disabled>Выберите роль...</option>
                                {roles.map(r => (
                                    <option key={r.role} value={r.role}>{r.displayName}</option>
                                ))}
                            </select>
                        </div>

                        {/* Действия */}
                        <div className="form-actions">
                            <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)} disabled={submitting}>Отмена</button>
                            <button type="submit" className="btn btn-primary" disabled={submitting}>
                                {submitting ? <Loader2 size={18} className="spinner" /> : <><Shield size={16} /> Создать пользователя</>}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}