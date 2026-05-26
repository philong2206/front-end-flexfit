/* eslint-disable no-useless-assignment */
const EXPLORE_SLOT_KEY = "flexfit_explore_slot_booked";

/** "08:00:00" → "08:00" */
export function formatHm(time: string): string {
  const m = time.match(/(\d{1,2}):(\d{2})/);
  if (!m) return time;
  return `${String(parseInt(m[1], 10)).padStart(2, "0")}:${m[2]}`;
}

export function formatOpenHours(openTime: string, closeTime: string): string {
  return `${formatHm(openTime)} - ${formatHm(closeTime)}`;
}

function parseToMinutes(time: string): number {
  const m = time.match(/(\d{1,2}):(\d{2})/);
  if (!m) return 0;
  return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
}

export interface DateTab {
  label: string;
  dateStr: string;
}

export function buildNext7DateTabs(): DateTab[] {
  const tabs: DateTab[] = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const dateStr = `${yyyy}-${mm}-${dd}`;
    let label = "";
    if (i === 0) label = "Hôm nay";
    else if (i === 1) label = "Ngày mai";
    else {
      const days = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
      label = `${days[d.getDay()]}, ${dd}/${mm}`;
    }
    tabs.push({ label, dateStr });
  }
  return tabs;
}

/** Các mốc giờ trong khung mở cửa (bước = thời lượng buổi tập). */
export function generateHourSlots(
  openTime: string,
  closeTime: string,
  stepMinutes: number
): string[] {
  const openMin = parseToMinutes(openTime);
  const closeMin = parseToMinutes(closeTime);
  const step = Math.max(30, stepMinutes);
  const slots: string[] = [];
  for (let t = openMin; t + step <= closeMin; t += step) {
    const h = Math.floor(t / 60);
    const m = t % 60;
    slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
  }
  return slots.length > 0 ? slots : ["09:00", "12:00", "18:00"];
}

/** Ngày hôm nay theo giờ máy khách (YYYY-MM-DD). */
export function getTodayDateStr(now = new Date()): string {
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Khung giờ đã qua (theo thời gian thực).
 * Ví dụ: bây giờ 08:20 → các slot bắt đầu ≤ 08:20 hôm nay không được đặt.
 */
export function isSlotInPast(dateStr: string, timeHm: string, now = new Date()): boolean {
  const todayStr = getTodayDateStr(now);
  if (dateStr < todayStr) return true;
  if (dateStr > todayStr) return false;

  const slotMin = parseToMinutes(timeHm);
  const nowMin = now.getHours() * 60 + now.getMinutes();
  return slotMin <= nowMin;
}

/** Lớp học có startTime ISO đã bắt đầu / qua giờ. */
export function isClassStartInPast(startTimeIso: string, now = new Date()): boolean {
  const start = new Date(startTimeIso);
  if (Number.isNaN(start.getTime())) return false;
  return start.getTime() <= now.getTime();
}

export function slotLabelForDate(dateStr: string, timeHm: string, tabs: DateTab[]): string {
  const tab = tabs.find((t) => t.dateStr === dateStr);
  const day = tab?.label ?? dateStr;
  return `${day}, ${timeHm}`;
}

export function slotStorageKey(sessionId: string, dateStr: string, timeHm: string): string {
  return `${sessionId}|${dateStr}|${timeHm}`;
}

function readBookedCounts(): Record<string, number> {
  try {
    const raw = sessionStorage.getItem(EXPLORE_SLOT_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, number>;
  } catch {
    return {};
  }
}

/** Số chỗ còn (FE) — mặc định 4 chỗ/slot, một số slot seed "đầy" ổn định. */
export function getSlotRemaining(
  sessionId: string,
  dateStr: string,
  timeHm: string,
  capacity = 4
): number {
  const key = slotStorageKey(sessionId, dateStr, timeHm);
  const booked = readBookedCounts()[key] ?? 0;
  let seedFull = 0;
  for (let i = 0; i < key.length; i++) seedFull += key.charCodeAt(i);
  if (seedFull % 11 === 0) return 0;
  return Math.max(0, capacity - booked);
}

export function recordSlotBooking(sessionId: string, dateStr: string, timeHm: string): void {
  const key = slotStorageKey(sessionId, dateStr, timeHm);
  const all = readBookedCounts();
  all[key] = (all[key] ?? 0) + 1;
  sessionStorage.setItem(EXPLORE_SLOT_KEY, JSON.stringify(all));
}

export function buildSlotDateTime(dateStr: string, timeHm: string, durationMinutes: number) {
  const [y, mo, d] = dateStr.split("-").map(Number);
  const [h, mi] = timeHm.split(":").map(Number);
  const start = new Date(y, mo - 1, d, h, mi, 0, 0);
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
  return { startTimeStr: start.toISOString(), endTimeStr: end.toISOString() };
}
