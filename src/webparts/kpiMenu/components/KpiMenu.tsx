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

// import { useEffect, useState } from "react";
// import { spfi, SPFx } from "@pnp/sp";
// import "@pnp/sp/webs";
// import "@pnp/sp/lists";
// import "@pnp/sp/items";
// import { IKpiMenuProps } from "./IKpiMenuProps";
// import * as React from "react";

// // import * as pbi from "powerbi-client";

// // interface PowerBIEmbedProps {
// //   embedUrl: string;
// //   accessToken?: string; // se necessário
// // }

// // const PowerBIEmbed: React.FC<PowerBIEmbedProps> = ({
// //   embedUrl,
// //   accessToken,
// // }) => {
// //   const ref = React.useRef<HTMLDivElement>(null);

// //   useEffect(() => {
// //     if (!ref.current) return;

// //     const powerbi = new pbi.service.Service(
// //       pbi.factories.hpmFactory,
// //       pbi.factories.wpmpFactory,
// //       pbi.factories.routerFactory
// //     );

// //     powerbi.embed(ref.current, {
// //       type: "report",
// //       embedUrl,
// //       accessToken, // opcional
// //       tokenType: accessToken ? pbi.models.TokenType.Embed : undefined,
// //       settings: {
// //         panes: {
// //           filters: { visible: false },
// //           pageNavigation: { visible: true },
// //         },
// //       },
// //     });
// //   }, [embedUrl, accessToken]);

// //   return <div ref={ref} style={{ height: "600px", width: "100%" }} />;
// // };

// const KpiMenu: React.FC<IKpiMenuProps> = ({ siteUrl, selectedSectorField }) => {
//   const [selectedSector, setSelectedSector] = useState<number | null>(null);
//   const [kpis, setKpis] = useState<any[]>([]);
//   const [selectedKpiLink, setSelectedKpiLink] = useState<string | null>(null);

//   // Atualiza selectedSector sempre que o dynamic field mudar
//   useEffect(() => {
//     if (!selectedSectorField) return;

//     const updateSector = () => {
//       const value = selectedSectorField.tryGetValue
//         ? selectedSectorField.tryGetValue()
//         : null;
//       setSelectedSector(value ?? null);
//       console.log("selectedSector atualizado:", value);
//     };

//     selectedSectorField.registerPropertyChanged(updateSector);
//     updateSector();

//     return () => selectedSectorField.unregisterPropertyChanged(updateSector);
//   }, [selectedSectorField]);

//   // Busca KPIs filtrando por setor, ou todos caso selectedSector seja null
//   useEffect(() => {
//     const sp = spfi().using(
//       SPFx({
//         pageContext: {
//           web: { absoluteUrl: siteUrl },
//           legacyPageContext: {
//             formDigestTimeoutSeconds: 1800,
//             formDigestValue: "",
//           },
//         },
//       })
//     );

//     sp.web.lists
//       .getByTitle("KPIs")
//       .items()
//       .then((items) => {
//         let filtered: any[] = items;

//         // Se houver selectedSector, filtra
//         if (selectedSector !== null) {
//           filtered = items.filter((item) => {
//             if (!item.TipoSetores) return false;
//             const tipos = Array.isArray(item.TipoSetores)
//               ? item.TipoSetores.map(Number)
//               : String(item.TipoSetores)
//                   .split(",")
//                   .map((v) => Number(v.trim()));
//             return tipos.includes(selectedSector);
//           });
//         }

//         setKpis(filtered);
//       })
//       .catch((err) => console.error("Erro ao buscar KPIs:", err));
//   }, [selectedSector, siteUrl]);

//   return (
//     <div style={{ display: "flex", gap: 24 }}>
//       {/* Menu de KPIs */}
//       {/* <div
//         style={{
//           width: "250px",
//           borderRight: "1px solid #ccc",
//           paddingRight: 16,
//         }}
//       >
//         <p>Selecionado: {selectedSector ?? "Todos"}</p>
//         <ul>
//           {kpis.map((kpi) => (
//             <li
//               key={kpi.Id}
//               style={{ cursor: "pointer", padding: 8 }}
//               onClick={() => setSelectedKpiLink(kpi.LinkBI)}
//             >
//               {kpi.Title}
//             </li>
//           ))}
//         </ul>
//       </div> */}

//       {/* Visualização do Power BI */}
//       <div style={{ flex: 1 }}>
//         {/* {true ? ( */}
//         <iframe
//           title="Power BI Report"
//           src={
//             "https://app.powerbi.com/reportEmbed?reportId=5a46c3f4-69bd-4c17-b64e-666174927f18&autoAuth=true&ctid=99106079-5014-41d9-a528-f4a73e8b2d1e"
//           }
//           width="100%"
//           height="600px"
//           style={{ border: "none" }}
//           // allowFullScreen
//         ></iframe>
//         {/* ) : (
//           <p>Selecione um KPI para visualizar o relatório.</p>
//         )} */}
//       </div>
//     </div>
//   );
// };

// export default KpiMenu;

// // // src/webparts/kpiMenu/components/KpiMenu.tsx

// // import * as React from "react";
// // import { IKpiMenuProps } from "./IKpiMenuProps";
// // import { useSelectedSector } from "../../../shared/context/SelectedSectorContext";

// // import { spfi, SPFx } from "@pnp/sp";
// // import "@pnp/sp/webs";
// // import "@pnp/sp/lists";
// // import "@pnp/sp/items";

// // const KpiMenu: React.FC<IKpiMenuProps> = ({
// //   context,
// //   siteUrl,
// //   setSelectedLink,
// // }) => {
// //   const { selectedSector } = useSelectedSector();
// //   const [kpis, setKpis] = React.useState<any[]>([]);

// //   React.useEffect(() => {
// //     if (!selectedSector) return;

// //     const sp = spfi().using(SPFx(context));

// //     sp.web.lists
// //       .getByTitle("KPIs")
// //       .items()
// //       .then((items) => {
// //         const filtered = items.filter((item) => {
// //           if (!item.TipoSetores) return false;
// //           const tipos = Array.isArray(item.TipoSetores)
// //             ? item.TipoSetores.map(Number)
// //             : String(item.TipoSetores)
// //                 .split(",")
// //                 .map((v) => Number(v.trim()));
// //           return tipos.includes(Number(selectedSector));
// //         });
// //         setKpis(filtered);
// //       });
// //   }, [selectedSector]);

// //   return (
// //     <ul>
// //       {kpis.map((kpi) => (
// //         <li
// //           key={kpi.Id}
// //           onClick={() => setSelectedLink(kpi.LinkBI)}
// //           style={{ cursor: "pointer", padding: 8 }}
// //         >
// //           {kpi.Title}
// //         </li>
// //       ))}
// //     </ul>
// //   );
// // };

// // export default KpiMenu;
