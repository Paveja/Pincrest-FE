import { apiRequest } from "@/services/api-client";
import {
  parseCollection,
  parseEntity,
  parsePin,
  type Pin,
} from "@/services/content";

export async function getMyPins(signal?: AbortSignal): Promise<Pin[]> {
  const payload = await apiRequest<unknown>("api/v1/pins/mine", { signal });
  return parseCollection(payload, "pins", parsePin);
}

export async function getPin(
  pinId: string,
  signal?: AbortSignal,
): Promise<Pin> {
  const payload = await apiRequest<unknown>(
    `api/v1/pins/${encodeURIComponent(pinId)}`,
    { signal },
  );
  return parseEntity(payload, "pin", parsePin);
}
