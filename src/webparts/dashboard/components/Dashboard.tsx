import * as React from "react";
import { useEffect, useRef, useState } from "react";
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
  ArrowExpand20Regular,
} from "@fluentui/react-icons";
import MultiLevelMenu, { IGenericNode } from "./MultiLeveMenu";
import { PowerBIService } from "../../../services/PowerBIService";
import { WebPartContext } from "@microsoft/sp-webpart-base";
import { extractReportId, filterHierarchy } from "../../../utils";
import { TabList, Tab } from "@fluentui/react-components";

export interface IDashboardProps {
  context: WebPartContext;
  siteUrl: string;
  setSelectedSector: (sectorId: string) => void;
}

// Tipos

interface BaseDados {
  Id: number;
  Title: string;
  id0?: string;
  diretriz?: string;
  tema?: string;
  categoria?: string;
  descricao?: string;
  kpis?: any[];
  kpisId?: any[];
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
  const [isFavoritedItem, setFavoritedItem] = useState(false);
  const [activeTab, setActiveTab] = useState<"diretrizes" | "favoritos">(
    "diretrizes"
  );
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchText, setSearchText] = useState("");

  const sp: SPFI = spfi().using(SPBrowser({ baseUrl: siteUrl }));
  const powerBIServiceRef = React.useRef<PowerBIService | null>(null);

  if (!powerBIServiceRef.current) {
    powerBIServiceRef.current = new PowerBIService();
  }

  const powerBIService = powerBIServiceRef.current;

  useEffect(() => {
    loadBaseDados();
  }, []);

  useEffect(() => {
    if (activeTab === "favoritos") loadFavoritos();
  }, [activeTab]);

  useEffect(() => {
    if (selectedKpiData)
      isFavorited(selectedKpiData?.id).then((resp) => setFavoritedItem(resp));
  }, [selectedKpiData]);

  useEffect(() => {
    // 🔄 Resetar seleção ao trocar de aba
    setSelectedKpiData(null);
    setSelectedItemLink(null);
    setSelectedDiretriz(null);
    setSelectedTema(null);
    setMenuVisible(true);
    // powerBIService.clearReport();

    // // Opcional: sair do fullscreen se estiver ativo
    // if (isFullscreen) {
    //   powerBIService.toggleFullscreen(true);
    //   setIsFullscreen(false);
    // }
  }, [activeTab]);

  useEffect(() => {
    const handler = (e: Event) => {
      const custom = e as CustomEvent<{ text: string }>;
      setSearchText(custom.detail.text);
    };

    window.addEventListener("dashboard-search", handler);

    return () => {
      window.removeEventListener("dashboard-search", handler);
    };
  }, []);

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

  // ------------------------------
  // Carregar Favoritos - CORRIGIDO
  // ------------------------------
  const loadFavoritos = async () => {
    try {
      const currentUserEmail = context.pageContext.user.email;

      // 1. Buscar favoritos do usuário
      const favoritesRaw: UsuarioListaItem[] = await sp.web.lists
        .getByTitle("UsuarioListas")
        .items();

      const favorites = favoritesRaw.filter(
        (fav) => fav.email === currentUserEmail && fav.idGrupo === 1
      );

      if (favorites.length === 0) {
        setFavoriteHierarchy([]);
        return;
      }

      const hierarchyFav = getFavoritesOnly(hierarchy, favorites);

      console.log(hierarchyFav);

      setFavoriteHierarchy(hierarchyFav);

      return;

      // 2. Buscar todos os itens da BaseDados
      const baseDados: BaseDados[] = await sp.web.lists
        .getByTitle("BaseDados")
        .items();

      // 3. Criar mapa para acesso rápido
      const itemMap: { [key: string]: BaseDados } = {};
      baseDados.forEach((item) => {
        if (item.id0) {
          itemMap[item.id0] = item;
        }
      });

      // 4. Estrutura para armazenar hierarquia de favoritos
      const structuredMap: { [key: string]: IDiretriz } = {};

      // 5. Para cada favorito, reconstruir a hierarquia completa
      favorites.forEach((fav) => {
        const favItem = itemMap[fav.idItem || ""];
        if (!favItem) return;

        // Determinar o tipo do item favorito
        const isDiretriz = favItem.diretriz && !favItem.tema;
        const isTema = favItem.diretriz && favItem.tema && !favItem.categoria;
        const isCategoria =
          favItem.diretriz &&
          favItem.tema &&
          favItem.categoria &&
          !favItem.kpisId;
        const isKpi = favItem.categoria && favItem.kpisId;

        // Buscar a Diretriz
        const diretrizId = favItem.diretriz || favItem.id0;
        const diretrizItem = itemMap[diretrizId || ""];
        if (!diretrizItem) return;

        // Criar/Obter Diretriz
        if (!structuredMap[diretrizId || ""]) {
          structuredMap[diretrizId || ""] = {
            id: diretrizId || "",
            title: diretrizItem.Title,
            descricao: diretrizItem.descricao,
            temas: [],
          };
        }
        const diretriz = structuredMap[diretrizId || ""];

        // Se for apenas diretriz, já está ok
        if (isDiretriz) return;

        // Buscar o Tema
        const temaId = favItem.tema || (isTema ? favItem.id0 : null);
        if (!temaId) return;

        const temaItem = itemMap[temaId];
        if (!temaItem) return;

        // Criar/Obter Tema
        let tema = diretriz.temas.find((t) => t.id === temaId);
        if (!tema) {
          tema = {
            id: temaId,
            title: temaItem.Title,
            descricao: temaItem.descricao,
            categorias: [],
          };
          diretriz.temas.push(tema);
        }

        // Se for apenas tema, já está ok
        if (isTema) return;

        // Buscar a Categoria
        const categoriaId =
          favItem.categoria || (isCategoria ? favItem.id0 : null);
        if (!categoriaId) return;

        const categoriaItem = itemMap[categoriaId];
        if (!categoriaItem) return;

        // Criar/Obter Categoria
        let categoria = tema.categorias.find((c) => c.id === categoriaId);
        if (!categoria) {
          categoria = {
            id: categoriaId,
            title: categoriaItem.Title,
            kpis: [],
          };
          tema.categorias.push(categoria);
        }

        // Se for apenas categoria, já está ok
        if (isCategoria) return;

        // Buscar KPIs da categoria
        if (categoriaItem.kpisId && categoriaItem.kpisId.length > 0) {
          categoriaItem.kpisId.forEach((kpiId: any) => {
            const kpiItem = baseDados.find((k) => k.Id === kpiId);
            if (
              kpiItem &&
              !categoria?.kpis.find((k) => k.id === kpiId.toString())
            ) {
              categoria?.kpis.push({
                id: kpiId.toString(),
                title: kpiItem.Title,
                ...kpiItem,
              });
            }
          });
        }
      });

      setFavoriteHierarchy(Object.values(structuredMap));
      console.log(
        "Hierarquia de favoritos carregada:",
        Object.values(structuredMap)
      );
    } catch (error) {
      console.error("Erro ao carregar favoritos", error);
      setFavoriteHierarchy([]);
    }
  };

  const getFavoritesOnly = (
    hierarchy: IDiretriz[],
    favorites: UsuarioListaItem[]
  ): IDiretriz[] => {
    const favoriteIds = new Set(favorites.map((f) => f.idItem));

    return hierarchy
      .map((diretriz) => {
        // 1️⃣ Favorito é a DIRETRIZ
        if (favoriteIds.has(diretriz.id)) {
          return diretriz;
        }

        // 2️⃣ Filtrar TEMAS
        const temasFiltrados = diretriz.temas
          .map((tema) => {
            // Tema favoritado
            if (favoriteIds.has(tema.id)) {
              return tema;
            }

            // 3️⃣ Filtrar CATEGORIAS
            const categoriasFiltradas = tema.categorias
              .map((categoria) => {
                // Categoria favoritada
                if (favoriteIds.has(categoria.id)) {
                  return categoria;
                }

                // 4️⃣ Filtrar KPIs
                const kpisFiltrados = categoria.kpis.filter((kpi) =>
                  favoriteIds.has(kpi.id)
                );

                if (kpisFiltrados.length > 0) {
                  return {
                    ...categoria,
                    kpis: kpisFiltrados,
                  };
                }

                return null;
              })
              .filter(Boolean) as ICategoria[];

            if (categoriasFiltradas.length > 0) {
              return {
                ...tema,
                categorias: categoriasFiltradas,
              };
            }

            return null;
          })
          .filter(Boolean) as ITema[];

        if (temasFiltrados.length > 0) {
          return {
            ...diretriz,
            temas: temasFiltrados,
          };
        }

        return null;
      })
      .filter(Boolean) as IDiretriz[];
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
            categoria = {
              id: item.categoria,
              title: item.Title,
              kpis: [],
              link: item.link,
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

  const convertHierarchyToMenuTree = (node: any): IGenericNode => {
    // Detecta filhos possíveis em qualquer nível
    const children = node.temas || node.categorias || node.kpis || [];

    return {
      id: node.id,
      title: node.title,
      showChildren: true,
      link: node.link, // só KPIs normalmente terão
      data: node,
      children: Array.isArray(children)
        ? children.map((child) => convertHierarchyToMenuTree(child))
        : [],
    };
  };

  const convertHierarchyListToMenuTree = (nodes: any[]): IGenericNode[] => {
    return nodes.map((node) => convertHierarchyToMenuTree(node));
  };

  // ------------------------------
  // Função para salvar favorito
  // ------------------------------
  const saveFavorite = async (item: any) => {
    try {
      const currentUserEmail = context.pageContext.user.email;

      await sp.web.lists.getByTitle("UsuarioListas").items.add({
        Title: item.title,
        email: currentUserEmail,
        addDate: new Date(),
        privado: true,
        idItem: item.id,
        nomeGrupo: "Favoritos",
        idGrupo: 1,
      });

      console.log("Favorito salvo com sucesso!");
      loadFavoritos();
    } catch (error) {
      console.error("Erro ao salvar favorito", error);
    }
  };

  const removeFavorite = async (item: any) => {
    try {
      const currentUserEmail = context.pageContext.user.email;

      const existingItems = await sp.web.lists
        .getByTitle("UsuarioListas")
        .items.select("Id", "idItem", "email")
        .filter(`email eq '${currentUserEmail}' and idItem eq '${item.id}'`)();

      if (existingItems.length === 0) {
        console.log("Nenhum favorito encontrado para remover.");
        return;
      }

      for (const fav of existingItems) {
        await sp.web.lists
          .getByTitle("UsuarioListas")
          .items.getById(fav.Id)
          .delete();

        console.log(`Favorito removido: registro ${fav.Id}`);
      }

      loadFavoritos();
    } catch (error) {
      console.error("Erro ao remover favorito", error);
    }
  };

  const onClickFavorite = async (itemId: any) => {
    const favorited = await isFavorited(itemId.id);

    if (favorited) {
      await removeFavorite(itemId);
      // setSelectedKpiData(null);
    } else await saveFavorite(itemId);

    setFavoritedItem(!favorited);
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

      return result.length > 0;
    } catch (err) {
      console.error("Erro ao verificar favoritos:", err);
      return false;
    }
  };

  const handleToggleFullscreen = () => {
    // console.log("isFullscreen", isFullscreen);
    powerBIService.toggleFullscreen(false);
    // setIsFullscreen((prev) => !prev);
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
        description={t.descricao}
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

              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {/* Botão Tela Cheia */}
                <div
                  onClick={handleToggleFullscreen}
                  title={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
                  style={{
                    cursor: "pointer",
                    padding: 4,
                    borderRadius: 6,
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  {isFullscreen ? (
                    <ArrowExpand20Regular />
                  ) : (
                    <ArrowExpand20Regular />
                  )}
                </div>

                {/* Favorito */}
                <Star20Filled
                  style={{
                    color: isFavoritedItem ? "#f4b400" : "grey",
                    cursor: "pointer",
                  }}
                  onClick={() => onClickFavorite(selectedKpiData)}
                />
              </div>
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
            {/* Nenhum item selecionado */}
            {!selectedKpiData && (
              <div style={{ color: "#666" }}>
                Selecione um item no menu ao lado.
              </div>
            )}

            {/* Item selecionado SEM link */}
            {selectedKpiData && !selectedKpiData?.link?.Url && (
              <div
                style={{
                  color: "#999",
                  fontSize: 16,
                  fontWeight: 500,
                }}
              >
                Sem link do Relatório
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };
  const renderFavorites = (data: IDiretriz[]) => {
    if (!data || data.length === 0) {
      return renderEmptyFavorites();
    }
    const menuData = convertHierarchyListToMenuTree(data);
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
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {/* Botão Tela Cheia */}
                <div
                  onClick={handleToggleFullscreen}
                  title={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
                  style={{
                    cursor: "pointer",
                    padding: 4,
                    borderRadius: 6,
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  {isFullscreen ? (
                    <ArrowExpand20Regular />
                  ) : (
                    <ArrowExpand20Regular />
                  )}
                </div>

                {/* Favorito */}
                <Star20Filled
                  style={{
                    color: isFavoritedItem ? "#f4b400" : "grey",
                    cursor: "pointer",
                  }}
                  onClick={() => onClickFavorite(selectedKpiData)}
                />
              </div>
              {/* <Star20Filled
                style={{ color: isFavoritedItem ? "#f4b400" : "grey" }}
                onClick={() => onClickFavorite(selectedKpiData)}
              /> */}
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
  const renderEmptyFavorites = () => {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          minHeight: 300,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          background: "#fff",
          borderRadius: 8,
          border: "1px dashed #ccd",
          color: "#555",
        }}
      >
        <span style={{ fontSize: 16, fontWeight: 500 }}>
          Você ainda não tem favoritos salvos.
        </span>

        <button
          onClick={() => setActiveTab("diretrizes")}
          style={{
            padding: "8px 16px",
            borderRadius: 6,
            border: "none",
            cursor: "pointer",
            fontWeight: 600,
            background: "#0078d4",
            color: "#fff",
          }}
        >
          Ver diretrizes
        </button>
      </div>
    );
  };
  const renderEmptyContent = () => {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          minHeight: 300,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          background: "#fff",
          borderRadius: 8,
          border: "1px dashed #ccd",
          color: "#555",
        }}
      >
        <span style={{ fontSize: 16, fontWeight: 500 }}>
          Nenhuma informação encontrada.
        </span>
      </div>
    );
  };
  const renderSearch = (data: IDiretriz[]) => {
    if (!data || data.length === 0) {
      return renderEmptyContent();
    }
    const menuData = convertHierarchyListToMenuTree(data);
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
          // hideSearch
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
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {/* Botão Tela Cheia */}
                <div
                  onClick={handleToggleFullscreen}
                  title={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
                  style={{
                    cursor: "pointer",
                    padding: 4,
                    borderRadius: 6,
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  {isFullscreen ? (
                    <ArrowExpand20Regular />
                  ) : (
                    <ArrowExpand20Regular />
                  )}
                </div>

                {/* Favorito */}
                <Star20Filled
                  style={{
                    color: isFavoritedItem ? "#f4b400" : "grey",
                    cursor: "pointer",
                  }}
                  onClick={() => onClickFavorite(selectedKpiData)}
                />
              </div>
              {/* <Star20Filled
                style={{ color: isFavoritedItem ? "#f4b400" : "grey" }}
                onClick={() => onClickFavorite(selectedKpiData)}
              /> */}
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

    if (searchText) return renderSearch(filterHierarchy(hierarchy, searchText));

    // Renderização de FAVORITOS - Exibe menu multinível direto
    if (activeTab === "favoritos") {
      return renderFavorites(data);
    }

    // Comportamento normal quando estiver em DIRETRIZES
    if (!selectedDiretriz) return renderDiretrizes(data);
    if (!selectedTema) return renderTemas(data);
    return renderCategorias(data);
  };

  const isSearching = !!searchText && searchText.trim().length > 0;
  // ------------------------------
  // Render Principal
  // ------------------------------
  return (
    <div>
      {/* 🔍 Modo Pesquisa */}
      {isSearching ? (
        <div
          style={{
            marginBottom: 16,
            padding: "12px 16px",
            background: "#f0f0f0",
            borderRadius: 8,
            fontSize: 16,
            fontWeight: 600,
            color: "#333",
          }}
        >
          Resultado da pesquisa "{searchText}"
        </div>
      ) : (
        <>
          {/* 🧭 Tabs normais */}
          <TabList
            selectedValue={activeTab}
            onTabSelect={(e, data) =>
              setActiveTab(data.value as "diretrizes" | "favoritos")
            }
            style={{ marginBottom: 10 }}
          >
            <Tab value="diretrizes">Diretrizes</Tab>
            <Tab value="favoritos">Favoritos</Tab>
          </TabList>

          {/* 🧱 Breadcrumb só fora da busca */}
          {activeTab === "diretrizes" && renderBreadcrumb()}
        </>
      )}

      <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
        {getContent()}
      </div>
    </div>
  );
};

export default Dashboard;
