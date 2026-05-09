import { useState, type ChangeEvent, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Building2, Check, AlertCircle, Loader2 } from 'lucide-react'
import { createOrganization, type OrganizationCreateRequest } from '../api/organizations'

// Вспомогательная функция для маски телефона
const formatPhone = (value: string): string => {
    const digits = value.replace(/\D/g, '')
    if (!digits) return ''
    const clean = digits.replace(/^7|^8/, '')
    let formatted = '+7'
    if (clean.length > 0) formatted += ` (${clean.slice(0, 3)}`
    if (clean.length >= 3) formatted += ')'
    if (clean.length > 3) formatted += ` ${clean.slice(3, 6)}`
    if (clean.length > 6) formatted += `-${clean.slice(6, 8)}`
    if (clean.length > 8) formatted += `-${clean.slice(8, 10)}`
    return formatted
}

type FormErrors = Partial<Record<keyof OrganizationCreateRequest, string>>

export default function CreateOrganizationPage() {
    const navigate = useNavigate()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const [formData, setFormData] = useState<OrganizationCreateRequest>({
        name: '',
        address: '',
        phoneNumber: '',
        contactPerson: '', // 👈 Новое поле
    })

    const [errors, setErrors] = useState<FormErrors>({})

    const validate = (): boolean => {
        const newErrors: FormErrors = {}

        if (!formData.name.trim()) {
            newErrors.name = 'Название организации обязательно'
        } else if (formData.name.length < 3) {
            newErrors.name = 'Минимум 3 символа'
        }

        if (!formData.contactPerson.trim()) { // 👈 Валидация контактного лица
            newErrors.contactPerson = 'Контактное лицо обязательно'
        }

        if (!formData.address.trim()) {
            newErrors.address = 'Адрес обязателен'
        }

        const phoneDigits = formData.phoneNumber.replace(/\D/g, '')
        if (!phoneDigits) {
            newErrors.phoneNumber = 'Номер телефона обязателен'
        } else if (phoneDigits.length < 11) {
            newErrors.phoneNumber = 'Номер телефона неполный'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleChange = (field: keyof OrganizationCreateRequest) => (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        setFormData((prev: OrganizationCreateRequest) => ({ ...prev, [field]: e.target.value }))
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: undefined }))
        }
        if (error) setError(null)
    }

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatPhone(e.target.value)
        setFormData((prev: OrganizationCreateRequest) => ({ ...prev, phoneNumber: formatted }))
        if (errors.phoneNumber) {
            setErrors(prev => ({ ...prev, phoneNumber: undefined }))
        }
        if (error) setError(null)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!validate()) return

        setIsLoading(true)
        setError(null)

        try {
            await createOrganization(formData)
            setSuccess(true)
            setTimeout(() => {
                navigate('/organizations')
            }, 1500)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ошибка при создании организации')
        } finally {
            setIsLoading(false)
        }
    }

    if (success) {
        return (
            <div className="page">
                <div className="container">
                    <div className="form-success">
                        <Check size={48} className="success-icon" />
                        <h2>Организация создана</h2>
                        <p>Перенаправляем на страничку организаций...</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="page">
            <div className="container">
                <button type="button" className="back-btn" onClick={() => navigate('/organizations')}>
                    <ArrowLeft size={16} />
                    <span>Назад</span>
                </button>

                <div className="page-header animate-fade-in">
                    <div className="header-title-block">
                        <h1 className="page-title">Новая организация</h1>
                        <p className="page-subtitle">
                            Заполните данные для регистрации организации в системе
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="form-card animate-fade-in-delay">
                    {error && (
                        <div className="form-error">
                            <AlertCircle size={16} />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="form-group">
                        <label className="form-label">
                            Название организации <span className="required">*</span>
                        </label>
                        <input
                            type="text"
                            className={`form-input ${errors.name ? 'error' : ''}`}
                            value={formData.name}
                            onChange={handleChange('name')}
                            placeholder="Введите название организации"
                            disabled={isLoading}
                        />
                        {errors.name && <span className="form-error-text">{errors.name}</span>}
                    </div>

                    {/* 👈 Новое поле: Контактное лицо */}
                    <div className="form-group">
                        <label className="form-label">
                            Контактное лицо <span className="required">*</span>
                        </label>
                        <input
                            type="text"
                            className={`form-input ${errors.contactPerson ? 'error' : ''}`}
                            value={formData.contactPerson}
                            onChange={handleChange('contactPerson')}
                            placeholder="Фамилия Имя Отчество"
                            disabled={isLoading}
                        />
                        {errors.contactPerson && <span className="form-error-text">{errors.contactPerson}</span>}
                    </div>

                    <div className="form-group">
                        <label className="form-label">
                            Юридический адрес <span className="required">*</span>
                        </label>
                        <textarea
                            className={`form-input ${errors.address ? 'error' : ''}`}
                            value={formData.address}
                            onChange={handleChange('address')}
                            placeholder="Полный юридический адрес"
                            rows={3}
                            disabled={isLoading}
                        />
                        {errors.address && <span className="form-error-text">{errors.address}</span>}
                    </div>

                    <div className="form-group">
                        <label className="form-label">
                            Контактный телефон <span className="required">*</span>
                        </label>
                        <input
                            type="tel"
                            className={`form-input ${errors.phoneNumber ? 'error' : ''}`}
                            value={formData.phoneNumber}
                            onChange={handlePhoneChange}
                            placeholder="+7 (___) ___-__-__"
                            maxLength={18}
                            disabled={isLoading}
                        />
                        {errors.phoneNumber && <span className="form-error-text">{errors.phoneNumber}</span>}
                    </div>

                    <div className="form-actions">
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => navigate('/organizations')}
                            disabled={isLoading}
                        >
                            Отмена
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 size={16} className="spinner" />
                                    Создание...
                                </>
                            ) : (
                                <>
                                    <Building2 size={16} />
                                    Создать организацию
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}