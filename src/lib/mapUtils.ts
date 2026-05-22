export type MapLocationInput = {
  address?: string | null;
  district?: string | null;
  city?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  lat?: number | string | null;
  lng?: number | string | null;
};

export function buildMapAddress(item: MapLocationInput) {
  return [item.address, item.district, item.city]
    .filter(Boolean)
    .join(", ");
}

export function buildGoogleMapsUrl(item: MapLocationInput) {
  const latitude = item.latitude ?? item.lat;
  const longitude = item.longitude ?? item.lng;

  if (latitude && longitude) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
      `${latitude},${longitude}`
    )}`;
  }

  const address = buildMapAddress(item);

  if (!address) return null;

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

export function openGoogleMaps(item: MapLocationInput, onMissingAddress?: () => void) {
  const url = buildGoogleMapsUrl(item);

  if (!url) {
    onMissingAddress?.();
    return;
  }

  window.open(url, "_blank", "noopener,noreferrer");
}
