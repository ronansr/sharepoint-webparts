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

export interface IDashboardProps {
  context: WebPartContext;
  siteUrl: string;
  setSelectedSector: (sectorId: string) => void;
}

// ----------------------------
// TIPOS
// ----------------------------
interface IKpi {
  id: string;
  title: string;
  [key: string]: any; // todos os campos da linha
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
  kpis?: any[]; // lista de IDs ou kpisId
  [key: string]: any;
}

const Dashboard: React.FC<IDashboardProps> = ({
  context,
  siteUrl,
  setSelectedSector,
}) => {
  const [hierarchy, setHierarchy] = useState<IDiretriz[]>([]);
  const [selectedDiretriz, setSelectedDiretriz] = useState<IDiretriz | null>(
    null
  );
  const [selectedTema, setSelectedTema] = useState<ITema | null>(null);
  const [selectedItemLink, setSelectedItemLink] = useState<string | null>(null);
  const [selectedKpiData, setSelectedKpiData] = useState<IKpi | null>(null);
  const [menuVisible, setMenuVisible] = useState(true); // controla visibilidade do menu

  const sp: SPFI = spfi().using(SPBrowser({ baseUrl: siteUrl }));
  const powerBIService = new PowerBIService();

  useEffect(() => {
    loadBaseDados();
  }, []);

  // ------------------------------
  // BUSCAR DADOS SP
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
  // AGRUPAMENTO POR DIRETRIZ > TEMA > CATEGORIA
  // ------------------------------
  const groupByHierarchy = (items: BaseDados[]): IDiretriz[] => {
    const map: { [key: string]: IDiretriz } = {};

    items.forEach((item) => {
      if (!item.diretriz) return;

      // --- DIRETRIZ ---
      if (!map[item.diretriz]) {
        map[item.diretriz] = {
          id: item.diretriz,
          title: item.Title,
          descricao: item.descricao,
          temas: [],
        };
      }
      const diretriz = map[item.diretriz];

      // --- TEMA ---
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

        // --- CATEGORIA ---
        if (item.categoria) {
          let categoria = tema.categorias.find((c) => c.id === item.categoria);
          if (!categoria) {
            categoria = { id: item.categoria, title: item.Title, kpis: [] };
            tema.categorias.push(categoria);
          }

          // --- KPIs: Buscar os objetos completos ---
          if (categoria && item.kpisId?.length) {
            item.kpisId.forEach((kId: any) => {
              // Verifica se já existe na categoria
              if (!categoria?.kpis?.find((kk) => kk.id === kId.toString())) {
                // Busca o item completo do KPI pelo Id
                const kpiData = items.find((i) => i.Id === kId);
                if (kpiData) {
                  categoria?.kpis?.push({
                    id: kId.toString(),
                    title: kpiData.Title,
                    ...kpiData,
                  });
                }
              }
            });
          }
        }
      }
    });

    return Object.values(map);
  };

  // ------------------------------
  // CONVERTER PARA MENU
  // ------------------------------
  const convertToMenuTree = (tema: ITema): IGenericNode[] => {
    return tema.categorias.map((c) => ({
      id: c.id,
      title: c.title,
      showChildren: true,
      children: c.kpis.length
        ? c.kpis.map((k) => ({
            id: k.id,
            title: k.title,
            link: k.id,
            data: k, // linha completa do KPI
          }))
        : [],
    }));
  };

  // ------------------------------
  // BREADCRUMB
  // ------------------------------
  const renderBreadcrumb = () => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginBottom: 20,
        fontSize: 14,
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
          <span>{">"}</span>
          <span
            style={{
              cursor: "pointer",
              fontWeight: !selectedTema ? "bold" : "normal",
            }}
            onClick={() => setSelectedTema(null)}
          >
            {selectedDiretriz.title}
          </span>
        </>
      )}
      {selectedTema && (
        <>
          <span>{">"}</span>
          <span style={{ fontWeight: "bold" }}>{selectedTema.title}</span>
        </>
      )}
    </div>
  );

  // ------------------------------
  // VOLTAR
  // ------------------------------
  const handleBack = () => {
    if (selectedTema) {
      setSelectedTema(null);
      return;
    }
    if (selectedDiretriz) {
      setSelectedDiretriz(null);
      return;
    }
  };

  // ------------------------------
  // RENDER NÍVEIS
  // ------------------------------
  const renderDiretrizes = () =>
    hierarchy.map((d) => (
      <SectorCard
        key={d.id}
        title={d.title}
        description={d.descricao}
        onClick={() => setSelectedDiretriz(d)}
      />
    ));

  const renderTemas = () =>
    selectedDiretriz?.temas.map((t) => (
      <SectorCard
        key={t.id}
        title={t.title}
        description="Tema"
        onClick={() => setSelectedTema(t)}
      />
    ));

  const renderCategorias = () => {
    if (!selectedTema) return null;
    const menuData = convertToMenuTree(selectedTema);

    return (
      <div style={{ display: "flex", width: "100%", gap: 5 }}>
        {/* Menu lateral */}
        <MultiLevelMenu
          data={menuData}
          onSelect={(item) => {
            setSelectedItemLink(item.link || item.id);
            setSelectedSector(item.id);
            setSelectedKpiData(item.data || null);

            if (item.data?.link?.Url) {
              powerBIService.embedReport(
                context,
                item.data.link.Url,
                extractReportId(item.data.link.Url) ?? ""
              );
            }
          }}
          menuVisible={menuVisible}
          onToggleMenu={setMenuVisible}
        />

        {/* Container do relatório com cabeçalho */}
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
                {/* Ícone para mostrar/ocultar menu */}
                <Navigation20Regular
                  style={{ cursor: "pointer" }}
                  onClick={() => setMenuVisible(!menuVisible)}
                />
                <span>{selectedKpiData.title}</span>
              </div>
              {/* Ícone de favoritar */}
              <Star20Filled style={{ color: "#f4b400" }} />
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
    if (!selectedDiretriz) return renderDiretrizes();
    if (!selectedTema) return renderTemas();
    return renderCategorias();
  };

  return (
    <div>
      {renderBreadcrumb()}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
        {getContent()}
      </div>
    </div>
  );
};

export default Dashboard;
