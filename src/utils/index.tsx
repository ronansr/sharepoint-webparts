export const extractReportId = (url: string | null): string | null => {
  if (!url) return null;
  const match = url.match(/[?&]reportId=([a-z0-9-]+)/i);
  return match ? match[1] : null;
};
