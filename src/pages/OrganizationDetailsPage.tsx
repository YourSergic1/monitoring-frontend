import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Building2, Loader2, AlertCircle, MapPin, Phone, User, Fingerprint, Trash2, X, Pencil } from 'lucide-react'
import { fetchOrganizationById, deleteOrganizationById, type OrganizationResponse } from '../api/organizations'

export default function OrganizationDetailsPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const [org, setOrg] = useState<OrganizationResponse | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Состояния для удаления
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [deleteError, setDeleteError] = useState<string | null>(null)

    useEffect(() => {
        if (!id) return
        let mounted = true

        const load = async () => {
            try {
                setLoading(true)
                const data = await fetchOrganizationById(id)
                if (mounted) { setOrg(data); setError(null) }
            } catch (err) {
                if (mounted) {
                    console.error('❌ Ошибка загрузки:', err)
                    setError(err instanceof Error ? err.message : 'Не удалось загрузить организацию')
                }
            } finally {
                if (mounted) setLoading(false)
            }
        }

        load()
        return () => { mounted = false }
    }, [id])

    const handleDelete = async () => {
        if (!id) return
        setIsDeleting(true)
        setDeleteError(null)
        try {
            await deleteOrganizationById(id)
            navigate('/organizations/list', { replace: true })
        } catch (err) {
            setDeleteError(err instanceof Error ? err.message : 'Ошибка при удалении')
            setIsDeleting(false)
        }
    }

    if (loading) {
        return (
            <div className="page">
                <div className="container">
                    <div className="details-loading">
                        <Loader2 size={28} className="spinner" />
                        <span>Загрузка данных...</span>
                    </div>
                </div>
            </div>
        )
    }

    if (error || !org) {
        return (
            <div className="page">
                <div className="container">
                    <button type="button" className="back-btn" onClick={() => navigate(-1)}>
                        <ArrowLeft size={16} /> <span>Назад</span>
                    </button>
                    <div className="details-error">
                        <AlertCircle size={20} />
                        <span>{error || 'Организация не найдена'}</span>
                        <button className="btn btn-secondary" onClick={() => navigate('/organizations/list')}>
                            Вернуться к списку
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="page">
            <div className="container">
                <button type="button" className="back-btn" onClick={() => navigate(-1)}>
                    <ArrowLeft size={16} /> <span>Назад</span>
                </button>

                <div className="details-card animate-fade-in">
                    <div className="details-header">
                        <Building2 size={32} className="details-icon" />
                        <h1 className="details-title">{org.name}</h1>
                    </div>

                    <div className="details-grid">
                        <div className="detail-row">
                            <User size={18} className="detail-icon" />
                            <div>
                                <span className="detail-label">Контактное лицо</span>
                                <span className="detail-value">{org.contactPerson}</span>
                            </div>
                        </div>

                        <div className="detail-row">
                            <MapPin size={18} className="detail-icon" />
                            <div>
                                <span className="detail-label">Юридический адрес</span>
                                <span className="detail-value">{org.address}</span>
                            </div>
                        </div>

                        <div className="detail-row">
                            <Phone size={18} className="detail-icon" />
                            <div>
                                <span className="detail-label">Контактный телефон</span>
                                <span className="detail-value">{org.phoneNumber}</span>
                            </div>
                        </div>

                        <div className="detail-row">
                            <Fingerprint size={18} className="detail-icon" />
                            <div>
                                <span className="detail-label">Системный UUID</span>
                                <span className="detail-value mono">{org.id}</span>
                            </div>
                        </div>
                    </div>


                    <div className="details-divider"></div>
                    <div className="details-actions">
                        <button className="action-btn edit" onClick={() => navigate(`/organizations/edit/${org.id}`)}>
                            <Pencil size={16} /> <span>Изменить</span>
                        </button>
                        <button className="action-btn delete" onClick={() => setShowDeleteModal(true)}>
                            <Trash2 size={16} /> <span>Удалить организацию</span>
                        </button>
                    </div>
                </div>

                {showDeleteModal && (
                    <div className="modal-overlay" onClick={() => !isDeleting && setShowDeleteModal(false)}>
                        <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
                            <button
                                className="modal-close"
                                onClick={() => !isDeleting && setShowDeleteModal(false)}
                                disabled={isDeleting}
                            >
                                <X size={18} />
                            </button>

                            <div className="modal-icon danger">
                                <AlertCircle size={28} />
                            </div>
                            <h2 className="modal-title">Подтвердите удаление</h2>
                            <p className="modal-text">
                                Вы уверены, что хотите удалить организацию <strong>{org.name}</strong>?<br/>
                                Это действие нельзя отменить.
                            </p>

                            {deleteError && (
                                <div className="modal-error">
                                    <AlertCircle size={14} />
                                    <span>{deleteError}</span>
                                </div>
                            )}

                            <div className="modal-actions">
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => setShowDeleteModal(false)}
                                    disabled={isDeleting}
                                >
                                    Отмена
                                </button>
                                <button
                                    className="btn btn-danger"
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                >
                                    {isDeleting ? (
                                        <><Loader2 size={16} className="spinner" /> Удаление...</>
                                    ) : (
                                        <>Удалить</>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}