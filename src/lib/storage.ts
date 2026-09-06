import { put } from "@vercel/blob";

export async function uploadBase64Media(base64: string, mediaType: string, pathPrefix: string): Promise<string> {
  const buffer = Buffer.from(base64, "base64");
  const ext = mediaType.split("/")[1] ?? "bin";
  const filename = `${pathPrefix}/${crypto.randomUUID()}.${ext}`;
  const blob = await put(filename, buffer, { access: "public", contentType: mediaType });
  return blob.url;
}
