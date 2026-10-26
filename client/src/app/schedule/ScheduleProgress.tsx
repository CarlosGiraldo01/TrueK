//barra de progreso 
const STEPS = 3;

export function ScheduleProgress({ step }: { step: 1 | 2 | 3 }) {
  return (
    <div className="px-5 pt-4" aria-label={`Paso ${step} de ${STEPS}`}>
      <div className="h-1 w-full overflow-hidden rounded-full bg-truek-field">
        <div
          style={{ width: `${(step / STEPS) * 100}%` }}
          className="h-full rounded-full bg-truek-orange transition-[width] duration-500"
        />
      </div>
    </div>
  );
}
