import { useEffect, useMemo, useRef } from "react";
import { joinRealtimeGroup, leaveRealtimeGroup, onRealtimeEvent, startRealtime } from "@/lib/realtime";

export function useRealtimeConnection(enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    startRealtime().catch((error) => {
      if (import.meta.env.DEV) console.warn("[SignalR] Connection failed", error);
    });
  }, [enabled]);
}

export function useRealtimeGroups(groups: Array<string | null | undefined>, enabled = true) {
  const stableGroups = useMemo(
    () => Array.from(new Set(groups.filter((group): group is string => Boolean(group)))).sort(),
    [groups]
  );

  useEffect(() => {
    if (!enabled || stableGroups.length === 0) return;

    stableGroups.forEach((groupName) => {
      joinRealtimeGroup(groupName).catch((error) => {
        if (import.meta.env.DEV) console.warn("[SignalR] Join group failed", groupName, error);
      });
    });

    return () => {
      stableGroups.forEach((groupName) => {
        leaveRealtimeGroup(groupName).catch((error) => {
          if (import.meta.env.DEV) console.warn("[SignalR] Leave group failed", groupName, error);
        });
      });
    };
  }, [enabled, stableGroups]);
}

export function useRealtimeEvent<T = unknown>(
  eventName: string,
  handler: (payload: T) => void,
  enabled = true
) {
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!enabled) return;

    return onRealtimeEvent<T>(eventName, (payload) => {
      handlerRef.current(payload);
    });
  }, [enabled, eventName]);
}

export function useRealtimeEvents<T = unknown>(
  eventNames: string[],
  handler: (eventName: string, payload: T) => void,
  enabled = true
) {
  const handlerRef = useRef(handler);
  const stableEventNames = useMemo(() => Array.from(new Set(eventNames)).sort(), [eventNames]);

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!enabled || stableEventNames.length === 0) return;

    const unsubscribers = stableEventNames.map((eventName) =>
      onRealtimeEvent<T>(eventName, (payload) => {
        handlerRef.current(eventName, payload);
      })
    );

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [enabled, stableEventNames]);
}

