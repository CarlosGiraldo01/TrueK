//Es la caja de piezas especiales del formulario del paso 1 (“Agendar Servicio”). Ya existe una pieza TextField para escribir texto, pero el formulario necesitaba otras que esa no cubre. Por eso aquí se crean 4 piezas nuevas con el mismo estilo:
"use client";

import { useId, type ChangeEvent } from "react";
import { CameraIcon, ChevronDownIcon, MinusIcon, PlusIcon } from "@heroicons/react/24/outline";

const fieldClasses ="h-9 w-full rounded-xl bg-truek-field px-3.5 text-xs text-white border-0 outline-none " +"transition-shadow focus:ring-1 focus:ring-white/30";

// El letrerito que va encima de cada campo (por ejemplo, "Fecha").
// "htmlFor" dice a qué campo pertenece: así, si tocas el letrero, se activa su campo.
// "children" es lo que va adentro del letrero (el texto).
function FieldLabel({ htmlFor, children }: { htmlFor?: string; children: React.ReactNode }) {
  return (
    // "select-none" hace que el letrero no se pueda seleccionar como texto.
    <label htmlFor={htmlFor} className="mb-2 block select-none text-sm text-white">
      {children}
    </label>
  );
}

// El mensajito de error en naranja que aparece debajo de un campo.
// Si hay error, lo mostramos. Si no hay, no mostramos nada (null).
function FieldError({ error }: { error?: string }) {
  return error ? <span className="mt-1 block text-[13px] text-truek-orange">{error}</span> : null;
}

interface HoursStepperProps {
  value: number;                     // El número de horas que hay ahora.
  onChange: (value: number) => void; // Qué hacer cuando cambia el número.
  min?: number;                      // El número más chiquito permitido (opcional).
  max?: number;                      // El número más grande permitido (opcional).
}

// El contador. Si no nos dicen el mínimo, es 1. Si no nos dicen el máximo, es 12.
export function HoursStepper({ value, onChange, min = 1, max = 12 }: HoursStepperProps) {
  return (
    <div>
      {/* El letrero de arriba */}
      <FieldLabel>¿Cuántas horas?</FieldLabel>

      {/* La barrita con: botón "−" a la izquierda, número en el medio, botón "+" a la derecha */}
      <div className="flex h-9 items-center justify-between rounded-xl bg-truek-field px-2 text-white">
        {/* Botón "−": resta 1 hora.
            "Math.max" cuida que nunca baje del mínimo.
            Si ya estamos en el mínimo, el botón se apaga y se ve clarito.
            "aria-label" le dice a los lectores de pantalla qué hace el botón. */}
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          aria-label="Menos horas"
          className="flex size-7 items-center justify-center transition-opacity active:opacity-60 disabled:opacity-30"
        >
          <MinusIcon className="size-4" strokeWidth={2.5} />
        </button>

        {/* El número en el medio: "1 hora" o "3 horas" */}
        <span className="text-xs">
          {value} {value === 1 ? "hora" : "horas"}
        </span>

        {/* Botón "+": suma 1 hora.
            "Math.min" cuida que nunca pase del máximo.
            Si ya estamos en el máximo, el botón se apaga. */}
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          aria-label="Más horas"
          className="flex size-7 items-center justify-center transition-opacity active:opacity-60 disabled:opacity-30"
        >
          <PlusIcon className="size-4" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}

interface DateFieldProps {
  value: string;                     // La fecha elegida, como "2026-11-14".
  onChange: (value: string) => void; // Qué hacer cuando eligen otra fecha.
  min?: string;                      // La fecha más temprana que se puede elegir (opcional).
  error?: string;                    // El mensaje de error (opcional).
}

export function DateField({ value, onChange, min, error }: DateFieldProps) {
  // Inventamos un nombre único para unir el letrero con su campo.
  const id = useId();

  return (
    <div>
      {/* El letrero de arriba, unido al campo por su nombre único */}
      <FieldLabel htmlFor={id}>Fecha</FieldLabel>

      {/* El campo de fecha. "type="date"" hace que el navegador muestre un calendario.
          - "scheme-dark" pinta el calendario en modo oscuro.
          - Si todavía no hay fecha, la letra se ve gris clarito. */}
      <input
        id={id}
        type="date"
        value={value}
        min={min}
        onChange={(e) => onChange(e.target.value)}
        className={`${fieldClasses} scheme-dark ${value ? "" : "text-truek-placeholder"}`}
      />

      {/* El error, si hay */}
      <FieldError error={error} />
    </div>
  );
}

interface SelectFieldProps {
  label: string;                               // El letrero de arriba.
  value: string;                               // La opción elegida.
  onChange: (value: string) => void;           // Qué hacer cuando eligen otra.
  options: { value: string; label: string }[]; // Las opciones: lo que se guarda y lo que se ve.
  placeholder: string;                         // El texto que se ve antes de elegir.
  error?: string;                              // El mensaje de error (opcional).
}

export function SelectField({ label, value, onChange, options, placeholder, error }: SelectFieldProps) {
  // Inventamos un nombre único para unir el letrero con su campo.
  const id = useId();

  return (
    <div>
      {/* El letrero de arriba */}
      <FieldLabel htmlFor={id}>{label}</FieldLabel>

      {/* "relative" permite poner la flechita encima de la lista */}
      <div className="relative">
        {/* La lista desplegable.
            - "appearance-none" quita la flechita fea que trae el navegador.
            - "pr-9" deja espacio a la derecha para nuestra flechita bonita.
            - Si todavía no se eligió nada, la letra se ve gris clarito. */}
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${fieldClasses} appearance-none pr-9 ${value ? "" : "text-truek-placeholder"}`}
        >
          {/* La primera opción es solo el texto de ayuda ("Selecciona la hora").
              Está apagada ("disabled"), así que no se puede elegir. */}
          <option value="" disabled>
            {placeholder}
          </option>

          {/* "map" es como una fotocopiadora: por cada opción,
              hacemos un renglón en la lista. */}
          {options.map((option) => (
            <option key={option.value} value={option.value} className="bg-truek-field text-white">
              {option.label}
            </option>
          ))}
        </select>

        {/* Nuestra flechita bonita hacia abajo, pegada a la derecha y centrada en altura.
            "pointer-events-none" hace que los toques la atraviesen y lleguen a la lista. */}
        <ChevronDownIcon
          className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-white"
          strokeWidth={2}
        />
      </div>

      {/* El error, si hay */}
      <FieldError error={error} />
    </div>
  );
}

interface ImagePickerProps {
  value: string | null;                     // La dirección de la foto elegida, o ninguna (null).
  onChange: (url: string | null) => void;   // Qué hacer cuando eligen una foto.
}

// La foto de referencia. Ojo: la foto NO se sube a internet.
// Solo se guarda en la memoria del navegador mientras la app está abierta.
export function ImagePicker({ value, onChange }: ImagePickerProps) {
  // Inventamos un nombre único para unir el cuadro con el campo escondido.
  const id = useId();

  // Esto pasa cuando el usuario elige una foto:
  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    // Tomamos la primera foto que eligió (puede que no haya elegido ninguna).
    const file = e.target.files?.[0];
    // Si eligió una, creamos una dirección temporal para poder mostrarla,
    // como una foto prestada que solo existe mientras la app está abierta.
    if (file) onChange(URL.createObjectURL(file));
  };

  return (
    <div>
      {/* El letrero de arriba */}
      <FieldLabel htmlFor={id}>Imagen de referencia</FieldLabel>

      {/* El cuadro grande que se ve. En realidad es un letrero gigante:
          al tocarlo, se activa el campo escondido de abajo y se abre la galería. */}
      <label
        htmlFor={id}
        className="relative flex h-24 cursor-pointer flex-col items-center justify-center gap-1 overflow-hidden rounded-xl border border-truek-line bg-truek-field text-truek-placeholder transition-opacity active:opacity-80"
      >
        {/* Aquí el camino se divide en dos: */}
        {value ? (
          // Camino 1: si ya hay foto, la mostramos llenando todo el cuadro,
          // con una pastillita que dice "Cambiar" en la esquina de abajo.
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="Imagen de referencia" className="absolute inset-0 h-full w-full object-cover" />
            <span className="absolute bottom-2 right-2 rounded-full bg-truek-black/80 px-3 py-0.5 text-[11px] text-white">
              Cambiar
            </span>
          </>
        ) : (
          // Camino 2: si no hay foto, mostramos una camarita y "Agregar imagen".
          <>
            <CameraIcon className="size-6" strokeWidth={1.6} />
            <span className="text-[11px]">Agregar imagen</span>
          </>
        )}
      </label>

      
      <input id={id} type="file" accept="image/*" onChange={handleFile} className="sr-only" />
    </div>
  );
}