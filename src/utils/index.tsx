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

      // 🔹 Se a diretriz bate → retorna tudo
      if (diretrizMatch) {
        return d;
      }

      const temas = d.temas
        .map((t) => {
          const temaMatch = normalizeText(t.title).includes(term);

          // 🔹 Se o tema bate → retorna tema completo
          if (temaMatch) {
            return t;
          }

          const categorias = t.categorias
            .map((c) => {
              const categoriaMatch = normalizeText(c.title).includes(term);

              // 🔹 Se categoria bate → retorna categoria completa
              if (categoriaMatch) {
                return c;
              }

              const kpis = c.kpis.filter((k) =>
                normalizeText(k.title).includes(term)
              );

              if (kpis.length > 0) {
                return { ...c, kpis };
              }

              return null;
            })
            .filter(Boolean) as ICategoria[];

          if (categorias.length > 0) {
            return { ...t, categorias };
          }

          return null;
        })
        .filter(Boolean) as ITema[];

      if (temas.length > 0) {
        return { ...d, temas };
      }

      return null;
    })
    .filter(Boolean) as IDiretriz[];
};

export const generateIdGrupo = (): string => {
  const agora = new Date();

  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const dia = String(agora.getDate()).padStart(2, "0");
  const hora = String(agora.getHours()).padStart(2, "0");
  const minuto = String(agora.getMinutes()).padStart(2, "0");
  const segundo = String(agora.getSeconds()).padStart(2, "0");

  return `${ano}${mes}${dia}${hora}${minuto}${segundo}`;
};
