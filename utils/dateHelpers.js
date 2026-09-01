/**
 * GymVault Date & Time Standardization Utilities (WIB / UTC Safe)
 * Certified 10/10 Pure Functional Module - Zero Dependencies
 */

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const MONTHS_LONG = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const DAYS_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

/**
 * Safely parse a date string or ISO date into a valid Date object
 */
export function parseSafeDate(dateInput) {
  if (!dateInput) return new Date();
  if (dateInput instanceof Date) return isNaN(dateInput.getTime()) ? new Date() : dateInput;
  const safeStr = String(dateInput).replace(' ', 'T');
  const d = new Date(safeStr);
  return isNaN(d.getTime()) ? new Date() : d;
}

/**
 * Format date as "15 Agu 2026" or "15 Aug"
 */
export function formatShortDate(dateInput, includeYear = false) {
  const d = parseSafeDate(dateInput);
  const day = d.getDate();
  const month = MONTHS_SHORT[d.getMonth()];
  const year = d.getFullYear();
  return includeYear ? `${day} ${month} ${year}` : `${month} ${day}`;
}

/**
 * Format full Indonesian date: "Senin, 25 Agustus 2026"
 */
export function formatFullWIBDate(dateInput) {
  const d = parseSafeDate(dateInput);
  const dayName = DAYS_ID[d.getDay()];
  const day = d.getDate();
  const monthName = MONTHS_LONG[d.getMonth()];
  const year = d.getFullYear();
  return `${dayName}, ${day} ${monthName} ${year}`;
}

/**
 * Format 24-hour time "14:30"
 */
export function formatTime24(dateInput) {
  const d = parseSafeDate(dateInput);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Calculate hours ago from now
 */
export function getHoursAgo(dateInput) {
  const d = parseSafeDate(dateInput);
  const now = new Date();
  return Math.max(0, (now.getTime() - d.getTime()) / (1000 * 60 * 60));
}

/**
 * Format human-readable relative time (e.g. "2 jam lalu", "Kemarin", "5 hari lalu")
 */
export function formatRelativeTime(dateInput) {
  const hoursAgo = getHoursAgo(dateInput);
  if (hoursAgo < 1) {
    const mins = Math.max(1, Math.round(hoursAgo * 60));
    return `${mins} menit lalu`;
  }
  if (hoursAgo < 24) {
    return `${Math.floor(hoursAgo)} jam lalu`;
  }
  const daysAgo = Math.floor(hoursAgo / 24);
  if (daysAgo === 1) return 'Kemarin';
  if (daysAgo < 7) return `${daysAgo} hari lalu`;
  return formatShortDate(dateInput, true);
}

/**
 * Check if two dates represent the exact same calendar day
 */
export function isSameDay(dateInput1, dateInput2) {
  const d1 = parseSafeDate(dateInput1);
  const d2 = parseSafeDate(dateInput2);
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

/**
 * Get start of the current week (Monday 00:00:00)
 * Gym context: week starts on Monday, not Sunday.
 */
export function getStartOfWeek(dateInput = new Date()) {
  const d = parseSafeDate(dateInput);
  const start = new Date(d);
  // getDay(): 0=Sun,1=Mon,...,6=Sat → shift so Monday=0
  const dayOfWeek = d.getDay();
  const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  start.setDate(d.getDate() - diffToMonday);
  start.setHours(0, 0, 0, 0);
  return start;
}

/**
 * Format YYYY-MM-DD in local time (no UTC shift).
 * Shared util — import dari sini, jangan definisikan ulang di tiap screen.
 */
export function getLocalDateString(date = new Date()) {
  const d = parseSafeDate(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
