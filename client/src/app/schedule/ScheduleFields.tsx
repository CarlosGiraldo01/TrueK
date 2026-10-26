
"use client";

import { useId, type ChangeEvent } from "react";
import { CameraIcon, ChevronDownIcon, MinusIcon, PlusIcon } from "@heroicons/react/24/outline";

const fieldClasses ="h-9 w-full rounded-xl bg-truek-field px-3.5 text-xs text-white border-0 outline-none " +"transition-shadow focus:ring-1 focus:ring-white/30";

// El letrerito que va encima de cada campo (por ejemplo, "Fecha").
function FieldLabel({ htmlFor, children }: { htmlFor?: string; children: React.ReactNode }) {
  return (
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
  value: number;                     
  onChange: (value: number) => void; 
  min?: number;                      
  max?: number;                      
}

// esto el form para agendar el formulario
export function HoursStepper({ value, onChange, min = 1, max = 12 }: HoursStepperProps) {
  return (
    <div>
      <FieldLabel>¿Cuántas horas?</FieldLabel>

      
      <div className="flex h-9 items-center justify-between rounded-xl bg-truek-field px-2 text-white">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          aria-label="Menos horas"
          className="flex size-7 items-center justify-center transition-opacity active:opacity-60 disabled:opacity-30"
        >
          <MinusIcon className="size-4" strokeWidth={2.5} />
        </button>

        
        <span className="text-xs">
          {value} {value === 1 ? "hora" : "horas"}
        </span>
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
  value: string;                     
  onChange: (value: string) => void; 
  min?: string;                      
  error?: string;                   
}

export function DateField({ value, onChange, min, error }: DateFieldProps) {
  const id = useId();

  return (
    <div>
      <FieldLabel htmlFor={id}>Fecha</FieldLabel>
      <input
        id={id}
        type="date"
        value={value}
        min={min}
        onChange={(e) => onChange(e.target.value)}
        className={`${fieldClasses} scheme-dark ${value ? "" : "text-truek-placeholder"}`}
      />
      <FieldError error={error} />
    </div>
  );
}

interface SelectFieldProps {
  label: string;                               
  value: string;                               
  onChange: (value: string) => void;           
  options: { value: string; label: string }[]; 
  placeholder: string;                         
  error?: string;                             
}

export function SelectField({ label, value, onChange, options, placeholder, error }: SelectFieldProps) {
  
  const id = useId();

  return (
    <div>
     
      <FieldLabel htmlFor={id}>{label}</FieldLabel>

     
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${fieldClasses} appearance-none pr-9 ${value ? "" : "text-truek-placeholder"}`}
        ><option value="" disabled>
            {placeholder}
          </option>
          {options.map((option) => (
            <option key={option.value} value={option.value} className="bg-truek-field text-white">
              {option.label}
            </option>
          ))}
        </select>

      
        <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-white"
          strokeWidth={2}/>
      </div>
      <FieldError error={error} />
    </div>
  );
}

interface ImagePickerProps {
  value: string | null;                     
  onChange: (url: string | null) => void;   
}

//si algo se guarda mientas hace la prueba 
export function ImagePicker({ value, onChange }: ImagePickerProps) {
  const id = useId();
  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onChange(URL.createObjectURL(file));};

  return (
    <div>
      <FieldLabel htmlFor={id}>Imagen de referencia</FieldLabel>
      <label
        htmlFor={id}
        className="relative flex h-24 cursor-pointer flex-col items-center justify-center gap-1 overflow-hidden rounded-xl border border-truek-line bg-truek-field text-truek-placeholder transition-opacity active:opacity-80"
      >
        {value ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="Imagen de referencia" className="absolute inset-0 h-full w-full object-cover" />
            <span className="absolute bottom-2 right-2 rounded-full bg-truek-black/80 px-3 py-0.5 text-[11px] text-white">
              Cambiar
            </span>
          </>) : (
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