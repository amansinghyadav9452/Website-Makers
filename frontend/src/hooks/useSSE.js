import { useEffect, useRef, useCallback } from 'react';

export function useSSE(url, token, onMessage) {
  const esRef = useRef(null);
  const reconnectTimeout = useRef(null);
  const reconnectAttempts = useRef(0);
  const MAX_RECONNECT = 5;
  const RECONNECT_DELAY = 5000;

  const connect = useCallback(() => {
    if (!url || !token) return;

    try {
      const es = new EventSource(`${url}/api/sse`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      es.onopen = () => {
        reconnectAttempts.current = 0;
      };

      es.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.type !== 'ping') {
            onMessage?.(data);
          }
        } catch (err) {
          console.error('SSE message parse error:', err);
        }
      };

      es.onerror = () => {
        es.close();
        if (reconnectAttempts.current < MAX_RECONNECT) {
          reconnectAttempts.current++;
          reconnectTimeout.current = setTimeout(connect, RECONNECT_DELAY * reconnectAttempts.current);
        }
      };

      esRef.current = es;
    } catch (err) {
      console.error('SSE connection error:', err);
    }
  }, [url, token, onMessage]);

  useEffect(() => {
    connect();
    return () => {
      if (esRef.current) esRef.current.close();
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
    };
  }, [connect]);

  return { reconnect: connect };
}
