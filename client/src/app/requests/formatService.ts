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
