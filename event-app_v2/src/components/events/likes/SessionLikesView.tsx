import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { DiscoverySessionLike, Event } from '@/types';
import { fetchDiscoverySessionLikes } from '@/services/eventApi';
import { useToast } from '@/contexts';
import { LoadingSpinner } from '@/components/common';
import './SessionLikesView.css';

const MIN_REFRESH_INTERVAL_MS = 30_000;

const formatDateTime = (iso: string): string => {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return iso;
  const d = new Date(t);
  return d.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const isPastSlot = (slotStartIso: string): boolean => {
  const t = Date.parse(slotStartIso);
  if (!Number.isFinite(t)) return false;
  return t < Date.now();
};

interface SessionLikesViewProps {
  sessionKey: number;
  onEventClick: (event: Event) => void;
  onGoToDiscovery: () => void;
}

const SessionLikesView: FC<SessionLikesViewProps> = ({
  sessionKey,
  onEventClick,
  onGoToDiscovery,
}) => {
  const { info: showInfo, error: showError } = useToast();

  const [likes, setLikes] = useState<DiscoverySessionLike[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [lastFetchedAtMs, setLastFetchedAtMs] = useState<number>(0);

  // Pull-to-refresh state (simple, mobile-focused)
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const pullStartY = useRef<number | null>(null);
  const [pullDistance, setPullDistance] = useState(0);

  const filteredLikes = useMemo(() => likes, [likes]);

  const load = useCallback(
    async (reason: 'initial' | 'manual' | 'pull' | 'session-reset') => {
      const now = Date.now();
      const isThrottled = now - lastFetchedAtMs < MIN_REFRESH_INTERVAL_MS;

      if (reason !== 'session-reset' && isThrottled) {
        const secondsLeft = Math.ceil((MIN_REFRESH_INTERVAL_MS - (now - lastFetchedAtMs)) / 1000);
        showInfo(`Обновление доступно через ${secondsLeft}с`);
        return;
      }

      setIsLoading(true);
      setLoadError(null);
      try {
        const data = await fetchDiscoverySessionLikes();
        setLikes(data);
        setLastFetchedAtMs(Date.now());
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Не удалось загрузить лайки';
        setLoadError(message);
        showError(message);
      } finally {
        setIsLoading(false);
      }
    },
    [lastFetchedAtMs, showError, showInfo]
  );

  useEffect(() => {
    // On session reset: instantly clear UI, then load fresh.
    setLikes([]);
    setLoadError(null);
    setLastFetchedAtMs(0);
    void load('session-reset');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionKey]);

  useEffect(() => {
    void load('initial');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onTouchStart = (e: React.TouchEvent) => {
    const scrollEl = scrollRef.current;
    if (!scrollEl) return;
    if (scrollEl.scrollTop > 0) return;

    const touch = e.targetTouches[0];
    if (!touch) return;

    pullStartY.current = touch.clientY;
    setPullDistance(0);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (pullStartY.current === null) return;

    const touch = e.targetTouches[0];
    if (!touch) return;

    const delta = touch.clientY - pullStartY.current;
    if (delta <= 0) {
      setPullDistance(0);
      return;
    }

    setPullDistance(Math.min(80, delta));
  };

  const onTouchEnd = () => {
    const shouldRefresh = pullDistance >= 60;
    pullStartY.current = null;
    setPullDistance(0);

    if (shouldRefresh) {
      void load('pull');
    }
  };

  return (
    <section className="session-likes" aria-label="Лайки за сессию">
      <div className="session-likes-header">
        <div className="session-likes-title">Лайки за сессию</div>
        <button
          className="session-likes-refresh"
          onClick={() => load('manual')}
          disabled={isLoading}
          type="button"
        >
          Обновить
        </button>
      </div>

      <div
        ref={scrollRef}
        className="session-likes-scroll"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className="session-likes-pull" style={{ height: pullDistance ? 34 + pullDistance : 34 }}>
          {pullDistance >= 60 ? 'Отпустите чтобы обновить' : 'Потяните чтобы обновить'}
        </div>

        {isLoading && filteredLikes.length === 0 ? (
          <LoadingSpinner />
        ) : loadError ? (
          <div className="session-likes-error">
            <p>{loadError}</p>
            <button className="session-likes-action" type="button" onClick={() => load('manual')}>
              Повторить
            </button>
          </div>
        ) : filteredLikes.length === 0 ? (
          <div className="session-likes-empty">
            <p>Пока нет лайков в текущей сессии. Поставьте лайк событиям в «Подборе».</p>
            <button className="session-likes-action" type="button" onClick={onGoToDiscovery}>
              Перейти к подбору
            </button>
          </div>
        ) : (
          <div className="session-likes-list">
            {filteredLikes.map((like) => {
              const past = isPastSlot(like.slot.start);
              return (
                <button
                  key={`${like.event.id}-${like.likedAt}`}
                  className="session-like-item"
                  type="button"
                  onClick={() => onEventClick(like.event)}
                >
                  <div className="session-like-top">
                    <h3 className="session-like-title">{like.event.title}</h3>
                    <span className={`session-like-badge ${past ? 'past' : ''}`}>{past ? 'Прошло' : 'Будет'}</span>
                  </div>
                  <div className="session-like-meta">
                    <span>{like.event.type}</span>
                    <span>•</span>
                    <span>{like.event.date}</span>
                    <span>•</span>
                    <span>{like.event.time}</span>
                    <span>•</span>
                    <span>Лайк: {formatDateTime(like.likedAt)}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default SessionLikesView;
