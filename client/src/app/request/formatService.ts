import { SERVICE_REQUESTS } from "@/lib/mock";

const pad = (n: number) => String(n).padStart(2, "0");

// "2026-11-14" or "2026-11-14T16:00" -> "14 - 11 - 2026"
export function formatDate(meetingDate: string) {
  const [year, month, day] = meetingDate.split("T")[0].split("-");
  return `${day} - ${month} - ${year}`;
}

// "16:00" -> "4:00 pm"
export function formatTime(time: string) {
  const [h, m] = time.split(":").map(Number);
  const suffix = h >= 12 ? "pm" : "am";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${pad(m)} ${suffix}`;
}

// The time is saved together with the date ("2026-11-14T16:00"). Old mock data has no time.
export function formatMeetingTime(meetingDate: string) {
  const time = meetingDate.split("T")[1];
  return time ? formatTime(time.slice(0, 5)) : "Por definir";
}

export function formatHours(hours: number) {
  return `${hours} ${hours === 1 ? "Hora" : "Horas"}`;
}

// The mock has no "price per hour" column yet, so it is taken from the requests of that post.
export function getHourlyRate(postId: string) {
  const sample = SERVICE_REQUESTS.find((r) => r.post_id === postId && r.hours > 0);
  return sample ? Math.round(sample.price / sample.hours) : 10000;
}
