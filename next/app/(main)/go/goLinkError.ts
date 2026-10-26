type ValidationDetails = {
  fieldErrors?: Record<string, string[] | undefined>;
};

const FIELD_LABELS: Record<string, string> = {
  golink: "Title",
  url: "URL",
  description: "Description",
};

/** Turns a failed /api/golinks response into a message the modal can show. */
export async function getGoLinkErrorMessage(
  response: Response
): Promise<string> {
  const data = (await response.json().catch(() => null)) as {
    error?: string;
    details?: ValidationDetails;
  } | null;

  const fieldMessages = Object.entries(data?.details?.fieldErrors ?? {})
    .filter(([, messages]) => messages && messages.length > 0)
    .map(
      ([field, messages]) => `${FIELD_LABELS[field] ?? field} ${messages![0]}`
    );

  if (fieldMessages.length > 0) return fieldMessages.join(". ");
  return data?.error ?? "Something went wrong. Please try again.";
}
