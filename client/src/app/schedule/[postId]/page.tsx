"use client";

import { use, useState } from "react";
import { notFound, useRouter } from "next/navigation";
import { Button, NavBar, TextField, TopHeader } from "@/components/ui";
import { useRequests } from "../../../context/RequestContext";
import { useSession } from "@/context/SessionContext";
import { usePosts } from "@/context/PostsContext";
import { useUsers } from "@/context/UsersContext";
import { formatTime } from "../../requests/formatService";
import { ProviderHeader } from "../ProviderHeader";
import { ScheduleProgress } from "../ScheduleProgress";
import { DateField, HoursStepper, ImagePicker, SelectField } from "../ScheduleFields";

// La lista de horas que se pueden elegir: desde las 8:00 de la mañana
// hasta las 9:00 de la noche, de hora en hora.
// Hacemos 14 opciones. Para cada una, "i" va de 0 a 13:
// - 8 + 0 = 8, 8 + 1 = 9... hasta 8 + 13 = 21 (las 9 de la noche).
// - "padStart(2, "0")" le pone un cero adelante si hace falta: 8 se vuelve "08".
// Cada opción tiene un "value" (lo que se guarda, como "08:00")
// y un "label" (lo que se ve, como "8:00 a. m.").
const TIME_OPTIONS = Array.from({ length: 14 }, (_, i) => {
  const value = `${String(8 + i).padStart(2, "0")}:00`;
  return { value, label: formatTime(value) };
});
// El molde de los errores: una cajita donde cada campo puede tener (o no) un mensaje de error.
// Solo estos 4 campos pueden tener error: nombre, dirección, fecha y hora.
// "Partial" significa que no todos tienen que estar.
type Errors = Partial<Record<"client_name" | "meeting_address" | "date" | "time", string>>;
//fechas 
function todayISO() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}
// La pantalla del formulario. Recibe "postId", el número del anuncio que se quiere pedir.
const ScheduleScreen = ({ postId }: { postId: string }) => {
      const router = useRouter();
      const { user } = useSession();// Abrimos la caja de la sesión y sacamos al usuario que entró a la app.
      const { draft, saveDraft } = useRequests();// - draft: el borrador que ya se había guardado (si hay uno).
      const { getPostById } = usePosts();
      const { getUserById } = useUsers();
      const post = getPostById(postId);
      const previous = draft?.post_id === postId ? draft : null;
      const [clientName, setClientName] = useState(previous?.client_name ?? user?.name ?? "");
      const [address, setAddress] = useState(previous?.meeting_address ?? "");
      const [hours, setHours] = useState(previous?.hours ?? 1);
      const [date, setDate] = useState(previous?.date ?? "");
      const [time, setTime] = useState(previous?.time ?? "");
      const [image, setImage] = useState<string | null>(previous?.request_image ?? null);
      const [errors, setErrors] = useState<Errors>({});
      const [minDate] = useState(todayISO);
// Si el anuncio no existe, mostramos la página de "No encontrado".
  if (!post) notFound();
  // Esta herramienta borra el error de un campo.
       const clearError = (field: keyof Errors) => setErrors((prev) => ({ ...prev, [field]: undefined }));
       const provider = getUserById(post.user_id);
       const isOwnPost = user?.id === post.user_id;
   // Esto pasa cuando el cliente aprieta "Continuar":
  const handleContinue = () => {
    const newErrors: Errors = {};
    if (!clientName.trim()) newErrors.client_name = "Escribe tu nombre";
    if (!address.trim()) newErrors.meeting_address = "Escribe dónde se van a encontrar";
    if (!date) newErrors.date = "Elige una fecha";
    if (!time) newErrors.time = "Elige una hora";
    setErrors(newErrors);
    // Si todo está bien, guardamos todo como borrador.
    if (Object.keys(newErrors).length > 0) return;
    saveDraft({post_id: post.id, client_name: clientName.trim(),meeting_address: address.trim(),hours,date,time,request_image: image,
    });
    router.push(`/schedule/${post.id}/confirm`);
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <TopHeader title="Agendar Servicio" />
      <ScheduleProgress step={1} />

      <main className="flex-1 px-5 pb-8 pt-5">
        <section className="rounded-3xl border border-truek-lime/50 bg-truek-card p-5">
          <ProviderHeader provider={provider} tags={post.tags} />

          {isOwnPost ? (
            <p className="mt-6 text-center text-sm text-white/70">No puedes agendar tu propio servicio.</p>
          ) : (
            <div className="mt-6 space-y-4">
              <TextField
                label="Nombre completo"
                placeholder="Ej: Luis Felipe"
                value={clientName}
                onChange={(e) => {
                  setClientName(e.target.value);
                  clearError("client_name");
                }}
                error={errors.client_name}
              />
              <TextField
                label="Dirección de encuentro"
                placeholder="Ej: Carrera 100 # 5 - 169"
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value);
                  clearError("meeting_address");
                }}
                error={errors.meeting_address}
              />
              <HoursStepper value={hours} onChange={setHours} />
              <DateField
                value={date}
                onChange={(value) => {
                  setDate(value);
                  clearError("date");
                }}
                min={minDate}
                error={errors.date}
              />
              <SelectField
                label="Hora"
                value={time}
                onChange={(value) => {
                  setTime(value);
                  clearError("time");
                }}
                options={TIME_OPTIONS}
                placeholder="Selecciona la hora"
                error={errors.time}
              />
              <ImagePicker value={image} onChange={setImage} />

              <div className="pt-2">
                <Button onClick={handleContinue}>Continuar</Button>
              </div>
            </div>
          )}
        </section>
      </main>

      <NavBar activeId="inicio" />
    </div>
  );
};

export default function SchedulePage({ params }: { params: Promise<{ postId: string }> }) {
  const { postId } = use(params);

  return <ScheduleScreen postId={postId} />;
}
