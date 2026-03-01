import { createClient } from "@/lib/supabase/client";

const BUCKET = "budget-logos";

/**
 * Faz upload de uma imagem (logo) para o Supabase Storage e retorna a URL pública.
 * É necessário criar o bucket "budget-logos" no Supabase e torná-lo público.
 */
export async function uploadLogo(
  file: File,
  userId: string
): Promise<string> {
  const supabase = createClient();
  const ext = file.name.split(".").pop() ?? "png";
  const path = `${userId}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) throw error;

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return publicUrl;
}
