import configPromise from "@payload-config";
import { getPayload } from "payload";

let payloadPromise: ReturnType<typeof getPayload> | null = null;

export async function getPayloadClient() {
  if (!payloadPromise) {
    payloadPromise = getPayload({
      config: configPromise,
    });
  }

  return payloadPromise;
}
