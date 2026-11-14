const EARTH_RADIUS_KM = 6371;

// Devuelve una expresión SQL (en km) con la fórmula de haversine:
//   d = 2·R·asin( √( sin²(Δφ/2) + cos φ1 · cos φ2 · sin²(Δλ/2) ) )
//   R = 6371 km, φ = latitud, λ = longitud, todo en radianes (radians() en SQL).
// SEGURIDAD: los argumentos se interpolan tal cual. Deben ser identificadores o
// placeholders escritos por nuestro código ("p.latitude", "$1"), NUNCA input del usuario.
// least(1.0, …) evita NaN por redondeo de punto flotante cuando los puntos coinciden;
// greatest(0.0, …) evita una raíz de un negativo ínfimo cerca de los polos.
export const haversineKmSql = (
  lat1: string,
  lng1: string,
  lat2: string,
  lng2: string
): string => {
  const dLat = `(radians(${lat2}) - radians(${lat1}))`;
  const dLng = `(radians(${lng2}) - radians(${lng1}))`;
  const a = `least(1.0, greatest(0.0, power(sin(${dLat} / 2), 2) + cos(radians(${lat1})) * cos(radians(${lat2})) * power(sin(${dLng} / 2), 2)))`;
  return `(2 * ${EARTH_RADIUS_KM} * asin(least(1.0, sqrt(${a}))))`;
};
