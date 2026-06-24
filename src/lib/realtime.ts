import * as signalR from "@microsoft/signalr";

type RealtimeHandler<T = unknown> = (payload: T) => void;

const DEFAULT_HUB_PATH = "/notificationHub";
const GROUP_JOIN_METHODS = ["JoinGroup", "SubscribeToGroup", "AddToGroup"];
const GROUP_LEAVE_METHODS = ["LeaveGroup", "UnsubscribeFromGroup", "RemoveFromGroup"];

let connection: signalR.HubConnection | null = null;
let startPromise: Promise<signalR.HubConnection> | null = null;
const joinedGroups = new Set<string>();

const buildHubUrl = () => {
  const configured =
    import.meta.env.VITE_SIGNALR_HUB_URL ||
    import.meta.env.VITE_SIGNALR_URL ||
    DEFAULT_HUB_PATH;

  if (/^https?:\/\//i.test(configured)) return configured;

  const apiBase = import.meta.env.VITE_API_BASE_URL || "";
  if (!apiBase) return configured;

  const base = apiBase.replace(/\/api\/?$/i, "").replace(/\/$/, "");
  const path = configured.startsWith("/") ? configured : `/${configured}`;
  return `${base}${path}`;
};

const getConnection = () => {
  if (connection) return connection;

  connection = new signalR.HubConnectionBuilder()
    .withUrl(buildHubUrl(), {
      accessTokenFactory: () => localStorage.getItem("access_token") || "",
    })
    .withAutomaticReconnect()
    .configureLogging(import.meta.env.DEV ? signalR.LogLevel.Information : signalR.LogLevel.Warning)
    .build();

  connection.onreconnected(() => {
    const groups = Array.from(joinedGroups);
    joinedGroups.clear();
    groups.forEach((groupName) => {
      joinRealtimeGroup(groupName).catch((error) => {
        if (import.meta.env.DEV) console.warn("[SignalR] Rejoin group failed", groupName, error);
      });
    });
  });

  return connection;
};

export const startRealtime = async () => {
  const activeConnection = getConnection();

  if (activeConnection.state === signalR.HubConnectionState.Connected) {
    return activeConnection;
  }

  if (!startPromise) {
    startPromise = activeConnection
      .start()
      .then(() => activeConnection)
      .finally(() => {
        startPromise = null;
      });
  }

  return startPromise;
};

const invokeFirstAvailable = async (methods: string[], groupName: string) => {
  const activeConnection = await startRealtime();
  let lastError: unknown = null;

  for (const method of methods) {
    try {
      await activeConnection.invoke(method, groupName);
      return;
    } catch (error) {
      lastError = error;
    }
  }

  if (import.meta.env.DEV) {
    console.warn("[SignalR] Group method failed", groupName, lastError);
  }
};

export const joinRealtimeGroup = async (groupName: string) => {
  if (!groupName || joinedGroups.has(groupName)) return;
  await invokeFirstAvailable(GROUP_JOIN_METHODS, groupName);
  joinedGroups.add(groupName);
};

export const leaveRealtimeGroup = async (groupName: string) => {
  if (!groupName || !joinedGroups.has(groupName)) return;
  await invokeFirstAvailable(GROUP_LEAVE_METHODS, groupName);
  joinedGroups.delete(groupName);
};

export const stopRealtime = async () => {
  if (!connection) return;
  joinedGroups.clear();
  await connection.stop();
};

export const onRealtimeEvent = <T = unknown>(eventName: string, handler: RealtimeHandler<T>) => {
  const activeConnection = getConnection();
  const wrapped = (payload: T) => handler(payload);
  activeConnection.on(eventName, wrapped);

  return () => {
    activeConnection.off(eventName, wrapped);
  };
};
