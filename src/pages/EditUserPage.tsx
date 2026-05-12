import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Loader2, AlertCircle, CheckCircle2, User, Shield } from 'lucide-react'
import { fetchUserById, fetchUserRoles, updateUser, type UserResponse, type RoleResponse } from '../api/users'

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

export default function EditUserPage() {
    const { userId } = useParams<{ userId: string }>()
    const navigate = useNavigate()
    const [roles, setRoles] = useState<RoleResponse[]>([])
    const [initialUser, setInitialUser] = useState<UserResponse | null>(null)
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const [form, setForm] = useState({ name: '', surname: '', patronymic: '', phone: '', role: '' })

    useEffect(() => {
        if (!userId) return
        Promise.all([fetchUserById(userId), fetchUserRoles()])
            .then(([user, rolesData]) => {
                setInitialUser(user)
                setRoles(rolesData)

                // ✅ Надёжная установка роли: если бэк отдал ключ enum — используем его
                const roleValue = user.role && rolesData.some(r => r.role === user.role)
                    ? user.role
                    : ''

                setForm({
                    name: user.name,
                    surname: user.surname,
                    patronymic: user.patronymic,
                    phone: user.phone,
                    role: roleValue
                })
            })
            .catch(err => setError(err.message))
            .finally(() => setLoading(false))
    }, [userId])

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

        // 🔍 Отладка
        console.log('📤 Отправка формы (редактирование):', { role: form.role, roleType: typeof form.role })

        if (!form.surname.trim() || !form.name.trim()) { setError('Укажите Фамилию и Имя'); return }
        if (form.phone.replace(/\D/g, '').length < 11) { setError('Введите полный номер телефона'); return }
        if (!form.role) { setError('Выберите роль'); return }

        setSubmitting(true)
        try {
            await updateUser(userId!, {
                name: form.name,
                surname: form.surname,
                patronymic: form.patronymic,
                phone: form.phone,
                role: form.role as any
            })
            setSuccess(true)
            setTimeout(() => navigate(`/users/${userId}`), 1500)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Не удалось сохранить изменения')
        } finally {
            setSubmitting(false)
        }
    }

    // Пока грузятся роли — не рендерим форму, чтобы select не "сломался"
    if (loading || roles.length === 0) {
        return <div className="page"><div className="container"><div className="metrics-loading"><Loader2 size={32} className="spinner" /><span>Загрузка данных...</span></div></div></div>
    }

    if (error && !initialUser) {
        return <div className="page"><div className="container"><div className="list-error"><AlertCircle size={20}/><span>{error}</span><button className="btn btn-secondary" onClick={()=>navigate('/users/list')}>Назад</button></div></div></div>
    }

    if (success) {
        return <div className="page"><div className="container"><div className="form-success"><CheckCircle2 size={48} className="success-icon"/><h2>Данные обновлены!</h2><p>Информация пользователя успешно сохранена.</p><button className="btn btn-primary" onClick={()=>navigate(`/users/${userId}`)}>Вернуться к карточке</button></div></div></div>
    }

    return (
        <div className="page">
            <div className="container">
                <button type="button" className="back-btn" onClick={() => navigate(`/users/${userId}`)}>
                    <ArrowLeft size={16} /> <span>К карточке</span>
                </button>
                <div className="form-card">
                    <div className="form-header" style={{display:'flex', alignItems:'center', gap:'12px', marginBottom:'24px'}}>
                        <User size={24} className="logo-icon" />
                        <div>
                            <h2 className="form-title" style={{margin:0}}>Редактирование пользователя</h2>
                            <p className="text-muted" style={{margin:'4px 0 0', fontSize:'0.9rem'}}>Изменение основных данных и роли</p>
                        </div>
                    </div>
                    {error && <div className="form-error"><AlertCircle size={16}/> <span>{error}</span></div>}
                    <form onSubmit={handleSubmit} style={{display:'flex', flexDirection:'column', gap:'20px'}}>
                        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'16px'}}>
                            <div className="form-group"><label className="form-label">Фамилия <span className="required">*</span></label><input className="form-input" name="surname" value={form.surname} onChange={handleChange} required/></div>
                            <div className="form-group"><label className="form-label">Имя <span className="required">*</span></label><input className="form-input" name="name" value={form.name} onChange={handleChange} required/></div>
                            <div className="form-group"><label className="form-label">Отчество</label><input className="form-input" name="patronymic" value={form.patronymic} onChange={handleChange}/></div>
                        </div>
                        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(250px, 1fr))', gap:'16px'}}>
                            <div className="form-group"><label className="form-label">Email</label><input className="form-input" value={initialUser?.email || ''} disabled style={{opacity:0.7, cursor:'not-allowed'}}/></div>
                            <div className="form-group"><label className="form-label">Телефон <span className="required">*</span></label><input className="form-input" name="phone" value={form.phone} onChange={handlePhoneChange} placeholder="+7 (___) ___-__-__" maxLength={18} required/></div>
                        </div>

                        {/* Роль — с key для принудительного ре-рендера */}
                        <div className="form-group">
                            <label className="form-label">Роль доступа <span className="required">*</span></label>
                            <select
                                className="form-input"
                                name="role"
                                value={form.role}
                                onChange={handleChange}
                                required
                                key={`role-select-edit-${roles.length}-${initialUser?.role}`} // ✅ Ключ зависит от ролей и текущей роли пользователя
                            >
                                <option value="" disabled>— Выберите роль —</option>
                                {roles.map(r => (
                                    <option key={r.role} value={r.role}>{r.displayName}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-actions">
                            <button type="button" className="btn btn-secondary" onClick={() => navigate(`/users/${userId}`)} disabled={submitting}>Отмена</button>
                            <button type="submit" className="btn btn-primary" disabled={submitting}>
                                {submitting ? <Loader2 size={18} className="spinner"/> : <><Shield size={16}/> Сохранить</>}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}