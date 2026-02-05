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
  isBuilding?: boolean; // 🆕 NOVA PROP
}

const SectorCard: React.FC<ISectorCardProps> = ({
  title,
  description,
  onClick,
  onStarClick,
  context,
  siteUrl,
  id,
  isBuilding = false,
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

      setIsFav(result.length > 0);
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
        minHeight: 200,
        height: 260,
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
          height: 180, // ✅ tamanho fixo do bottom
          display: "flex",
          flexDirection: "column",
          padding: "10px 20px",
          fontSize: 12,
          color: "#333",
          position: "relative",
          overflow: "hidden",

          // 🧊 GLASS EFFECT
          background: isBuilding ? "rgba(255, 255, 255, 0.45)" : "#FFFFFF",

          backdropFilter: isBuilding ? "blur(8px)" : "none",
          WebkitBackdropFilter: isBuilding ? "blur(8px)" : "none",

          borderTop: isBuilding ? "1px solid rgba(255,255,255,0.6)" : undefined,

          boxShadow: isBuilding
            ? "inset 0 0 0 1px rgba(255,255,255,0.4)"
            : undefined,

          pointerEvents: isBuilding ? "none" : "auto",
        }}
      >
        {/* DESCRIÇÃO */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            paddingRight: 10,
            marginBottom: 24,
          }}
        >
          <span
            style={{
              fontWeight: 500,
              display: "block",
              whiteSpace: "pre-wrap",
              lineHeight: 1.4,
              paddingRight: 5,
            }}
          >
            {description || "SEM DESCRIÇÃO"}
          </span>
        </div>

        {/* Chevron */}
        <div
          onClick={!isBuilding ? onClick : undefined}
          style={{
            position: "absolute",
            right: 20,
            top: "50%",
            transform: "translateY(-50%)",
            cursor: isBuilding ? "default" : "pointer",
          }}
        >
          <ChevronRight20Filled style={{ color: "#333" }} />
        </div>

        {/* Estrela */}
        {onStarClick ? (
          <div
            onClick={(e) => {
              if (isBuilding) return;
              e.stopPropagation();
              onStarClick?.();
              setIsFav((prev) => !prev);
            }}
            style={{
              position: "absolute",
              bottom: 10,
              right: 20,
              cursor: isBuilding ? "default" : "pointer",
            }}
          >
            <Star20Filled style={{ color: isFav ? "#f4b400" : "gray" }} />
          </div>
        ) : (
          <></>
        )}

        {/* 🛑 OVERLAY "EM DESENVOLVIMENTO" */}
        {isBuilding && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(255,255,255,0.6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: 16,
              color: "#1e1e1e",
              textTransform: "uppercase",
              pointerEvents: "none",
            }}
          >
            Em desenvolvimento
          </div>
        )}
      </div>
    </div>
  );
};

export default SectorCard;
