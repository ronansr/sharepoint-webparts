import { useEffect, useState } from "react";
import { spfi, SPFx } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import { IKpiMenuProps } from "./IKpiMenuProps";
import * as React from "react";

import { PowerBIService } from "../../../services/PowerBIService";

const KpiMenu: React.FC<IKpiMenuProps> = ({
  context,
  siteUrl,
  selectedSectorField,
}) => {
  const [selectedSector, setSelectedSector] = useState<number | null>(null);
  const [kpis, setKpis] = useState<any[]>([]);
  const [selectedKpi, setSelectedKpi] = useState<any | null>(null);

  const powerBIService = new PowerBIService();

  /** Atualiza setor */
  useEffect(() => {
    if (!selectedSectorField) return;

    const updateSector = () => {
      const value = selectedSectorField.tryGetValue
        ? selectedSectorField.tryGetValue()
        : null;

      setSelectedSector(value ?? null);
    };

    selectedSectorField.registerPropertyChanged(updateSector);
    updateSector();

    return () => selectedSectorField.unregisterPropertyChanged(updateSector);
  }, [selectedSectorField]);

  /** Busca KPIs */
  useEffect(() => {
    const sp = spfi().using(
      SPFx({
        pageContext: context.pageContext,
      })
    );

    sp.web.lists
      .getByTitle("KPIs")
      .items()
      .then((items) => {
        let filtered = items;

        if (selectedSector !== null) {
          filtered = items.filter((item) => {
            if (!item.TipoSetores) return false;

            const tipos = Array.isArray(item.TipoSetores)
              ? item.TipoSetores.map(Number)
              : String(item.TipoSetores)
                  .split(",")
                  .map((v) => Number(v.trim()));

            return tipos.includes(selectedSector);
          });
        }

        setKpis(filtered);
      })
      .catch((err) => console.error("Erro ao buscar KPIs:", err));
  }, [selectedSector, siteUrl]);

  /** Quando seleciona KPI → embed do Power BI */
  useEffect(() => {
    if (selectedKpi) {
      powerBIService.embedReport(
        context,
        // "https://app.powerbi.com/links/5IFZxFtGxR?ctid=99106079-5014-41d9-a528-f4a73e8b2d1e&pbi_source=linkShare",
        // "https://app.powerbi.com/view?r=eyJrIjoiYzJmMDljZjctM2MyOC00NDllLTk4NDctZjY4OTg3ZmI5MDM0IiwidCI6Ijk5MTA2MDc5LTUwMTQtNDFkOS1hNTI4LWY0YTczZThiMmQxZSJ9",
        "https://app.powerbi.com/reportEmbed?reportId=0e0fb659-7f1a-492f-aa1a-a6bd9cf272f2", //selectedKpi.LinkBI, // embedUrl
        "0e0fb659-7f1a-492f-aa1a-a6bd9cf272f2" //selectedKpi.ReportId // você deve ter esse campo na lista
      );
    }
  }, [selectedKpi]);

  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
    #SuiteNavWrapper,
    #suiteBarDelta {
      display: none !important;
    }
  `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div style={{ display: "flex", gap: 24 }}>
      {/* MENU */}
      <div
        style={{
          width: "250px",
          borderRight: "1px solid #ccc",
          paddingRight: 16,
        }}
      >
        <p>Selecionado: {selectedSector ?? "Todos"}</p>

        <ul>
          {kpis.map((kpi) => (
            <li
              key={kpi.Id}
              style={{ cursor: "pointer", padding: 8 }}
              onClick={() => setSelectedKpi(kpi)}
            >
              {kpi.Title}
            </li>
          ))}
        </ul>
      </div>

      {/* POWER BI */}
      <div style={{ flex: 1 }}>
        {!selectedKpi ? (
          <p>Selecione um KPI para visualizar o relatório.</p>
        ) : (
          <div
            id="reportContainer"
            style={{ width: "100%", height: "650px", border: "1px solid #ddd" }}
          />
        )}
      </div>
    </div>
  );
};

export default KpiMenu;
