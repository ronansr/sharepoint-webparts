import * as React from "react";
import { useEffect, useState } from "react";
import { SPFI, spfi } from "@pnp/sp";
import { SPBrowser } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import SectorCard from "./SectorCard";
import {
  ChevronLeft20Filled,
  Navigation20Regular,
  Star20Filled,
} from "@fluentui/react-icons";
import MultiLevelMenu, { IGenericNode } from "./MultiLeveMenu";
import { PowerBIService } from "../../../services/PowerBIService";
import { WebPartContext } from "@microsoft/sp-webpart-base";
import { extractReportId } from "../../../utils";
import { TabList, Tab } from "@fluentui/react-components";

export interface IDashboardProps {
  context: WebPartContext;
  siteUrl: string;
  setSelectedSector: (sectorId: string) => void;
}

// Tipos
interface IKpi {
  id: string;
  title: string;
  [key: string]: any;
}
interface ICategoria {
  id: string;
  title: string;
  kpis: IKpi[];
}
interface ITema {
  id: string;
  title: string;
  descricao?: string;
  categorias: ICategoria[];
}
interface IDiretriz {
  id: string;
  title: string;
  descricao?: string;
  temas: ITema[];
}
interface BaseDados {
  Id: number;
  Title: string;
  diretriz?: string;
  tema?: string;
  categoria?: string;
  descricao?: string;
  kpis?: any[];
  [key: string]: any;
}
export interface UsuarioListaItem {
  Id: number;
  Title: string;
  idItem?: string;
  idGrupo: number;
  nomeGrupo?: string;
  email: string;
}

const Dashboard: React.FC<IDashboardProps> = ({
  context,
  siteUrl,
  setSelectedSector,
}) => {
  const [hierarchy, setHierarchy] = useState<IDiretriz[]>([]);
  const [favoriteHierarchy, setFavoriteHierarchy] = useState<IDiretriz[]>([]);
  const [selectedDiretriz, setSelectedDiretriz] = useState<IDiretriz | null>(
    null
  );
  const [selectedTema, setSelectedTema] = useState<ITema | null>(null);
  const [selectedItemLink, setSelectedItemLink] = useState<string | null>(null);
  const [selectedKpiData, setSelectedKpiData] = useState<IKpi | null>(null);
  const [menuVisible, setMenuVisible] = useState(true);
  const [activeTab, setActiveTab] = useState<"diretrizes" | "favoritos">(
    "diretrizes"
  );

  const sp: SPFI = spfi().using(SPBrowser({ baseUrl: siteUrl }));
  const powerBIService = new PowerBIService();

  useEffect(() => {
    loadBaseDados();
  }, []);
  useEffect(() => {
    if (activeTab === "favoritos") loadFavoritos();
  }, [activeTab]);

  // ------------------------------
  // Buscar BaseDados
  // ------------------------------
  const loadBaseDados = async () => {
    try {
      const items: BaseDados[] = await sp.web.lists
        .getByTitle("BaseDados")
        .items();
      const structured = groupByHierarchy(items.filter((item) => item.status));
      setHierarchy(structured);
    } catch (error) {
      console.error("Erro ao buscar BaseDados", error);
    }
  };

  /**
   * Reconstrói uma hierarquia completa (Diretriz > Tema > Categoria > KPI)
   * a partir de QUALQUER item do BaseDados (diretriz, tema, categoria ou kpi).
   */
  const buildFullHierarchyFromBaseItem = (
    baseItem: BaseDados,
    baseDados: BaseDados[]
  ): IDiretriz | null => {
    // 1 — Encontrar a diretriz
    const dirData = baseDados.find(
      (d) => d.id0.toString() === baseItem.diretriz
    );
    if (!dirData) return null;

    const diretriz: IDiretriz = {
      id: dirData.id0.toString(),
      title: dirData.Title,
      descricao: dirData.descricao,
      temas: [],
    };

    // 2 — Se o item já contém o tema → carregar
    if (baseItem.tema) {
      const temaData = baseDados.find(
        (t) => t.id0.toString() === baseItem.tema
      );
      if (!temaData) return diretriz;

      const tema: ITema = {
        id: temaData.id0.toString(),
        title: temaData.Title,
        descricao: temaData.descricao,
        categorias: [],
      };
      diretriz.temas.push(tema);

      // 3 — Categoria
      if (baseItem.categoria) {
        const catData = baseDados.find(
          (c) => c.id0.toString() === baseItem.categoria
        );
        if (!catData) return diretriz;

        const categoria: ICategoria = {
          id: catData.id0.toString(),
          title: catData.Title,
          kpis: [],
        };
        tema.categorias.push(categoria);

        // 4 — KPIs
        if (baseItem.kpis?.length) {
          baseItem.kpis.forEach((kpiId) => {
            const kpiData = baseDados.find((k) => k.Id.toString() === kpiId);
            if (kpiData) {
              categoria.kpis.push({
                id: kpiData.Id.toString(),
                title: kpiData.Title,
                ...kpiData,
              });
            }
          });
        }
      }
    }

    return diretriz;
  };

  // ------------------------------
  // Carregar Favoritos
  // ------------------------------
  const loadFavoritos = async () => {
    try {
      const currentUserEmail = context.pageContext.user.email;

      const favoritesRaw: UsuarioListaItem[] = await sp.web.lists
        .getByTitle("UsuarioListas")
        .items();

      const favorites = favoritesRaw.filter(
        (fav) => fav.email === currentUserEmail
      );

      const baseDados: BaseDados[] = await sp.web.lists
        .getByTitle("BaseDados")
        .items();

      const structuredMap: { [key: string]: IDiretriz } = {};

      favorites.forEach((fav) => {
        const baseItem = baseDados.find((d) => d.id0.toString() === fav.idItem);
        if (!baseItem) return;

        const fullTree = buildFullHierarchyFromBaseItem(baseItem, baseDados);
        if (!fullTree) return;

        // Criar Diretriz caso não exista
        if (!structuredMap[fullTree.id]) {
          structuredMap[fullTree.id] = {
            id: fullTree.id,
            title: fullTree.title,
            temas: [],
          };
        }

        const targetDir = structuredMap[fullTree.id];

        // Processar Temas
        fullTree.temas.forEach((temaNode) => {
          let tema = targetDir.temas.find((t) => t.id === temaNode.id);
          if (!tema) {
            tema = {
              id: temaNode.id,
              title: temaNode.title,
              categorias: [],
            };
            targetDir.temas.push(tema);
          }

          // Processar Categorias
          temaNode.categorias.forEach((catNode) => {
            let categoria = tema?.categorias?.find((c) => c.id === catNode.id);
            if (!categoria) {
              categoria = {
                id: catNode.id,
                title: catNode.title,
                kpis: [],
              };
              tema?.categorias?.push(categoria);
            }

            // Processar KPIs
            catNode.kpis.forEach((kpiNode) => {
              if (!categoria?.kpis?.some((k) => k.id === kpiNode.id)) {
                categoria?.kpis.push({
                  id: kpiNode.id,
                  title: kpiNode.title,
                });
              }
            });
          });
        });
      });

      setFavoriteHierarchy(Object.values(structuredMap));
    } catch (error) {
      console.error("Erro ao carregar favoritos", error);
    }
  };

  // ------------------------------
  // Agrupamento Diretriz > Tema > Categoria
  // ------------------------------
  const groupByHierarchy = (items: BaseDados[]): IDiretriz[] => {
    const map: { [key: string]: IDiretriz } = {};
    items.forEach((item) => {
      if (!item.diretriz) return;
      if (!map[item.diretriz])
        map[item.diretriz] = {
          id: item.diretriz,
          title: item.Title,
          descricao: item.descricao,
          temas: [],
        };
      const diretriz = map[item.diretriz];

      if (item.tema) {
        let tema = diretriz.temas.find((t) => t.id === item.tema);
        if (!tema) {
          tema = {
            id: item.tema,
            title: item.Title,
            categorias: [],
            descricao: item.descricao,
          };
          diretriz.temas.push(tema);
        }

        if (item.categoria) {
          let categoria = tema.categorias.find((c) => c.id === item.categoria);
          if (!categoria) {
            categoria = { id: item.categoria, title: item.Title, kpis: [] };
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
                  ...kpiData,
                });
            });
          }
        }
      }
    });
    return Object.values(map);
  };

  // ------------------------------
  // Converter para menu
  // ------------------------------
  const convertToMenuTree = (tema: ITema): IGenericNode[] => {
    return tema.categorias.map((c) => ({
      id: c.id,
      title: c.title,
      showChildren: true,
      children: c.kpis.length
        ? c.kpis.map((k) => ({ id: k.id, title: k.title, link: k.id, data: k }))
        : [],
    }));
  };

  // ------------------------------
  // Função para salvar favorito
  // ------------------------------
  const saveFavorite = async (item: any) => {
    try {
      const currentUserEmail = context.pageContext.user.email;

      // Inserir o favorito na lista UsuarioListas
      console.log(item);
      await sp.web.lists.getByTitle("UsuarioListas").items.add({
        Title: item.title,
        email: currentUserEmail,
        addDate: new Date(),
        privado: true,
        idItem: item.id, // <- array de strings para multi-lookup de texto
        nomeGrupo: "Favoritos",
        idGrupo: 1,
      });

      console.log("Favorito salvo com sucesso!");
      // Atualiza favoritos para refletir a mudança
      loadFavoritos();
    } catch (error) {
      console.error("Erro ao salvar favorito", error);
    }
  };

  const removeFavorite = async (item: any) => {
    try {
      const currentUserEmail = context.pageContext.user.email;

      // Buscar o item correspondente
      const existingItems = await sp.web.lists
        .getByTitle("UsuarioListas")
        .items.select("Id", "idItem", "email")
        .filter(`email eq '${currentUserEmail}' and idItem eq '${item.id}'`)();

      if (existingItems.length === 0) {
        console.log("Nenhum favorito encontrado para remover.");
        return;
      }

      // Remover todos os registros encontrados
      for (const fav of existingItems) {
        await sp.web.lists
          .getByTitle("UsuarioListas")
          .items.getById(fav.Id)
          .delete();

        console.log(`Favorito removido: registro ${fav.Id}`);
      }

      // Atualiza favoritos para refletir a mudança
      loadFavoritos();
    } catch (error) {
      console.error("Erro ao remover favorito", error);
    }
  };

  const onClickFavorite = async (itemId: any) => {
    const favorited = await isFavorited(itemId);

    if (favorited) await removeFavorite(itemId);
    else await saveFavorite(itemId);
  };

  const isFavorited = async (itemId: string): Promise<boolean> => {
    try {
      const currentUserEmail = context.pageContext.user.email;

      const result: UsuarioListaItem[] = await sp.web.lists
        .getByTitle("UsuarioListas")
        .items.select("Id", "idItem", "idGrupo", "email")
        .filter(
          `email eq '${currentUserEmail}' and idGrupo eq 1 and idItem eq '${itemId}'`
        )();

      console.log("result ", result);

      return result.length > 0;
    } catch (err) {
      console.error("Erro ao verificar favoritos:", err);
      return false;
    }
  };

  // ------------------------------
  // Render Breadcrumb
  // ------------------------------
  const renderBreadcrumb = () => {
    if (!selectedDiretriz && !selectedTema) return null;
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 20,
          fontSize: 14,
          borderTopWidth: 1,
          borderColor: "black",
        }}
      >
        {(selectedDiretriz || selectedTema) && (
          <div
            onClick={handleBack}
            style={{
              cursor: "pointer",
              padding: 6,
              borderRadius: 6,
              background: "#eee",
              display: "flex",
              alignItems: "center",
            }}
          >
            <ChevronLeft20Filled color="black" />
          </div>
        )}
        <span
          style={{
            cursor: "pointer",
            fontWeight: !selectedDiretriz ? "bold" : "normal",
          }}
          onClick={() => {
            setSelectedTema(null);
            setSelectedDiretriz(null);
          }}
        >
          Diretrizes
        </span>
        {selectedDiretriz && (
          <>
            {" "}
            <span>{">"}</span>{" "}
            <span
              style={{
                cursor: "pointer",
                fontWeight: !selectedTema ? "bold" : "normal",
              }}
              onClick={() => setSelectedTema(null)}
            >
              {selectedDiretriz.title}
            </span>{" "}
          </>
        )}
        {selectedTema && (
          <>
            {" "}
            <span>{">"}</span>{" "}
            <span style={{ fontWeight: "bold" }}>{selectedTema.title}</span>{" "}
          </>
        )}
      </div>
    );
  };

  const handleBack = () => {
    if (selectedTema) setSelectedTema(null);
    else if (selectedDiretriz) setSelectedDiretriz(null);
  };

  // ------------------------------
  // Render Diretrizes/Temas/Categorias
  // ------------------------------
  const renderDiretrizes = (data: IDiretriz[]) =>
    data.map((d) => (
      <SectorCard
        key={d.id}
        id={d.id}
        title={d.title}
        description={d.descricao}
        onClick={() => setSelectedDiretriz(d)}
        onStarClick={() => onClickFavorite(d)}
        context={context}
        siteUrl={siteUrl}
      />
    ));
  const renderTemas = (data: IDiretriz[]) =>
    selectedDiretriz?.temas.map((t) => (
      <SectorCard
        key={t.id}
        id={t.id}
        title={t.title}
        description="Tema"
        onClick={() => setSelectedTema(t)}
        onStarClick={() => onClickFavorite(t)}
        context={context}
        siteUrl={siteUrl}
      />
    ));
  const renderCategorias = (data: IDiretriz[]) => {
    if (!selectedTema) return null;
    const menuData = convertToMenuTree(selectedTema);
    return (
      <div style={{ display: "flex", width: "100%", gap: 5 }}>
        <MultiLevelMenu
          data={menuData}
          onSelect={(item) => {
            setSelectedItemLink(item.link || item.id);
            setSelectedSector(item.id);
            setSelectedKpiData(item.data || null);
            if (item.data?.link?.Url)
              powerBIService.embedReport(
                context,
                item.data.link.Url,
                extractReportId(item.data.link.Url) ?? ""
              );
          }}
          menuVisible={menuVisible}
          onToggleMenu={setMenuVisible}
        />
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {selectedKpiData && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 16px",
                background: "#f0f0f0",
                borderRadius: 5,
                fontWeight: 600,
                fontSize: 16,
                marginBottom: 8,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Navigation20Regular
                  style={{ cursor: "pointer" }}
                  onClick={() => setMenuVisible(!menuVisible)}
                />
                <span>{selectedKpiData.title}</span>
              </div>

              <Star20Filled
                style={{ color: "#f4b400" }}
                onClick={() => saveFavorite(selectedKpiData)}
              />
            </div>
          )}
          <div
            id="reportContainer"
            style={{
              flex: 1,
              minHeight: 400,
              padding: 5,
              border: "1px solid #ccd",
              borderRadius: 8,
              background: "#fff",
            }}
          >
            {!selectedItemLink && (
              <div style={{ color: "#666" }}>
                Selecione um item no menu ao lado.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const getContent = () => {
    const data = activeTab === "diretrizes" ? hierarchy : favoriteHierarchy;

    console.log("favoriteHierarchy", favoriteHierarchy);

    if (activeTab === "favoritos") {
      const menuData: IGenericNode[] = [];

      data.forEach((diretriz: IDiretriz) => {
        diretriz.temas.forEach((tema: ITema) => {
          tema.categorias.forEach((categoria: ICategoria) => {
            const node: IGenericNode = {
              id: categoria.id,
              title: categoria.title,
              showChildren: true,
              children: categoria.kpis.map((k: IKpi) => ({
                id: k.id,
                title: k.title,
                link: k.id,
                data: k,
              })),
            };
            menuData.push(node);
          });
        });
      });

      return (
        <div style={{ display: "flex", width: "100%", gap: 5 }}>
          <MultiLevelMenu
            data={menuData}
            onSelect={(item) => {
              setSelectedItemLink(item.link || item.id);
              setSelectedSector(item.id);
              setSelectedKpiData(item.data || null);

              if (item.data?.link?.Url)
                powerBIService.embedReport(
                  context,
                  item.data.link.Url,
                  extractReportId(item.data.link.Url) ?? ""
                );
            }}
            menuVisible={menuVisible}
            onToggleMenu={setMenuVisible}
          />

          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            {selectedKpiData && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 16px",
                  background: "#f0f0f0",
                  borderRadius: 5,
                  fontWeight: 600,
                  fontSize: 16,
                  marginBottom: 8,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Navigation20Regular
                    style={{ cursor: "pointer" }}
                    onClick={() => setMenuVisible(!menuVisible)}
                  />
                  <span>{selectedKpiData.title}</span>
                </div>

                <Star20Filled
                  style={{ color: "#f4b400" }}
                  onClick={() => saveFavorite(selectedKpiData)}
                />
              </div>
            )}

            <div
              id="reportContainer"
              style={{
                flex: 1,
                minHeight: 400,
                padding: 5,
                border: "1px solid #ccd",
                borderRadius: 8,
                background: "#fff",
              }}
            >
              {!selectedItemLink && (
                <div style={{ color: "#666" }}>
                  Selecione um item no menu à esquerda.
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    // 🔥 Comportamento normal quando estiver em DIRETRIZES
    if (!selectedDiretriz) return renderDiretrizes(data);
    if (!selectedTema) return renderTemas(data);
    return renderCategorias(data);
  };

  // ------------------------------
  // Render Principal
  // ------------------------------
  return (
    <div>
      <TabList
        selectedValue={activeTab}
        onTabSelect={(e, data) =>
          setActiveTab(data.value as "diretrizes" | "favoritos")
        }
        style={{
          marginBottom: 10,
        }}
      >
        <Tab value="diretrizes">Diretrizes</Tab>
        <Tab value="favoritos">Favoritos</Tab>
      </TabList>
      {renderBreadcrumb()}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
        {getContent()}
      </div>
    </div>
  );
};

export default Dashboard;
