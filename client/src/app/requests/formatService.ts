import { SERVICE_REQUESTS, getPostById } from "@/lib/mock";

const pad = (n: number) => String(n).padStart(2, "0");

// fecha dia,mes y ano
export function formatDate(meetingDate: string) {
  const [year, month, day] = meetingDate.split("T")[0].split("-");
  return `${day} - ${month} - ${year}`;
}

// tiempo
export function formatTime(time: string) {
  const [h, m] = time.split(":").map(Number);
  const suffix = h >= 12 ? "pm" : "am";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${pad(m)} ${suffix}`;
}

// Esta función saca la hora de la fecha y la pone bonita.
export function formatMeetingTime(meetingDate: string) {
  const time = meetingDate.split("T")[1];
  return time ? formatTime(time.slice(0, 5)) : "Por definir";
}
// Esta función convierte un número de horas en una frase.
export function formatHours(hours: number) {
  return `${hours} ${hours === 1 ? "Hora" : "Horas"}`;
}

// Esta función averigua cuánto cuesta UNA hora de un servicio.
export function getHourlyRate(postId: string) {
  // Si la publicación ya tiene precio (lo pone "Crea un truek"), usamos ese
  const post = getPostById(postId);
  if (post?.price) return post.price;

  // Si no, lo sacamos de una solicitud de esa publicación
  const sample = SERVICE_REQUESTS.find((r) => r.post_id === postId && r.hours > 0);
  return sample ? Math.round(sample.price / sample.hours) : 10000;
}
