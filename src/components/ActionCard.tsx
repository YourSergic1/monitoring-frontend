import { type LucideIcon } from 'lucide-react' // ← Добавлено ключевое слово 'type'

interface ActionCardProps {
    title: string
    description: string
    icon: LucideIcon
    onClick: () => void
    delay?: number
    variant?: 'primary' | 'secondary'
}

export default function ActionCard({
                                       title,
                                       description,
                                       icon: Icon,
                                       onClick,
                                       delay = 0,
                                       variant = 'primary'
                                   }: ActionCardProps) {
    return (
        <button className={`action-card action-card--${variant}`} onClick={onClick} style={{ animationDelay: `${delay}ms` }}>
            <div className="action-icon-wrapper">
                <Icon size={28} className="action-icon" />
            </div>
            <div className="action-content">
                <h3 className="action-title">{title}</h3>
                <p className="action-desc">{description}</p>
            </div>
            <span className="action-arrow">→</span>
        </button>
    )
}