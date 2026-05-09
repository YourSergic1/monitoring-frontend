import { useEffect, useState, type FormEvent, type ChangeEvent } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Building2, Loader2, AlertCircle, Check, MapPin, Phone, User } from 'lucide-react'
import { fetchOrganizationById, updateOrganization, type OrganizationCreateRequest } from '../api/organizations'

export default function OrganizationEditPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const [formData, setFormData] = useState<OrganizationCreateRequest>({
        name: '', address: '', phoneNumber: '', contactPerson: ''
    })
    const [errors, setErrors] = useState<Partial<Record<keyof OrganizationCreateRequest, string>>>({})

    // Загрузка текущих данных
    useEffect(() => {
        if (!id) return
        fetchOrganizationById(id)
            .then(data => {
                setFormData({
                    name: data.name,
                    address: data.address,
                    phoneNumber: data.phoneNumber,
                    contactPerson: data.contactPerson
                })
                setLoading(false)
            })
            .catch(() => {
                setError('Не удалось загрузить данные организации')
                setLoading(false)
            })
    }, [id])

    // Валидация: хотя бы 1 поле должно быть заполнено
    const validate = (): boolean => {
        const hasAnyField = Object.values(formData).some(v => v.trim().length > 0)
        if (!hasAnyField) {
            setError('Заполните хотя бы одно поле для обновления')
            return false
        }
        setError(null)
        return true
    }

    // Обработчики полей
    const handleChange = (field: keyof OrganizationCreateRequest) => (
        e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        setFormData(prev => ({ ...prev, [field]: e.target.value }))
        if (error) setError(null)
    }

    // Маска телефона (та же, что в CreateOrganizationPage)
    const handlePhoneChange = (e: ChangeEvent<HTMLInputElement>) => {
        const input = e.target
        const cursorPos = input.selectionStart ?? 0
        const rawValue = input.value

        let digits = rawValue.replace(/\D/g, '')
        if (digits.length === 0) digits = '7'
        if (digits[0] !== '7') digits = '7' + digits.slice(1)
        digits = digits.slice(0, 11)

        let formatted = '+7'
        if (digits.length > 1) formatted += ` (${digits.slice(1, 4)}`
        if (digits.length >= 4) formatted += ')'
        if (digits.length > 4) formatted += ` ${digits.slice(4, 7)}`
        if (digits.length > 7) formatted += `-${digits.slice(7, 9)}`
        if (digits.length > 9) formatted += `-${digits.slice(9, 11)}`

        let digitsBeforeCursor = 0
        for (let i = 0; i < cursorPos && i < rawValue.length; i++) {
            if (/\d/.test(rawValue[i])) digitsBeforeCursor++
        }

        let newCursorPos = 0
        let count = 0
        for (let i = 0; i < formatted.length; i++) {
            if (/\d/.test(formatted[i])) {
                count++
                if (count === digitsBeforeCursor) { newCursorPos = i + 1; break }
            }
        }
        if (count < digitsBeforeCursor) newCursorPos = formatted.length
        if (newCursorPos > 2 && [' ', '(', ')', '-'].includes(formatted[newCursorPos - 1])) newCursorPos--
        if (newCursorPos < 2) newCursorPos = 2

        setFormData(prev => ({ ...prev, phoneNumber: formatted }))

        requestAnimationFrame(() => {
            if (document.activeElement === input) input.setSelectionRange(newCursorPos, newCursorPos)
        })
    }

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        if (!validate() || !id) return

        setSaving(true)
        try {
            await updateOrganization(id, formData)
            setSuccess(true)
            setTimeout(() => navigate(`/organizations/details/${id}`, { replace: true }), 1200)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ошибка при сохранении')
            setSaving(false)
        }
    }

    if (loading) {
        return <div className="page"><div className="container"><div className="details-loading"><Loader2 size={28} className="spinner" /><span>Загрузка данных...</span></div></div></div>
    }

    if (success) {
        return (
            <div className="page"><div className="container"><div className="form-success animate-fade-in">
                <Check size={48} className="success-icon" /><h2>Изменения сохранены</h2><p>Возвращаемся к карточке организации...</p>
            </div></div></div>
        )
    }

    return (
        <div className="page">
            <div className="container">
                <button type="button" className="back-btn" onClick={() => navigate(-1)}>
                    <ArrowLeft size={16} /> <span>Назад</span>
                </button>

                <div className="page-header animate-fade-in">
                    <div className="header-title-block">
                        <h1 className="page-title">Редактирование организации</h1>
                        <p className="page-subtitle">Измените необходимые поля и сохраните</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="form-card animate-fade-in-delay">
                    {error && <div className="form-error"><AlertCircle size={16} /><span>{error}</span></div>}

                    <div className="form-group">
                        <label className="form-label">Название организации</label>
                        <input type="text" className="form-input" value={formData.name} onChange={handleChange('name')} placeholder="ООО Компания" />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Контактное лицо</label>
                        <input type="text" className="form-input" value={formData.contactPerson} onChange={handleChange('contactPerson')} placeholder="Иванов Иван Иванович" />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Юридический адрес</label>
                        <textarea className="form-input" value={formData.address} onChange={handleChange('address')} placeholder="г. Москва, ул. Примерная, д.1" rows={3} />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Контактный телефон</label>
                        <input type="tel" inputMode="numeric" className="form-input" value={formData.phoneNumber} onChange={handlePhoneChange} placeholder="+7 (___) ___-__-__" />
                    </div>

                    <div className="form-actions">
                        <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)} disabled={saving}>Отмена</button>
                        <button type="submit" className="btn btn-primary" disabled={saving}>
                            {saving ? <><Loader2 size={16} className="spinner" /> Сохранение...</> : <>Сохранить изменения</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}