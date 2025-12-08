import * as React from "react";
import { useEffect, useState } from "react";
import { SPFI, spfi } from "@pnp/sp";
import { SPBrowser } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";

export interface IDashboardProps {
  siteUrl: string;
  setSelectedSector: (sectorId: number) => void;
}

interface ISetor {
  Id: number;
  Title: string;
  Descricao: string;
}

interface ISectorCardProps {
  title: string;
  description: string;
  onClick: () => void;
}

const SectorCard: React.FC<ISectorCardProps> = ({
  title,
  description,
  onClick,
}) => {
  return (
    <div
      style={{
        border: "1px solid #ccc",
        borderRadius: 8,
        padding: 16,
        width: 200,
        cursor: "pointer",
        boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
        transition: "transform 0.1s",
      }}
      onClick={onClick}
      onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.03)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
    >
      <h3 style={{ margin: "0 0 8px 0", fontSize: 16 }}>{title}</h3>
      <p style={{ margin: 0, fontSize: 14, color: "#555" }}>{description}</p>
      <button
        style={{
          marginTop: 12,
          padding: "6px 12px",
          fontSize: 14,
          borderRadius: 4,
          border: "none",
          backgroundColor: "#0078d4",
          color: "#fff",
          cursor: "pointer",
        }}
        onClick={onClick} // chama o setSelectedSector do WebPart
      >
        Ver mais
      </button>
    </div>
  );
};

const Dashboard: React.FC<IDashboardProps> = ({
  siteUrl,
  setSelectedSector,
}) => {
  const [setores, setSetores] = useState<ISetor[]>([]);

  const sp: SPFI = spfi().using(SPBrowser({ baseUrl: siteUrl }));

  useEffect(() => {
    const loadSetores = async () => {
      const items: ISetor[] = await sp.web.lists.getByTitle("Setores").items();
      setSetores(items);

      // exemplo: seleciona automaticamente o primeiro setor
      if (items.length > 0) setSelectedSector(items[0].Id);
    };
    loadSetores();
  }, [siteUrl]);

  const handleSelect = (setor: ISetor) => {
    console.log("Setor selecionado:", setor.Id);
    alert(`Setor selecionado: ${setor.Title}`);
    setSelectedSector(setor.Id);
  };

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
      {setores.map((setor) => (
        <SectorCard
          key={setor.Id}
          title={setor.Title}
          description={setor.Descricao}
          onClick={() => handleSelect(setor)}
        />
      ))}
    </div>
  );
};

export default Dashboard;

// import * as React from "react";
// import { useEffect, useState } from "react";
// import { SPFI, spfi } from "@pnp/sp";
// import { SPBrowser } from "@pnp/sp";
// import { useSelectedSector } from "../../../shared/context/SelectedSectorContext";
// import "@pnp/sp/webs";
// import "@pnp/sp/lists";
// import "@pnp/sp/items";

// interface IDashboardProps {
//   siteUrl: string;
// }

// interface ISetor {
//   Id: number;
//   Title: string;
//   Descricao: string;
// }

// // Componente de cartão incorporado
// interface ISectorCardProps {
//   title: string;
//   description: string;
//   onClick: () => void;
// }

// const SectorCard: React.FC<ISectorCardProps> = ({
//   title,
//   description,
//   onClick,
// }) => {
//   return (
//     <div
//       style={{
//         border: "1px solid #ccc",
//         borderRadius: 8,
//         padding: 16,
//         width: 200,
//         cursor: "pointer",
//         boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
//         transition: "transform 0.1s",
//       }}
//       onClick={onClick}
//       onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.03)")}
//       onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
//     >
//       <h3 style={{ margin: "0 0 8px 0", fontSize: 16 }}>{title}</h3>
//       <p style={{ margin: 0, fontSize: 14, color: "#555" }}>{description}</p>
//       <button
//         style={{
//           marginTop: 12,
//           padding: "6px 12px",
//           fontSize: 14,
//           borderRadius: 4,
//           border: "none",
//           backgroundColor: "#0078d4",
//           color: "#fff",
//           cursor: "pointer",
//         }}
//       >
//         Ver mais
//       </button>
//     </div>
//   );
// };

// const Dashboard: React.FC<IDashboardProps> = ({ siteUrl }) => {
//   const [setores, setSetores] = useState<ISetor[]>([]);
//   const { setSelectedSector } = useSelectedSector();

//   // Cria instância SPFI
//   const sp: SPFI = spfi().using(SPBrowser({ baseUrl: siteUrl }));

//   useEffect(() => {
//     const loadSetores = async () => {
//       const items = await sp.web.lists.getByTitle("Setores").items();
//       // .items.select("Id", "Title", "Descricao")();
//       setSetores(items);
//     };

//     loadSetores();
//   }, []);

//   const handleSelect = (setor: ISetor) => {
//     setSelectedSector(setor.Id);
//   };

//   return (
//     <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
//       <h3 style={{ margin: "0 0 8px 0", fontSize: 16 }}>Setores</h3>
//       <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
//         {setores.map((setor) => (
//           <SectorCard
//             key={setor.Id}
//             title={setor.Title}
//             description={setor.Descricao}
//             onClick={() => handleSelect(setor)}
//           />
//         ))}
//       </div>
//     </div>
//   );
// };

// export default Dashboard;
