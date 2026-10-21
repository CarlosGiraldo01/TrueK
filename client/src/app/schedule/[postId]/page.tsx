"use client";

import { use, useState } from "react";
import { notFound, useRouter } from "next/navigation";
import { Button, NavBar, TextField, TopHeader } from "@/components/ui";
import { useRequests } from "../../../context/RequestContext";
import { useSession } from "@/context/SessionContext";
import { getPostById, getUserById } from "@/lib/mock";
import { formatTime } from "../../requests/formatService";
import { ProviderHeader } from "../ProviderHeader";
import { ScheduleProgress } from "../ScheduleProgress";
import { DateField, HoursStepper, ImagePicker, SelectField } from "../ScheduleFields";

// From 8:00 am to 9:00 pm, every hour.
const TIME_OPTIONS = Array.from({ length: 14 }, (_, i) => {
  const value = `${String(8 + i).padStart(2, "0")}:00`;
  return { value, label: formatTime(value) };
});

type Errors = Partial<Record<"client_name" | "meeting_address" | "date" | "time", string>>;

function todayISO() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

const ScheduleScreen = ({ postId }: { postId: string }) => {
  const router = useRouter();
  const { user } = useSession();
  const { draft, saveDraft } = useRequests();

  const post = getPostById(postId);
  // The draft is kept when coming back from "Confirmar servicio".
  const previous = draft?.post_id === postId ? draft : null;

  const [clientName, setClientName] = useState(previous?.client_name ?? user?.name ?? "");
  const [address, setAddress] = useState(previous?.meeting_address ?? "");
  const [hours, setHours] = useState(previous?.hours ?? 1);
  const [date, setDate] = useState(previous?.date ?? "");
  const [time, setTime] = useState(previous?.time ?? "");
  const [image, setImage] = useState<string | null>(previous?.request_image ?? null);
  const [errors, setErrors] = useState<Errors>({});
  const [minDate] = useState(todayISO);

  if (!post) notFound();

  // The error of a field disappears as soon as it is edited.
  const clearError = (field: keyof Errors) => setErrors((prev) => ({ ...prev, [field]: undefined }));

  const provider = getUserById(post.user_id);
  const isOwnPost = user?.id === post.user_id;

  const handleContinue = () => {
    const newErrors: Errors = {};
    if (!clientName.trim()) newErrors.client_name = "Escribe tu nombre";
    if (!address.trim()) newErrors.meeting_address = "Escribe dónde se van a encontrar";
    if (!date) newErrors.date = "Elige una fecha";
    if (!time) newErrors.time = "Elige una hora";
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    saveDraft({
      post_id: post.id,
      client_name: clientName.trim(),
      meeting_address: address.trim(),
      hours,
      date,
      time,
      request_image: image,
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
