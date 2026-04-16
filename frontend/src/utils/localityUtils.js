/**
 * Cleans a full Google Maps formatted address into a short "Locality, City" label.
 * e.g. "Koregaon Park, Pune, Maharashtra 411001, India" → "Koregaon Park, Pune"
 */
export function cleanLocalityName(fullAddress) {
  if (!fullAddress) return '';

  // Remove country
  let clean = fullAddress.replace(', India', '').trim();

  // Remove PIN codes (6-digit numbers)
  clean = clean.replace(/\s\d{6}/g, '').trim();

  // Keep only first 2 parts: "Locality, City"
  const parts = clean.split(',').map(p => p.trim());

  if (parts.length >= 2) {
    return `${parts[0]}, ${parts[1]}`;
  }
  return parts[0];
}
