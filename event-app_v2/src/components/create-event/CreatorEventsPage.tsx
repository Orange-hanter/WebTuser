import { FC, useState, useEffect, useCallback } from 'react';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Ban,
  MessageSquare,
  MapPin,
  Calendar,
  ChevronRight,
  RefreshCw,
  Plus,
  X
} from 'lucide-react';
import { LoadingSpinner } from '@/components/common';
import { 
  creatorService, 
  CreatorEvent, 
  BlockedEvent,
  CreatorEventsResponse,
  STATUS_LABELS,
  STATUS_COLORS,
  getEventTitle,
  EventStatus
} from '@/services/creatorService';
import './CreatorEventsPage.css';

type TabType = 'pending' | 'active' | 'rejected' | 'blocked';

interface CreatorEventsPageProps {
  onClose: () => void;
  onCreateNew: () => void;
}

const TAB_CONFIG: { id: TabType; label: string; icon: FC<{ size?: number }> }[] = [
  { id: 'pending', label: 'На проверке', icon: Clock },
  { id: 'active', label: 'Активные', icon: CheckCircle },
  { id: 'rejected', label: 'Отклонённые', icon: XCircle },
  { id: 'blocked', label: 'Заблокированные', icon: Ban },
];

export const CreatorEventsPage: FC<CreatorEventsPageProps> = ({ onClose, onCreateNew }) => {
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [eventsData, setEventsData] = useState<CreatorEventsResponse | null>(null);
  const [blockedEvents, setBlockedEvents] = useState<BlockedEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CreatorEvent | BlockedEvent | null>(null);
  const [showCommentsModal, setShowCommentsModal] = useState(false);

  const loadEvents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const [events, blocked] = await Promise.all([
        creatorService.getMyEvents(),
        creatorService.getBlockedEvents(),
      ]);
      setEventsData(events);
      setBlockedEvents(blocked);
    } catch (err) {
      console.error('Failed to load events:', err);
      setError('Не удалось загрузить события');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const getEventsForTab = (): (CreatorEvent | BlockedEvent)[] => {
    if (!eventsData) return [];
    
    switch (activeTab) {
      case 'pending':
        return eventsData.pending || [];
      case 'active':
        return eventsData.active || [];
      case 'rejected':
        return eventsData.rejected || [];
      case 'blocked':
        return blockedEvents;
      default:
        return [];
    }
  };

  const getTabCount = (tab: TabType): number => {
    if (!eventsData) return 0;
    switch (tab) {
      case 'pending': return eventsData.pending?.length || 0;
      case 'active': return eventsData.active?.length || 0;
      case 'rejected': return eventsData.rejected?.length || 0;
      case 'blocked': return blockedEvents.length;
      default: return 0;
    }
  };

  const handleEventClick = (event: CreatorEvent | BlockedEvent) => {
    setSelectedEvent(event);
    setShowCommentsModal(true);
  };

  const events = getEventsForTab();

  if (isLoading) {
    return (
      <div className="creator-events-page">
        <div className="creator-events-header">
          <h1>Мои мероприятия</h1>
          <button className="close-page-button" onClick={onClose}>
            <X size={24} />
          </button>
        </div>
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="creator-events-page">
        <div className="creator-events-header">
          <h1>Мои мероприятия</h1>
          <button className="close-page-button" onClick={onClose}>
            <X size={24} />
          </button>
        </div>
        <div className="creator-error-state">
          <AlertTriangle size={48} />
          <p>{error}</p>
          <button className="btn-retry" onClick={loadEvents}>
            <RefreshCw size={16} />
            Повторить
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="creator-events-page">
      <div className="creator-events-header">
        <h1>Мои мероприятия</h1>
        <button className="close-page-button" onClick={onClose}>
          <X size={24} />
        </button>
      </div>

      {/* Big Create Button */}
      <button className="btn-create-event-large" onClick={onCreateNew}>
        <div className="create-icon-wrapper">
          <Plus size={28} />
        </div>
        <div className="create-text">
          <span className="create-title">Создать мероприятие</span>
          <span className="create-subtitle">Новое событие для участников</span>
        </div>
        <ChevronRight size={24} className="create-arrow" />
      </button>

      {/* Tabs */}
      <div className="creator-tabs">
        {TAB_CONFIG.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`creator-tab ${activeTab === id ? 'active' : ''}`}
            onClick={() => setActiveTab(id)}
          >
            <Icon size={16} />
            <span>{label}</span>
            {getTabCount(id) > 0 && (
              <span className="tab-badge">{getTabCount(id)}</span>
            )}
          </button>
        ))}
      </div>

      {/* Events List */}
      <div className="creator-events-list">
        {events.length === 0 ? (
          <div className="creator-empty-state">
            {activeTab === 'pending' && (
              <>
                <Clock size={48} />
                <h3>Нет событий на проверке</h3>
                <p>Создайте новое мероприятие, и оно появится здесь</p>
              </>
            )}
            {activeTab === 'active' && (
              <>
                <CheckCircle size={48} />
                <h3>Нет активных событий</h3>
                <p>Одобренные события будут отображаться здесь</p>
              </>
            )}
            {activeTab === 'rejected' && (
              <>
                <XCircle size={48} />
                <h3>Нет отклонённых событий</h3>
                <p>Отлично! Все ваши события прошли модерацию</p>
              </>
            )}
            {activeTab === 'blocked' && (
              <>
                <Ban size={48} />
                <h3>Нет заблокированных событий</h3>
                <p>У вас нет заблокированных мероприятий</p>
              </>
            )}
          </div>
        ) : (
          events.map((event) => (
            <CreatorEventCard
              key={event.id}
              event={event}
              onClick={() => handleEventClick(event)}
            />
          ))
        )}
      </div>

      {/* Comments Modal */}
      {showCommentsModal && selectedEvent && (
        <CommentsModal
          event={selectedEvent}
          onClose={() => {
            setShowCommentsModal(false);
            setSelectedEvent(null);
          }}
        />
      )}
    </div>
  );
};

// Компонент карточки события
interface CreatorEventCardProps {
  event: CreatorEvent | BlockedEvent;
  onClick: () => void;
}

const CreatorEventCard: FC<CreatorEventCardProps> = ({ event, onClick }) => {
  const title = getEventTitle(event);
  const status = event.status as EventStatus;
  const colors = STATUS_COLORS[status] || STATUS_COLORS.pending;
  const statusLabel = STATUS_LABELS[status] || status;
  
  const isBlocked = 'blockReason' in event;
  const needsAttention = status === 'needs_revision' || status === 'rejected';

  return (
    <div 
      className={`creator-event-card ${needsAttention ? 'needs-attention' : ''}`}
      onClick={onClick}
    >
      <div className="creator-card-header">
        <div className="creator-card-title-row">
          <h3 className="creator-card-title">{title}</h3>
          <span className="creator-card-type">{event.type}</span>
        </div>
        <div 
          className="creator-status-badge"
          style={{ 
            backgroundColor: colors.bg, 
            color: colors.text 
          }}
        >
          <span 
            className="status-dot" 
            style={{ backgroundColor: colors.dot }}
          />
          {statusLabel}
        </div>
      </div>

      <div className="creator-card-meta">
        <div className="meta-item">
          <Calendar size={14} />
          <span>
            {new Date(event.startTime).toLocaleDateString('ru-RU', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            })}
          </span>
        </div>
        <div className="meta-item">
          <Clock size={14} />
          <span>
            {new Date(event.startTime).toLocaleTimeString('ru-RU', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
        </div>
        <div className="meta-item">
          <MapPin size={14} />
          <span>{event.place}</span>
        </div>
      </div>

      {/* Review Comment Preview */}
      {event.reviewComment && (
        <div className="creator-card-comment">
          <MessageSquare size={14} />
          <span>{event.reviewComment}</span>
        </div>
      )}

      {/* Block Reason */}
      {isBlocked && (event as BlockedEvent).blockReason && (
        <div className="creator-card-block-reason">
          <Ban size={14} />
          <span>{(event as BlockedEvent).blockReason}</span>
        </div>
      )}

      <div className="creator-card-footer">
        <span className="view-details">
          Подробнее
          <ChevronRight size={16} />
        </span>
      </div>
    </div>
  );
};

// Модальное окно с комментариями
interface CommentsModalProps {
  event: CreatorEvent | BlockedEvent;
  onClose: () => void;
}

import { ReviewComment } from '@/services/creatorService';

const CommentsModal: FC<CommentsModalProps> = ({ event, onClose }) => {
  const [comments, setComments] = useState<ReviewComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const title = getEventTitle(event);
  const status = event.status as EventStatus;
  const colors = STATUS_COLORS[status] || STATUS_COLORS.pending;
  const statusLabel = STATUS_LABELS[status] || status;

  useEffect(() => {
    loadComments();
  }, [event.id]);

  const loadComments = async () => {
    setIsLoading(true);
    try {
      const data = await creatorService.getEventComments(event.id);
      setComments(data);
    } catch (err) {
      console.error('Failed to load comments:', err);
      setError('Не удалось загрузить комментарии');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!newComment.trim()) return;
    
    setIsSending(true);
    try {
      await creatorService.addComment(event.id, newComment.trim());
      setNewComment('');
      await loadComments();
    } catch (err) {
      console.error('Failed to send comment:', err);
      setError('Не удалось отправить комментарий');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="comments-modal-overlay" onClick={onClose}>
      <div className="comments-modal" onClick={(e) => e.stopPropagation()}>
        <div className="comments-modal-header">
          <div>
            <h2>{title}</h2>
            <div 
              className="creator-status-badge small"
              style={{ backgroundColor: colors.bg, color: colors.text }}
            >
              <span className="status-dot" style={{ backgroundColor: colors.dot }} />
              {statusLabel}
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="comments-modal-info">
          <div className="info-row">
            <Calendar size={16} />
            <span>
              {new Date(event.startTime).toLocaleDateString('ru-RU', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </span>
          </div>
          <div className="info-row">
            <MapPin size={16} />
            <span>{event.place}</span>
          </div>
        </div>

        {/* Current review comment */}
        {event.reviewComment && (
          <div className="current-review-comment">
            <h4>Комментарий модератора</h4>
            <p>{event.reviewComment}</p>
          </div>
        )}

        {/* Block reason if blocked */}
        {'blockReason' in event && event.blockReason && (
          <div className="block-reason-box">
            <h4><Ban size={16} /> Причина блокировки</h4>
            <p>{event.blockReason}</p>
          </div>
        )}

        <div className="comments-section">
          <h4>История комментариев</h4>
          
          {isLoading ? (
            <div className="comments-loading">
              <LoadingSpinner />
            </div>
          ) : error ? (
            <div className="comments-error">{error}</div>
          ) : comments.length === 0 ? (
            <div className="comments-empty">
              <MessageSquare size={32} />
              <p>Комментариев пока нет</p>
            </div>
          ) : (
            <div className="comments-list">
              {comments.map((comment) => (
                <div 
                  key={comment.id} 
                  className={`comment-item ${comment.authorRole}`}
                >
                  <div className="comment-header">
                    <span className="comment-author">
                      {comment.authorRole === 'admin' ? 'Модератор' : 'Вы'}
                    </span>
                    <span className="comment-date">
                      {new Date(comment.createdAt).toLocaleDateString('ru-RU', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <p className="comment-text">{comment.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add comment form */}
        {status !== 'blocked' && (
          <div className="add-comment-form">
            <textarea
              placeholder="Напишите ответ модератору..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={3}
            />
            <button 
              className="btn-send-comment"
              onClick={handleSubmit}
              disabled={!newComment.trim() || isSending}
            >
              {isSending ? 'Отправка...' : 'Отправить'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreatorEventsPage;
