import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, User, Mail, Phone, Shield, Clock, Loader2, AlertCircle, Pencil, Trash2, X } from 'lucide-react'
import { fetchUserById, deleteUser, type UserResponse } from '../api/users'

export default function UserDetailsPage() {
    const { userId } = useParams<{ userId: string }>()
    const navigate = useNavigate()
    const [user, setUser] = useState<UserResponse | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Состояния для модалки удаления
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [deleteError, setDeleteError] = useState<string | null>(null)

    useEffect(() => {
        if (!userId) return
        fetchUserById(userId)
            .then(setUser)
            .catch(err => setError(err.message))
            .finally(() => setLoading(false))
    }, [userId])

    const handleDelete = async () => {
        if (!user) return
        setIsDeleting(true)
        setDeleteError(null)
        try {
            await deleteUser(user.id)
            setIsDeleteModalOpen(false)
            navigate('/users/list')
        } catch (err) {
            setDeleteError(err instanceof Error ? err.message : 'Не удалось удалить пользователя')
        } finally {
            setIsDeleting(false)
        }
    }

    if (loading) {
        return (
            <div className="page">
                <div className="container">
                    <div className="details-loading"><Loader2 size={24} className="spinner" /><span>Загрузка карточки...</span></div>
                </div>
            </div>
        )
    }

    if (error || !user) {
        return (
            <div className="page">
                <div className="container">
                    <button type="button" className="back-btn" onClick={() => navigate('/users/list')}>
                        <ArrowLeft size={16} /> <span>Назад</span>
                    </button>
                    <div className="details-error">
                        <AlertCircle size={20} />
                        <span>{error || 'Пользователь не найден'}</span>
                        <button className="btn btn-secondary" onClick={() => navigate('/users/list')}>К списку</button>
                    </div>
                </div>
            </div>
        )
    }

    const fullName = `${user.surname} ${user.name} ${user.patronymic}`.trim()

    return (
        <div className="page">
            <div className="container">
                <button type="button" className="back-btn" onClick={() => navigate('/users/list')}>
                    <ArrowLeft size={16} /> <span>К списку пользователей</span>
                </button>

                <div className="details-card">
                    <div className="details-header">
                        <div className="details-icon"><User size={24} /></div>
                        <div>
                            <h1 className="details-title">{fullName}</h1>
                            <span className="text-muted" style={{ fontSize: '0.9rem' }}>ID: {user.id}</span>
                        </div>
                    </div>

                    <div className="details-grid">
                        <div className="detail-row">
                            <Mail size={18} className="detail-icon" />
                            <div>
                                <span className="detail-label">Email</span>
                                <span className="detail-value mono">{user.email}</span>
                            </div>
                        </div>
                        <div className="detail-row">
                            <Phone size={18} className="detail-icon" />
                            <div>
                                <span className="detail-label">Телефон</span>
                                <span className="detail-value mono">{user.phone}</span>
                            </div>
                        </div>
                        <div className="detail-row">
                            <Shield size={18} className="detail-icon" />
                            <div>
                                <span className="detail-label">Роль</span>
                                <span className="detail-value">{user.role}</span>
                            </div>
                        </div>
                        <div className="detail-row">
                            <Clock size={18} className="detail-icon" />
                            <div>
                                <span className="detail-label">Дата создания</span>
                                <span className="detail-value">
                  {new Date(user.createdAt).toLocaleString('ru-RU', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })}
                </span>
                            </div>
                        </div>
                    </div>

                    <div className="details-divider" />

                    <div className="details-actions">
                        <button className="action-btn edit" onClick={() => navigate(`/users/${user.id}/edit`)}>
                            <Pencil size={16} /> Редактировать
                        </button>
                        <button className="action-btn delete" onClick={() => setIsDeleteModalOpen(true)}>
                            <Trash2 size={16} /> Удалить
                        </button>
                    </div>
                </div>
            </div>

            {/* === Модалка подтверждения удаления === */}
            {isDeleteModalOpen && (
                <div className="modal-overlay" onClick={() => !isDeleting && setIsDeleteModalOpen(false)}>
                    <div className="modal-dialog" onClick={e => e.stopPropagation()}>
                        <button
                            className="modal-close"
                            onClick={() => !isDeleting && setIsDeleteModalOpen(false)}
                            disabled={isDeleting}
                        >
                            <X size={18} />
                        </button>

                        <div className="modal-icon danger">
                            <Trash2 size={28} />
                        </div>
                        <h2 className="modal-title">Удалить пользователя?</h2>
                        <p className="modal-text">
                            Вы уверены, что хотите удалить <strong>{fullName}</strong>?<br/>
                            Это действие нельзя отменить, а все связанные данные будут потеряны.
                        </p>

                        {deleteError && (
                            <div className="modal-error">
                                <AlertCircle size={16} />
                                <span>{deleteError}</span>
                            </div>
                        )}

                        <div className="modal-actions">
                            <button
                                className="btn btn-secondary"
                                onClick={() => setIsDeleteModalOpen(false)}
                                disabled={isDeleting}
                            >
                                Отмена
                            </button>
                            <button
                                className="btn btn-danger"
                                onClick={handleDelete}
                                disabled={isDeleting}
                            >
                                {isDeleting ? <Loader2 size={16} className="spinner" /> : <Trash2 size={16} />}
                                {' '}Удалить
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}