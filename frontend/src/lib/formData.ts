/** Builds a multipart body from a plain payload object: `undefined`/`null` are left out (so an
 * optional field the user didn't fill is simply absent, same as the JSON path), booleans become
 * "true"/"false", and a `File` is appended as a file part. Used by the forms that carry an image. */
export function toFormData(payload: object): FormData {
  const form = new FormData();
  for (const [key, value] of Object.entries(payload as Record<string, unknown>)) {
    if (value === undefined || value === null) continue;
    if (value instanceof File) form.append(key, value);
    else if (typeof value === "boolean") form.append(key, value ? "true" : "false");
    else form.append(key, String(value));
  }
  return form;
}
