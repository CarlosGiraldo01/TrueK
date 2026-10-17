export function placeholderImage(label: string, color = "#2A2A29"): string {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="400" viewBox="0 0 500 400">` +
    `<rect width="500" height="400" fill="${color}"/>` +
    `<text x="250" y="215" font-family="sans-serif" font-size="40" fill="#8A8A8A" text-anchor="middle">${label}</text>` +
    `</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}