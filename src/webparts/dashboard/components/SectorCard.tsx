import * as React from "react";
import { ChevronRight20Filled, Star20Filled } from "@fluentui/react-icons";
import { WebPartContext } from "@microsoft/sp-webpart-base";
import { UsuarioListaItem } from "./Dashboard";
import { SPFI, spfi } from "@pnp/sp";
import { SPBrowser } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
interface ISectorCardProps {
  title: string;
  description?: string;
  onClick: () => void;
  onStarClick?: () => void;
  context: WebPartContext;
  siteUrl: string;
  id: any;
}

const SectorCard: React.FC<ISectorCardProps> = ({
  title,
  description,
  onClick,
  onStarClick,
  context,
  siteUrl,
  id,
}) => {
  const sp: SPFI = spfi().using(SPBrowser({ baseUrl: siteUrl }));
  const [isFav, setIsFav] = React.useState(false);

  const isFavorited = async (itemId: string): Promise<boolean> => {
    try {
      const currentUserEmail = context.pageContext.user.email;

      const result: UsuarioListaItem[] = await sp.web.lists
        .getByTitle("UsuarioListas")
        .items.select("Id", "idItem", "idGrupo", "email")
        .filter(
          `email eq '${currentUserEmail}' and idGrupo eq 1 and idItem eq '${itemId}'`
        )();
      if (result.length > 0) setIsFav(true);
      else setIsFav(false);
      return result.length > 0;
    } catch (err) {
      console.error("Erro ao verificar favoritos:", err);
      return false;
    }
  };

  React.useEffect(() => {
    isFavorited(id);
  }, []);

  return (
    <div
      style={{
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        width: 320,
        height: 200,
        border: "1px solid #A3A3A3",
        borderRadius: 5,
        background: "#FFF",
        overflow: "hidden",
      }}
    >
      {/* HEADER FIXO */}
      <div
        style={{
          background: "#F2F2F2",
          width: "100%",
          height: 60,
          padding: "10px 5px",
          borderBottom: "1px solid #A3A3A3",
          display: "flex",
          alignItems: "center",
        }}
      >
        <h3
          style={{
            margin: 0,
            fontWeight: 600,
            color: "#4A4A4A",
            textTransform: "uppercase",
            wordBreak: "break-word",
            fontSize: "clamp(10px, 2.6vw, 14px)",
            lineHeight: "1.2",
            overflow: "hidden",
            display: "-webkit-box",
            WebkitBoxOrient: "vertical",
            WebkitLineClamp: 3,
          }}
        >
          {title}
        </h3>
      </div>

      {/* BOTTOM SECTION */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column", // 👉 agora em coluna
          padding: "10px 20px",
          background: "#FFFFFF",
          fontSize: 14,
          color: "#333",
          position: "relative",
        }}
      >
        {/* Descrição (TOPO ESQUERDA) */}
        <span
          style={{
            fontWeight: 500,
            alignSelf: "flex-start",
          }}
        >
          {description || "SEM DESCRICAO"}
        </span>

        {/* Chevron (DIREITA, CENTRALIZADO VERTICALMENTE) */}
        <div
          onClick={onClick}
          style={{
            position: "absolute",
            right: 20,
            top: "50%",
            transform: "translateY(-50%)",
            cursor: "pointer",
          }}
        >
          <ChevronRight20Filled style={{ color: "#333" }} />
        </div>

        {/* Estrela (INFERIOR DIREITA) */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            onStarClick?.();
            setIsFav((prev) => !prev);
          }}
          style={{
            position: "absolute",
            bottom: 10,
            right: 12,
            cursor: "pointer",
          }}
        >
          <Star20Filled style={{ color: isFav ? "#f4b400" : "gray" }} />
        </div>
      </div>
    </div>
  );
};

export default SectorCard;
