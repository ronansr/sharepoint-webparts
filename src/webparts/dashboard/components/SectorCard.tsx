import * as React from "react";
import { ChevronRight20Filled, Star20Filled } from "@fluentui/react-icons";

interface ISectorCardProps {
  title: string;
  description?: string;
  onClick: () => void;
  onStarClick?: () => void;
}

const SectorCard: React.FC<ISectorCardProps> = ({
  title,
  description,
  onClick,
  onStarClick,
}) => {
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
          }}
          style={{
            position: "absolute",
            bottom: 10,
            right: 12,
            cursor: "pointer",
          }}
        >
          <Star20Filled style={{ color: "#f4b400" }} />
        </div>
      </div>
    </div>
  );
};

export default SectorCard;
