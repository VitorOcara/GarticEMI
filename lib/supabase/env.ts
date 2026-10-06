/** URL do projeto (Settings → API → Project URL), sem /rest/v1 */
export function normalizeSupabaseProjectUrl(raw: string): string {
  let url = raw.trim();
  url = url.replace(/\/rest\/v1\/?$/i, "");
  url = url.replace(/\/+$/, "");
  return url;
}

export function assertSupabaseProjectUrl(url: string): void {
  if (!/^https?:\/\/.+/i.test(url)) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL deve ser a URL do projeto (https://xxxx.supabase.co), sem /rest/v1"
    );
  }
  if (/\/rest\/v1/i.test(url)) {
    throw new Error(
      "Remova /rest/v1 da URL. Use apenas https://xxxx.supabase.co"
    );
  }
}
