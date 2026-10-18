import { CheckIcon } from "@heroicons/react/24/outline";

interface PaymentResultProps {
  title: string;
  message: string;
}

export function PaymentResult({ title, message }: PaymentResultProps) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="flex size-32 items-center justify-center rounded-full border-[2.5px] border-truek-lime shadow-[0_0_20px_rgba(211,252,49,0.3)]">
        <CheckIcon className="size-16 text-truek-lime" strokeWidth={3} />
      </div>
      <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-white">{title}</h1>
      <p className="mt-6 max-w-65 text-base leading-snug text-white">{message}</p>
    </div>
  );
}