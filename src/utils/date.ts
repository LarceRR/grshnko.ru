export const toLocalISOString = (date: string | Date): string => {
  const d = new Date(date);
  const tzOffset = -d.getTimezoneOffset(); // в минутах
  const sign = tzOffset >= 0 ? '+' : '-';
  const pad = (num: number) => String(Math.floor(Math.abs(num))).padStart(2, '0');

  const tz = `${sign}${pad(tzOffset / 60)}:${pad(tzOffset % 60)}`;
  const localISO = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}${tz}`;

  return localISO;
};

export const toDatetimeLocalValue = (date: string | Date): string => {
  const localISO = toLocalISOString(date); // "2025-09-14T12:34:56+03:00"
  return localISO.slice(0, 16); // "YYYY-MM-DDTHH:mm"
};