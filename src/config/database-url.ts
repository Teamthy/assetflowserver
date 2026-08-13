export const sanitizeDatabaseUrl = (url: string): string => {
  try {
    const parsed = new URL(url);
    parsed.searchParams.delete("channel_binding");
    parsed.searchParams.delete("sslmode");
    parsed.searchParams.delete("uselibpqcompat");
    return parsed.toString();
  } catch {
    return url
      .replace(/([?&])(channel_binding|sslmode|uselibpqcompat)=[^&]*&?/g, "$1")
      .replace(/[?&]$/, "");
  }
};
