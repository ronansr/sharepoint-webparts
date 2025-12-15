export const extractReportId = (url: string | null): string | null => {
  if (!url) return null;
  const match = url.match(/[?&]reportId=([a-z0-9-]+)/i);
  return match ? match[1] : null;
};

export const normalizeText = (value?: string) =>
  (value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

export const filterHierarchy = (
  data: IDiretriz[],
  search: string
): IDiretriz[] => {
  if (!search.trim()) return data;

  const term = normalizeText(search);

  return data
    .map((d) => {
      const diretrizMatch = normalizeText(d.title).includes(term);

      const temas = d.temas
        .map((t) => {
          const temaMatch = normalizeText(t.title).includes(term);

          const categorias = t.categorias
            .map((c) => {
              const categoriaMatch = normalizeText(c.title).includes(term);

              const kpis = c.kpis.filter((k) =>
                normalizeText(k.title).includes(term)
              );

              if (categoriaMatch || kpis.length > 0) {
                return { ...c, kpis };
              }

              return null;
            })
            .filter(Boolean) as ICategoria[];

          if (temaMatch || categorias.length > 0) {
            return { ...t, categorias };
          }

          return null;
        })
        .filter(Boolean) as ITema[];

      if (diretrizMatch || temas.length > 0) {
        return { ...d, temas };
      }

      return null;
    })
    .filter(Boolean) as IDiretriz[];
};
