import { useEffect, useRef, useState, useCallback } from 'react';
import { OlorunsogoPayloadRaw, OlorunsogoStationState } from '../types/telemetry';
import { normalizeOlorunsogoPayload } from '../adapters/olorunsogoAdapter';

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export interface UseOlorunsogoRealtimeOptions {
  wsUrl?: string;
  autoConnect?: boolean;
  stalenessTimeoutMs?: number; // Duration without packets before flagging as stale (default 20,000ms)
  reconnectIntervalMs?: number; // Base reconnect backoff (default 3,000ms)
  initialPayload?: OlorunsogoPayloadRaw;
}

export interface UseOlorunsogoRealtimeResult {
  station: OlorunsogoStationState | null;
  status: ConnectionStatus;
  lastMessageTime: Date | null;
  error: Error | null;
  reconnect: () => void;
  disconnect: () => void;
}

const DEFAULT_STALENESS_TIMEOUT_MS = 20000;
const DEFAULT_RECONNECT_INTERVAL_MS = 3000;

export const useOlorunsogoRealtime = (
  options: UseOlorunsogoRealtimeOptions = {}
): UseOlorunsogoRealtimeResult => {
  const {
    wsUrl = (typeof window !== 'undefined' && (window as any).__WS_URL__) || 'ws://localhost:3000',
    autoConnect = true,
    stalenessTimeoutMs = DEFAULT_STALENESS_TIMEOUT_MS,
    reconnectIntervalMs = DEFAULT_RECONNECT_INTERVAL_MS,
    initialPayload
  } = options;

  const [station, setStation] = useState<OlorunsogoStationState | null>(() => {
    return initialPayload ? normalizeOlorunsogoPayload(initialPayload) : null;
  });
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [lastMessageTime, setLastMessageTime] = useState<Date | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const stalenessTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isManuallyClosedRef = useRef<boolean>(false);

  // Watchdog timer to flag data as stale when streaming stalls
  const resetStalenessWatchdog = useCallback(() => {
    if (stalenessTimerRef.current) {
      clearTimeout(stalenessTimerRef.current);
    }
    stalenessTimerRef.current = setTimeout(() => {
      setStation((prev) => (prev ? { ...prev, isStale: true } : null));
    }, stalenessTimeoutMs);
  }, [stalenessTimeoutMs]);

  const connect = useCallback(() => {
    if (typeof window === 'undefined') return;

    // Clean up existing connections
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    isManuallyClosedRef.current = false;
    setStatus('connecting');
    setError(null);

    try {
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        setStatus('connected');
        resetStalenessWatchdog();
      };

      ws.onmessage = (event: MessageEvent) => {
        try {
          const rawData = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;

          // Target specifically the Olorunsogo Gas station payload
          if (rawData && rawData.id === 'olorunsogoGas') {
            const normalized = normalizeOlorunsogoPayload(rawData as OlorunsogoPayloadRaw);
            const now = new Date();
            setStation(normalized);
            setLastMessageTime(now);
            resetStalenessWatchdog();
          }
        } catch (parseErr: any) {
          console.warn('[useOlorunsogoRealtime] Failed to parse telemetry payload:', parseErr);
        }
      };

      ws.onerror = (evt: Event) => {
        setError(new Error('WebSocket connection error'));
        setStatus('error');
      };

      ws.onclose = () => {
        setStatus('disconnected');
        socketRef.current = null;

        // Auto-reconnect unless manually terminated
        if (!isManuallyClosedRef.current) {
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectIntervalMs);
        }
      };
    } catch (err: any) {
      setError(err);
      setStatus('error');
    }
  }, [wsUrl, reconnectIntervalMs, resetStalenessWatchdog]);

  const disconnect = useCallback(() => {
    isManuallyClosedRef.current = true;
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (stalenessTimerRef.current) {
      clearTimeout(stalenessTimerRef.current);
      stalenessTimerRef.current = null;
    }
    setStatus('disconnected');
  }, []);

  const reconnect = useCallback(() => {
    disconnect();
    connect();
  }, [disconnect, connect]);

  useEffect(() => {
    if (autoConnect) {
      connect();
    }
    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  return {
    station,
    status,
    lastMessageTime,
    error,
    reconnect,
    disconnect
  };
};
