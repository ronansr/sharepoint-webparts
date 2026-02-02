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
  Library20Regular,
} from "@fluentui/react-icons";
import MultiLevelMenu, { IGenericNode } from "./MultiLeveMenu";
import { PowerBIService } from "../../../services/PowerBIService";
import { WebPartContext } from "@microsoft/sp-webpart-base";
import { extractReportId, filterHierarchy } from "../../../utils";
import { TabList, Tab } from "@fluentui/react-components";
import { Edit20Regular } from "@fluentui/react-icons";
import CustomGroups from "../../CustomGroupsWebPart/components/CustomGroups";
import { Info20Regular } from "@fluentui/react-icons";
import { TooltipHost } from "@fluentui/react";
import Header from "../../header/components/Header";

export interface IDashboardProps {
  context: WebPartContext;
  siteUrl: string;
  setSelectedSector: (sectorId: string) => void;
  enableCleanLayout: boolean;
  useInternalHeader: boolean;
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
  nomeAutor?: string;
  descricao?: string;
  updateDate?: string;
}

const Dashboard: React.FC<IDashboardProps> = ({
  context,
  siteUrl,
  setSelectedSector,
  enableCleanLayout,
  useInternalHeader,
}) => {
  const [baseDadosData, setBaseDadosData] = useState<BaseDados[]>([]);
  const [hierarchy, setHierarchy] = useState<IDiretriz[]>([]);
  const [favoriteHierarchy, setFavoriteHierarchy] = useState<IDiretriz[]>([]);
  const [selectedDiretriz, setSelectedDiretriz] = useState<IDiretriz | null>(
    null
  );
  const [selectedTema, setSelectedTema] = useState<ITema | null>(null);
  const [selectedItemLink, setSelectedItemLink] = useState<string | null>(null);
  const [selectedKpiData, setSelectedKpiData] = useState<IKpi | null>(null);
  const [menuVisible, setMenuVisible] = useState(true);
  const [menuVisibleGroups, setMenuVisibleGroups] = useState(true);
  const [isFavoritedItem, setFavoritedItem] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "diretrizes" | "favoritos" | "listas"
  >("diretrizes");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [userGroupsMenu, setUserGroupsMenu] = useState<IGenericNode[]>([]);
  const [selectedGroupKpiData, setSelectedGroupKpiData] = useState<IKpi | null>(
    null
  );
  const [isEditingGroup, setIsEditingGroup] = useState(false);
  const [idGrupoSelecionado, setIdGrupoSelecionado] = useState<number | null>(
    null
  );
  const [groupsTab, setGroupsTab] = useState<"meus" | "compartilhados">("meus");
  const [sharedGroupsMenu, setSharedGroupsMenu] = useState<IGenericNode[]>([]);
  const [isGroupsReportFullscreen, setIsGroupsReportFullscreen] =
    useState(false);
  const [showAllKpisMenu, setShowAllKpisMenu] = useState(false);
  const [allKpisMenuData, setAllKpisMenuData] = useState<IGenericNode[]>([]);

  const sp: SPFI = spfi().using(SPBrowser({ baseUrl: siteUrl }));
  // const powerBIServiceRef = React.useRef<PowerBIService | null>(null);

  // if (!powerBIServiceRef.current) {
  //   powerBIServiceRef.current = new PowerBIService();
  // }

  // const powerBIService = powerBIServiceRef.current;

  const powerBIServiceMainRef = React.useRef<PowerBIService | null>(null);
  const powerBIServiceGroupsRef = React.useRef<PowerBIService | null>(null);
  const powerBIServiceKPIsRef = React.useRef<PowerBIService | null>(null);
  const powerBIServiceFavRef = React.useRef<PowerBIService | null>(null);

  if (!powerBIServiceMainRef.current) {
    powerBIServiceMainRef.current = new PowerBIService("reportContainerMain");
  }

  if (!powerBIServiceGroupsRef.current) {
    powerBIServiceGroupsRef.current = new PowerBIService(
      "reportContainerGroups"
    );
  }

  if (!powerBIServiceKPIsRef.current) {
    powerBIServiceKPIsRef.current = new PowerBIService("reportContainerKPIs");
  }

  if (!powerBIServiceFavRef.current) {
    powerBIServiceFavRef.current = new PowerBIService("reportContainerFav");
  }

  const powerBIServiceMain = powerBIServiceMainRef.current;
  const powerBIServiceGroups = powerBIServiceGroupsRef.current;
  const powerBIServiceKPIs = powerBIServiceKPIsRef.current;
  const powerBIServiceFav = powerBIServiceFavRef.current;

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
    // 🔴 LIMPA TUDO ANTES DO REACT REMOVER OS NÓS
    powerBIServiceMain?.clearReport();
    powerBIServiceGroups?.clearReport();
    powerBIServiceKPIs?.clearReport();
    // powerBIServiceFav?.clearReport();

    setSelectedKpiData(null);
    setSelectedGroupKpiData(null);
    setSelectedItemLink(null);
    setSelectedDiretriz(null);
    setSelectedTema(null);
    setMenuVisible(true);
    setShowAllKpisMenu(false);

    return () => {
      // 🔴 cleanup defensivo
      powerBIServiceMain?.clearReport();
      powerBIServiceGroups?.clearReport();
      powerBIServiceKPIs?.clearReport();
      // powerBIServiceFav?.clearReport();
    };
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

  useEffect(() => {
    if (groupsTab === "compartilhados") {
      loadSharedGroups();
    } else loadUserGroups();
  }, [groupsTab, isEditingGroup, baseDadosData]);

  useEffect(() => {
    const styleId = "dashboard-clean-layout-style";

    // Remove se existir
    const existing = document.getElementById(styleId);
    if (existing) existing.remove();

    if (!enableCleanLayout) return;

    const style = document.createElement("style");
    style.id = styleId;
    style.innerHTML = `

      /* Header global */
      #SuiteNavWrapper,
      #suiteBarDelta {
        display: none !important;
      }

      /* Top command bar */
      #spCommandBar {
        display: none !important;
      }

      /* Menu lateral */
      #spLeftNav,
      #sp-appBar {
        display: none !important;
      }

      /* Ajuste do corpo */
      #contentBox,
      #workbenchPageContent,
      .CanvasZone,
      .CanvasSection {
        margin: 0 !important;
        padding: 0 !important;
        max-width: 100% !important;
      }

      /* Garante fullscreen real */
      html,
      body,
      #spPageCanvasContent {
        height: 100% !important;
        width: 100% !important;
        overflow: hidden;
      }


    // /* 🔴 Header Microsoft */
    // #SuiteNavWrapper,
    // #suiteBarDelta {
    //   display: none !important;
    // }

    // /* 🔵 Header do site */
    // #spSiteHeader,
    // .ms-compositeHeader {
    //   display: none !important;
    // }

    // /* 🟣 Menu lateral */
    // #spLeftNav,
    // #sp-appBar,
    // #spLeftNavContainer {
    //   display: none !important;
    // }

    // /* 🟡 Command bar */
    // #spCommandBar {
    //   display: none !important;
    // }

    // /* 🟢 Conteúdo full width */
    // #contentBox,
    // #workbenchPageContent,
    // .CanvasZone,
    // .CanvasSection,
    // .CanvasZoneContainer {
    //   margin-left: 0 !important;
    //   max-width: 100% !important;
    // }

    // #s4-workspace,
    // #mainContent {
    //   margin-top: 0 !important;
    // }
  `;

    document.head.appendChild(style);

    return () => {
      style.remove();
    };
  }, [enableCleanLayout]);

  // ------------------------------
  // Buscar BaseDados
  // ------------------------------
  const loadBaseDados = async () => {
    try {
      const items: BaseDados[] = await sp.web.lists
        .getByTitle("BaseDados")
        .items();

      const itemsOk = items
        .filter((item) => item.status)
        .sort((a, b) =>
          a.Title.localeCompare(b.Title, "pt-BR", {
            sensitivity: "base",
          })
        );
      setBaseDadosData(itemsOk);

      // console.log("itemsOk", itemsOk);
      const structured = groupByHierarchy(itemsOk);
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

      // console.log(hierarchyFav);

      setFavoriteHierarchy(hierarchyFav);

      return;
    } catch (error) {
      console.error("Erro ao carregar favoritos", error);
      setFavoriteHierarchy([]);
    }
  };

  const loadUserGroups = async () => {
    try {
      const currentUserEmail = context.pageContext.user.email;

      const gruposRaw: UsuarioListaItem[] = await sp.web.lists
        .getByTitle("UsuarioListas")
        .items.select("Id", "Title", "idItem", "idGrupo", "nomeGrupo", "email")
        .filter(
          `email eq '${currentUserEmail}' and idGrupo ne 1 and idGrupo ne 2`
        )();

      if (gruposRaw.length === 0) {
        setUserGroupsMenu([]);
        return;
      }

      // 🔹 Agrupa por nomeGrupo
      const grouped: Record<
        number,
        { nomeGrupo: string; items: UsuarioListaItem[] }
      > = {};

      gruposRaw.forEach((item) => {
        if (!grouped[item.idGrupo]) {
          grouped[item.idGrupo] = {
            nomeGrupo: item.nomeGrupo!,
            items: [],
          };
        }
        grouped[item.idGrupo].items.push(item);
      });
      console.log(baseDadosData);

      const menu: IGenericNode[] = Object.entries(grouped).map(
        ([idGrupo, group]) => ({
          id: idGrupo, // 🔑 idGrupo aqui
          title: group.nomeGrupo,
          showChildren: true,
          data: { idGrupo: Number(idGrupo) },
          children: group.items.map((i) => ({
            id: i.idItem!,
            title: i.Title,
            link: i.idItem,
            data: {
              idGrupo: Number(idGrupo),
              ...baseDadosData?.find((item) => item.id0 === i.idItem),
            },
          })),
        })
      );
      console.log(menu);
      setUserGroupsMenu(menu);
    } catch (error) {
      console.error("Erro ao carregar grupos do usuário", error);
      setUserGroupsMenu([]);
    }
  };

  const loadFavoriteSharedGroups = async (): Promise<string[]> => {
    const currentUserEmail = context.pageContext.user.email;

    const items: UsuarioListaItem[] = await sp.web.lists
      .getByTitle("UsuarioListas")
      .items.select("idItem")
      .filter(`email eq '${currentUserEmail}' and idGrupo eq 2`)();

    return Array.from(
      new Set(
        items
          .map((i) => i.idItem)
          .filter((id): id is string => typeof id === "string")
      )
    );
  };

  const buildInfoIcon = (
    nomeAutor?: string,
    email?: string,
    descricao?: string,
    updateDate?: string
  ) => {
    const message = `Lista criada por ${nomeAutor ?? "-"} (${email ?? "-"}).
Descrição: ${descricao ?? "Sem descrição"}.
Última atualização: ${
      updateDate ? new Date(updateDate).toLocaleString() : "-"
    }`;

    return (
      <TooltipHost content={message}>
        <Info20Regular style={{ cursor: "pointer", color: "#666" }} />
      </TooltipHost>
    );
  };

  const loadSharedGroups = async () => {
    try {
      const currentUserEmail = context.pageContext.user.email;

      // 🔹 1. Grupos compartilhados (como já funciona)
      const gruposRaw: UsuarioListaItem[] = await sp.web.lists
        .getByTitle("UsuarioListas")
        .items.select(
          "Id",
          "Title",
          "idItem",
          "idGrupo",
          "nomeGrupo",
          "email",
          "privado",
          "descricao",
          "updateDate",
          "nomeAutor"
        )
        .filter(
          `email ne '${currentUserEmail}' and privado eq false and idGrupo ne 1`
        )();

      const favoriteGroupIds = await loadFavoriteSharedGroups();

      // 🔹 2. Agrupar por idGrupo
      const grouped: Record<
        string,
        { nomeGrupo: string; items: UsuarioListaItem[] }
      > = {};

      gruposRaw.forEach((item) => {
        if (!grouped[item.idGrupo]) {
          grouped[item.idGrupo] = {
            nomeGrupo: item.nomeGrupo || "Grupo compartilhado",
            items: [],
          };
        }
        grouped[item.idGrupo].items.push(item);
      });

      const menu: IGenericNode[] = Object.entries(grouped).map(
        ([idGrupo, group]) => ({
          id: idGrupo,
          title: group.nomeGrupo,
          showChildren: true,
          data: {
            idGrupo: Number(idGrupo),
            shared: true,
            isFavorited: favoriteGroupIds.includes(idGrupo),
            iconComponent: buildInfoIcon(
              group?.items[0]?.nomeAutor,
              group?.items[0]?.email,
              group?.items[0]?.descricao,
              group?.items[0]?.updateDate
            ),
          },
          children: group.items.map((i) => ({
            id: i.idItem!,
            title: i.Title,
            link: i.idItem,
            data: {
              idGrupo: Number(idGrupo),
              shared: true,
              ...baseDadosData?.find((item) => item.id0 === i.idItem),
            },
          })),
        })
      );

      if (favoriteGroupIds.length > 0) {
        const favoriteChildren = menu.filter((node) =>
          favoriteGroupIds.includes(node.id)
        );

        if (favoriteChildren.length > 0) {
          menu.unshift({
            id: "favorite-shared",
            title: "Acesso Rápido",
            showChildren: true,
            data: {
              idGrupo: 2,
              favoriteShared: true,
              hideStar: true, // ⭐ não mostra estrela
              iconComponent: <Library20Regular />, // 📚 ícone de biblioteca
            },
            children: favoriteChildren,
          });
        }
      }

      console.log(menu);

      setSharedGroupsMenu(menu);
    } catch (error) {
      console.error("Erro ao carregar grupos compartilhados", error);
      setSharedGroupsMenu([]);
    }
  };

  const mapBaseDadosToKpi = (item: BaseDados): IKpi => {
    return {
      id: item.id,
      title: item.Title,
      link: item.link?.Url ?? "",
      paginaRelatorioBI: item.paginaRelatorioBI,
      filtroKpiSelecionado: item.filtroKpiSelecionado,
      setor: item.setor,
    };
  };

  const onSelectGroupItem = async (item: IGenericNode) => {
    try {
      const idGrupo = item.data?.idGrupo;
      if (idGrupo) {
        setIdGrupoSelecionado(idGrupo);
      }

      const result: BaseDados[] = await sp.web.lists
        .getByTitle("BaseDados")
        .items.filter(`id0 eq '${item.id}'`)();

      if (!result.length) return;

      const kpi = mapBaseDadosToKpi(result[0]);

      setSelectedSector(item.id);
      setSelectedGroupKpiData(kpi);

      if (kpi.link) {
        powerBIServiceGroups.embedReport(
          context,
          kpi.link,
          extractReportId(kpi.link) ?? "",
          kpi.paginaRelatorioBI,
          kpi.filtroKpiSelecionado
        );
      }
    } catch (error) {
      console.error("Erro ao selecionar item do grupo", error);
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
      if (!map[item.diretriz]) {
        map[item.diretriz] = {
          id: item.diretriz,
          title: item.Title,
          descricao: item.descricao,
          temas: [],
          extradata: item?.extradata ? JSON.parse(item.extradata) : null,
        };
      }
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

  const buildAllKpisMenu = (): IGenericNode[] => {
    return baseDadosData
      .filter(
        (item) =>
          !!item.link && // tem link
          !item.categoria // NÃO tem categoria
      )
      .map((item) => ({
        id: item.id0 || item.Id.toString(),
        title: item.Title,
        link: item.id0 || item.Id.toString(),
        data: item,
      }));
  };

  const handleShowAllKpis = () => {
    const menu = buildAllKpisMenu();

    setAllKpisMenuData(menu);
    setShowAllKpisMenu(true);

    // limpa seleções anteriores
    let kpis: any = {
      id: "KPIs",
      title: "Todos os KPIs",
      descricao: "Exibir todos os KPIs",
    };
    setSelectedDiretriz(null);
    setSelectedTema(null);
    setSelectedKpiData(null);
    setSelectedItemLink(null);
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
      console.log("isFavorited ", itemId);

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
    powerBIServiceMain.toggleFullscreen(false);
    // setIsFullscreen((prev) => !prev);
  };

  const handleToggleFullscreenGroups = () => {
    // console.log("isFullscreen", isFullscreen);
    powerBIServiceGroups.toggleFullscreen(false);
    // setIsFullscreen((prev) => !prev);
  };
  const handleToggleFullscreenKPIs = () => {
    powerBIServiceKPIs?.toggleFullscreen(false);
  };
  const handleToggleFullscreenFav = () => {
    powerBIServiceFav?.toggleFullscreen(false);
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
            <span>{"> "}</span>{" "}
            <span
              style={{
                cursor: "pointer",
                fontWeight: !selectedTema ? "bold" : "normal",
              }}
              onClick={() => setSelectedTema(null)}
            >
              Diretriz: {selectedDiretriz.title}
            </span>{" "}
          </>
        )}
        {selectedTema && (
          <>
            {" "}
            <span>{"> "}</span>{" "}
            <span style={{ fontWeight: "bold" }}>
              Tema: {selectedTema.title}
            </span>{" "}
          </>
        )}
      </div>
    );
  };

  const handleBack = () => {
    if (selectedTema) setSelectedTema(null);
    else if (selectedDiretriz) setSelectedDiretriz(null);
  };

  const onPressStarItemGroup = async (idItem: number) => {
    try {
      const currentUserEmail = context.pageContext.user.email;

      // 🔎 Verifica se já existe favorito para esse grupo
      const existing = await sp.web.lists
        .getByTitle("UsuarioListas")
        .items.select("Id", "idItem", "email")
        .filter(`email eq '${currentUserEmail}' and idItem eq ${idItem}`)();

      if (existing.length > 0) {
        for (const fav of existing) {
          await sp.web.lists
            .getByTitle("UsuarioListas")
            .items.getById(fav.Id)
            .delete();
        }
      } else {
        await sp.web.lists.getByTitle("UsuarioListas").items.add({
          Title: "Biblioteca de compartilhados",
          email: currentUserEmail,
          addDate: new Date(),
          privado: true,
          idGrupo: 2,
          nomeGrupo: "Favoritos Compartilhados",
          idItem: idItem,
        });
      }

      await loadSharedGroups();
    } catch (error) {
      console.error("Erro ao favoritar/desfavoritar grupo", error);
    }
  };

  // ------------------------------
  // Render Diretrizes/Temas/Categorias
  // ------------------------------
  const renderDiretrizes = (data: IDiretriz[]) => {
    return (
      <>
        {[...data]
          .sort((a, b) => {
            const aBuilding = !!a.extradata?.isBuilding;
            const bBuilding = !!b.extradata?.isBuilding;

            if (aBuilding === bBuilding) return 0;
            return aBuilding ? 1 : -1;
          })
          .map((d) => (
            <SectorCard
              key={d.id}
              id={d.id}
              title={d.title}
              description={d.descricao}
              onClick={() => setSelectedDiretriz(d)}
              onStarClick={() => onClickFavorite(d)}
              context={context}
              siteUrl={siteUrl}
              isBuilding={d.extradata?.isBuilding}
            />
          ))}
        <SectorCard
          id="all-kpis"
          title="Exibir todos os KPIs"
          description="Exibir todos os KPIs"
          onClick={handleShowAllKpis}
          context={context}
          siteUrl={siteUrl}
          isBuilding={false}
        />
      </>
    );
  };

  const renderAllKpis = () => {
    return (
      <>
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
          <div
            onClick={() => setShowAllKpisMenu(false)}
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

          <span
            style={{
              cursor: "pointer",
              fontWeight: !selectedDiretriz ? "bold" : "normal",
            }}
            onClick={() => {
              setShowAllKpisMenu(false);
            }}
          >
            Diretrizes
          </span>
          <>
            {" "}
            <span>{"> "}</span>{" "}
            <span
              style={{
                cursor: "pointer",
                fontWeight: !selectedTema ? "bold" : "normal",
              }}
              onClick={() => setSelectedTema(null)}
            >
              Todos os KPIs
            </span>{" "}
          </>
        </div>
        <div style={{ display: "flex", width: "100%", gap: 5 }}>
          <MultiLevelMenu
            data={allKpisMenuData}
            onSelect={(item) => {
              setSelectedItemLink(item.link || item.id);
              setSelectedSector(item.id);
              setSelectedKpiData(item.data || null);

              if (item.data?.link?.Url) {
                powerBIServiceKPIs.embedReport(
                  context,
                  item.data.link.Url,
                  extractReportId(item.data.link.Url) ?? "",
                  item.data?.paginaRelatorioBI,
                  item.data?.filtroKpiSelecionado
                );
              }
            }}
            menuVisible={menuVisible}
            onToggleMenu={setMenuVisible}
            showToggleOnlyValidates
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
                  <span>{selectedKpiData?.Title}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {/* Botão Tela Cheia */}
                  <div
                    onClick={handleToggleFullscreenKPIs}
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
              id="reportContainerKPIs"
              style={{
                flex: 1,
                minHeight: 650,
                padding: 5,
                border: "1px solid #ccd",
                borderRadius: 8,
                background: "#fff",
              }}
            >
              {!selectedItemLink && (
                <div style={{ color: "#666" }}>
                  Selecione um KPI no menu ao lado.
                </div>
              )}
            </div>
          </div>
        </div>
      </>
    );
  };

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
      <div style={{ display: "flex", width: "100%", gap: 5 }} key={"cat"}>
        <MultiLevelMenu
          data={menuData}
          onSelect={(item) => {
            setSelectedItemLink(item.link || item.id);
            setSelectedSector(item.id);
            setSelectedKpiData(item.data || null);
            if (item.data?.link?.Url)
              powerBIServiceMain.embedReport(
                context,
                item.data.link.Url,
                extractReportId(item.data.link.Url) ?? "",
                item?.data?.paginaRelatorioBI,
                item?.data?.filtroKpiSelecionado
              );
          }}
          menuVisible={menuVisible}
          onToggleMenu={setMenuVisible}
          showToggleOnlyValidates
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
          {
            <div
              id="reportContainerMain"
              // key={`${activeTab}-${selectedGroupKpiData?.id ?? "empty"}`}
              style={{
                flex: 1,
                minHeight: 650,
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
          }
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
      <div style={{ display: "flex", width: "100%", gap: 5 }} key={"favs"}>
        <MultiLevelMenu
          data={menuData}
          onSelect={(item) => {
            setSelectedItemLink(item.link || item.id);
            setSelectedSector(item.id);
            setSelectedKpiData(item.data || null);
            if (item.data?.link?.Url)
              powerBIServiceFav.embedReport(
                context,
                item.data.link.Url,
                extractReportId(item.data.link.Url) ?? "",
                item?.data?.paginaRelatorioBI,
                item?.data?.filtroKpiSelecionado
              );
          }}
          menuVisible={menuVisible}
          onToggleMenu={setMenuVisible}
          showToggleOnlyValidates
          expandAll={false}
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
                  onClick={handleToggleFullscreenFav}
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
            id="reportContainerFav"
            key={`${activeTab}-${selectedGroupKpiData?.id ?? "empty"}`}
            style={{
              flex: 1,
              minHeight: 650,
              padding: 5,
              border: "1px solid #ccd",
              borderRadius: 8,
              background: "#fff",
              alignItems: "center", // eixo vertical
              justifyContent: "center",
            }}
          >
            {!selectedItemLink && (
              <div
                style={{ color: "#666", alignSelf: "center", display: "flex" }}
              >
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
              powerBIServiceMain.embedReport(
                context,
                item.data.link.Url,
                extractReportId(item.data.link.Url) ?? "",
                item?.data?.paginaRelatorioBI,
                item?.data?.filtroKpiSelecionado
              );
          }}
          menuVisible={menuVisible}
          onToggleMenu={setMenuVisible}
          expandAll
          showToggleOnlyValidates
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
            id="reportContainerMain"
            // key={`${activeTab}-${selectedGroupKpiData?.id ?? "empty"}`}
            style={{
              flex: 1,
              minHeight: 650,
              padding: 5,
              border: "1px solid #ccd",
              borderRadius: 8,
              background: "#fff",
              alignItems: "center", // eixo vertical
              justifyContent: "center",
            }}
          >
            {!selectedItemLink && (
              <div
                style={{ color: "#666", alignSelf: "center", display: "flex" }}
              >
                Selecione um item no menu ao lado.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderUserGroupsMenu = () => {
    const hasGroups =
      groupsTab === "meus"
        ? userGroupsMenu.length > 0
        : sharedGroupsMenu.length > 0;

    return (
      <div style={{ marginTop: 10 }}>
        {/* 🔹 HEADER COM TABS + BOTÃO */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
            padding: "12px 16px",
            background: "#f0f0f0",
            borderRadius: 5,
            fontWeight: 600,
            fontSize: 16,
          }}
        >
          {/* Tabs */}
          <TabList
            selectedValue={groupsTab}
            onTabSelect={(e, data) => {
              setGroupsTab(data.value as "meus" | "compartilhados");

              setMenuVisibleGroups(true);
              setSelectedGroupKpiData(null);
            }}
          >
            <Tab value="meus">Minhas Listas</Tab>
            <Tab value="compartilhados">Listas Compartilhadas</Tab>
          </TabList>

          {/* Botão Adicionar Grupo */}

          <button
            onClick={() => {
              setIsEditingGroup(true);
              setIdGrupoSelecionado(null);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 12px",
              borderRadius: 6,
              border: "none",
              cursor: "pointer",
              fontWeight: 600,
              background: "#fff",
              color: "#000",
            }}
          >
            + Criar lista
          </button>
        </div>

        {/* 🔹 CONTEÚDO */}
        {!hasGroups ? (
          <div
            style={{
              width: "100%",
              minHeight: 200,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#fff",
              borderRadius: 8,
              border: "1px dashed #ccd",
              color: "#666",
              fontSize: 15,
              fontWeight: 500,
            }}
          >
            {groupsTab === "meus"
              ? "Você ainda não tem listas criadas."
              : "Nenhuma lista compartilhada disponível."}
          </div>
        ) : (
          <div style={{ display: "flex", width: "100%", gap: 5 }}>
            <MultiLevelMenu
              data={groupsTab === "meus" ? userGroupsMenu : sharedGroupsMenu}
              onSelect={onSelectGroupItem}
              menuVisible={menuVisibleGroups}
              onToggleMenu={setMenuVisibleGroups}
              initialExpanded="closed"
              onPressEditItemGroup={
                groupsTab === "meus"
                  ? (aId: any) => {
                      setIdGrupoSelecionado(aId);
                      setIsEditingGroup(true);
                    }
                  : undefined
              }
              onPressStarItemGroup={
                groupsTab === "meus" ? undefined : onPressStarItemGroup
              }
            />

            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                minHeight: 0,
              }}
            >
              {selectedGroupKpiData && (
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
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <Navigation20Regular
                      style={{ cursor: "pointer" }}
                      onClick={() => setMenuVisibleGroups(!menuVisibleGroups)}
                    />
                    <span>{selectedGroupKpiData.title}</span>
                  </div>

                  {
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 10 }}
                    >
                      {/* Botão Tela Cheia */}
                      <div
                        onClick={handleToggleFullscreenGroups}
                        title={
                          isFullscreen ? "Sair da tela cheia" : "Tela cheia"
                        }
                        style={{
                          cursor: "pointer",
                          padding: 4,
                          borderRadius: 6,
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        {isGroupsReportFullscreen ? (
                          <ArrowExpand20Regular />
                        ) : (
                          <ArrowExpand20Regular />
                        )}
                      </div>
                    </div>
                  }
                </div>
              )}

              <div
                id="reportContainerGroups"
                style={{
                  flex: 1,
                  width: "100%",
                  height: "100%",
                  minHeight: 650, // 🔑 MUITO importante
                  // padding: 5,
                  border: "1px solid #ccd",
                  borderRadius: 8,
                  background: "#fff",
                  overflow: "hidden", // 🔑 Power BI gosta disso
                  display: "flex",
                  alignItems: "center", // eixo vertical
                  justifyContent: "center",
                }}
                // key={`${activeTab}-${selectedGroupKpiData?.id ?? "empty"}`}
              >
                {!selectedItemLink && (
                  <div
                    style={{
                      color: "#666",
                      alignSelf: "center",
                      display: "flex",
                    }}
                  >
                    Selecione um item no menu ao lado.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
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

    if (activeTab === "listas") {
      return !isEditingGroup && !isSearching && renderUserGroupsMenu();
    }

    // Comportamento normal quando estiver em DIRETRIZES
    if (!selectedDiretriz) {
      if (showAllKpisMenu) return renderAllKpis();
      return renderDiretrizes(data);
    }
    if (!selectedTema) return renderTemas(data);
    return renderCategorias(data);
  };

  const isSearching = !!searchText && searchText.trim().length > 0;
  // ------------------------------
  // Render Principal
  // ------------------------------
  return (
    <div>
      {useInternalHeader && (
        <Header
          logoSrc={require("../../../assets/univesp-logo.png")}
          context={context}
        />
      )}
      {/* <Header
        logoSrc={require("../../../assets/univesp-logo.png")}
        context={context}
      /> */}
      {/* 🔍 Modo Pesquisa */}
      {isSearching ? (
        <div
          style={{
            marginBottom: 16,
            marginTop: 16,
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
        !isEditingGroup && (
          <>
            {/* 🧭 Tabs normais */}
            <TabList
              selectedValue={activeTab}
              onTabSelect={(e, data) => {
                setSelectedKpiData(null);
                setSelectedItemLink(null);
                setShowAllKpisMenu(false);
                setActiveTab(
                  data.value as "diretrizes" | "favoritos" | "listas"
                );
              }}
              style={{ marginBottom: 10 }}
            >
              <Tab value="diretrizes">Diretrizes</Tab>
              <Tab value="favoritos">Favoritos</Tab>
              <Tab value="listas">Listas</Tab>
            </TabList>

            {/* 🧱 Breadcrumb só fora da busca */}
            {activeTab === "diretrizes" && renderBreadcrumb()}
          </>
        )
      )}

      {isEditingGroup ? (
        <CustomGroups
          context={context}
          idGrupoSelecionado={idGrupoSelecionado}
          onClose={() => {
            setMenuVisibleGroups(true);
            setIdGrupoSelecionado(null);
            setSelectedGroupKpiData(null);
            // setTimeout(() => {
            setIsEditingGroup(false);
            // }, 1000);
          }}
        />
      ) : (
        <div
          style={
            activeTab !== "listas"
              ? {
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 16,
                  width: "100%",
                }
              : {}
          }
        >
          {getContent()}
        </div>
      )}

      {/* {!isEditingGroup && !isSearching && renderUserGroupsMenu()} */}
    </div>
  );
};

export default Dashboard;
