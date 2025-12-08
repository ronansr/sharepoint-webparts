import * as React from "react";

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
      >
        Ver mais
      </button>
    </div>
  );
};

export default SectorCard;
