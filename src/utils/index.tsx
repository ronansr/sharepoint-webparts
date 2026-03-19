import { BaseDados } from "../interfaces/BaseDados";

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

export const getCleanModeFromUrl = (): boolean => {
  const params = new URLSearchParams(window.location.search);
  return params.get("cleanMode") === "true";
};

export  const groupByHierarchy = (items: BaseDados[]): IDiretriz[] => {
    const map: { [key: string]: IDiretriz } = {};
    items.forEach((item) => {
      if (!item.diretriz) return;
      if (!map[item.diretriz]) {
        const dirOriginal = items.find(d => d.id0 === item.diretriz);
        if(!dirOriginal) {console.warn ('nao encontrou diretriz ', item.diretriz); return;}
        map[item.diretriz] = {
          id: dirOriginal?.id0 || item.diretriz,
          title: dirOriginal.Title,
          descricao: dirOriginal.descricao,
          temas: [],
          extradata: dirOriginal?.extradata ? JSON.parse(dirOriginal.extradata) : null,
          ids_persona: dirOriginal?.ids_persona?.map(i => i.Title) || [],
          ordemExibicao: dirOriginal?.ordemExibicao || 0,
          kpiAlerta: dirOriginal?.kpiAlerta || false
        };
      }
      const diretriz = map[item.diretriz];

      if (item.tema) {
        let tema = diretriz.temas.find((t) => t.id === item.tema);
        if (!tema) {
          const temaOriginal = items.find(d => d.id0?.trim() == item.tema?.trim());
          
          if(!temaOriginal) {
            console.log(items.find(i => i.id0 === 'D2.4'));
            console.warn ('nao encontrou temaOriginal ', item); return;}
          tema = {
            id: temaOriginal.id0 || item.tema,
            title: temaOriginal.Title,
            categorias: [],
            descricao: temaOriginal.descricao,
            ids_persona: temaOriginal?.ids_persona?.map(i => i.Title) || [],
            ordemExibicao: temaOriginal?.ordemExibicao || 0,
            kpiAlerta: temaOriginal?.kpiAlerta || false

          };
          diretriz.temas.push(tema);
        }

        if (item.categoria) {
          let categoria = tema.categorias.find((c) => c.id === item.categoria);
          if (!categoria) {
                      const categoriaOriginal = items.find(d => d.id0 === item.categoria);
          if(!categoriaOriginal) {console.warn ('nao encontrou categoriaOriginal ', item.categoria); return;}
            categoria = {
              id: categoriaOriginal?.id0 || item.categoria,
              title: categoriaOriginal.Title,
              kpis: [],
              link: categoriaOriginal.link,
              ids_persona: categoriaOriginal?.ids_persona?.map(i => i.Title) || [],
              ordemExibicao: categoriaOriginal?.ordemExibicao || 0,
              kpiAlerta: categoriaOriginal?.kpiAlerta || false


            };
            tema.categorias.push(categoria);
          }

          if (categoria && item.kpisId?.length) {
            item.kpisId.forEach((kId: any) => {
              const kpiData = items.find((i) => i.Id === kId);
              if (
                kpiData &&
                !categoria?.kpis?.find((k) => k.id === kId.toString())
              )
                categoria?.kpis?.push({
                  id: kId.toString(),
                  title: kpiData.Title,
                  ids_persona: kpiData?.ids_persona?.map(i => i.Title) || [],
                  ordemExibicao: kpiData?.ordemExibicao || 0,
                  kpiAlerta: kpiData?.kpiAlerta || false,

                  ...kpiData,
                });
            });
          }
        }
      }
    });

    const result = Object.values(map);

    /* ===================== ORDENAÇÃO ===================== */
    const sortByOrdem = (a: any, b: any) =>
      (a.ordemExibicao ?? 9999) - (b.ordemExibicao ?? 9999);

    result.forEach((diretriz) => {
      // Ordena temas
      diretriz.temas.sort(sortByOrdem);

      diretriz.temas.forEach((tema) => {
        // Ordena categorias
        tema.categorias.sort(sortByOrdem);

        tema.categorias.forEach((categoria) => {
          // Ordena KPIs
          categoria.kpis.sort(sortByOrdem);
        });
      });
    });

    // Ordena diretrizes
    result.sort(sortByOrdem);

    console.log("Resultado da hierarquia ordenada: ", result)

    return result;
  };

export const filterHierarchyByPersona = (
    userPersonaIds: string[],
    hierarchy: IDiretriz[]
  ): IDiretriz[] => {
    const hasAccess = (ids_persona?: string[]) => {
      if (!ids_persona || ids_persona.length === 0) return true;
      return ids_persona.some(id => userPersonaIds.includes(id));
    };

    return hierarchy
      .filter((diretriz) => hasAccess(diretriz.ids_persona))
      .map((diretriz) => ({
        ...diretriz,
        temas: diretriz.temas
          .filter((tema) => hasAccess(tema.ids_persona))
          .map((tema) => ({
            ...tema,
            categorias: tema.categorias
              .filter((categoria) => hasAccess(categoria.ids_persona))
              .map((categoria) => ({
                ...categoria,
                kpis: categoria.kpis.filter((kpi) =>
                  hasAccess(kpi.ids_persona)
                ),
              })),
          })),
      }));
  };

export const hierarchyToBaseDados = (hierarchy: IDiretriz[]): any[] => {
  const result: BaseDados[] = [];

  hierarchy.forEach((diretriz) => {
    // Diretriz
    result.push({
      id0: diretriz.id,
      Title: diretriz.title,
      descricao: diretriz.descricao,
      diretriz: diretriz.id,
      tema: null,
      categoria: null,
      kpisId: [],
      extradata: diretriz.extradata
        ? JSON.stringify(diretriz.extradata)
        : null,
      ids_persona: diretriz.ids_persona || [],
    } as unknown as BaseDados);

    diretriz.temas?.forEach((tema) => {
      // Tema
      result.push({
        id0: tema.id,
        Title: tema.title,
        descricao: tema.descricao,
        diretriz: diretriz.id,
        tema: tema.id,
        categoria: null,
        kpisId: [],
        ids_persona: tema.ids_persona || [],
      } as unknown as BaseDados);

      tema.categorias?.forEach((categoria) => {
        // Categoria
        result.push({
          id0: categoria.id,
          Title: categoria.title,
          diretriz: diretriz.id,
          tema: tema.id,
          categoria: categoria.id,
          link: categoria.link,
          kpisId: categoria.kpis?.map((k) => Number(k.id)) || [],
          ids_persona: categoria.ids_persona || [],
        } as unknown as BaseDados);

        // KPIs
        categoria.kpis?.forEach((kpi) => {
          result.push({
            ...kpi,
            Id: Number(kpi.id),
            diretriz: diretriz.id,
            tema: tema.id,
            categoria: categoria.id,
            ids_persona: kpi.ids_persona || [],
          } as unknown as BaseDados);
        });
      });
    });
  });

  return result;
};
