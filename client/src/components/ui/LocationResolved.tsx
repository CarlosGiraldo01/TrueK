interface LocationResolvedProps {
  displayName: string | null;
}

// Vista previa de la ubicación encontrada para que el usuario confirme que es la correcta
export const LocationResolved = ({ displayName }: LocationResolvedProps) => {
  if (!displayName) return null;
  return <p className="text-xs text-[#8A8A8A]">📍 {displayName}</p>;
};
