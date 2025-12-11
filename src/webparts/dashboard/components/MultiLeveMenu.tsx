import React, { useState, useMemo } from "react";
import {
  ChevronRight20Filled,
  ChevronDown20Filled,
  ChevronLeft20Filled,
  Search20Regular,
} from "@fluentui/react-icons";

export interface IGenericNode {
  id: string;
  title: string;
  link?: string;
  children?: IGenericNode[];
  data?: any;
  showChildren?: boolean; // nova propriedade
}

interface IMultiLevelMenuProps {
  data: IGenericNode[];
  onSelect: (node: IGenericNode) => void;
  menuVisible?: boolean; // visibilidade controlada externamente
  onToggleMenu?: (visible: boolean) => void; // callback ao alterar visibilidade
}

const MultiLevelMenu: React.FC<IMultiLevelMenuProps> = ({
  data,
  onSelect,
  menuVisible,
  onToggleMenu,
}) => {
  const [expanded, setExpanded] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(true);

  // Sincroniza menuOpen com prop externa, se fornecida
  const isMenuOpen = menuVisible !== undefined ? menuVisible : menuOpen;

  const toggleMenu = () => {
    if (onToggleMenu) {
      onToggleMenu(!isMenuOpen);
    } else {
      setMenuOpen((prev) => !prev);
    }
  };

  const toggle = (id: string) => {
    setExpanded((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const filterTree = (nodes: IGenericNode[], q: string): IGenericNode[] => {
    if (!q.trim()) return nodes;
    return nodes
      .map((node) => {
        const match =
          node.title.toLowerCase().includes(q.toLowerCase()) ||
          node.children?.some((c) =>
            c.title.toLowerCase().includes(q.toLowerCase())
          );
        if (match) {
          return {
            ...node,
            children: node.children ? filterTree(node.children, q) : [],
          };
        }
        return null;
      })
      .filter(Boolean) as IGenericNode[];
  };

  const filteredData = useMemo(() => filterTree(data, search), [data, search]);

  const renderTree = (nodes: IGenericNode[], level = 0) =>
    nodes.map((node) => {
      const isOpen = expanded.includes(node.id);
      const hasChildren =
        !!node.children?.length && node.showChildren !== false;
      const isSelected = selected === node.id;

      return (
        <div key={node.id} style={{ marginBottom: 2 }}>
          <div
            onClick={() => {
              if (hasChildren) toggle(node.id);
              if (node.link || !hasChildren) {
                setSelected(node.id);
                onSelect(node);
              }
            }}
            onMouseEnter={(e) => {
              if (!isSelected) e.currentTarget.style.background = "#F2F2F2";
            }}
            onMouseLeave={(e) => {
              if (!isSelected) e.currentTarget.style.background = "transparent";
            }}
            style={{
              cursor: "pointer",
              padding: "8px 10px",
              marginLeft: level === 0 ? 0 : level * 12,
              borderRadius: 4,
              fontWeight: level === 0 ? 600 : 400,
              fontSize: level === 0 ? 15 : 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: isSelected ? "#A32828" : "transparent",
              color: isSelected ? "#fff" : "#4A4A4A",
              transition: "background 0.15s ease",
            }}
          >
            <span>{node.title}</span>
            {hasChildren && (
              <span style={{ marginLeft: 8 }}>
                {isOpen ? (
                  <ChevronDown20Filled color={isSelected ? "white" : "black"} />
                ) : (
                  <ChevronRight20Filled
                    color={isSelected ? "white" : "black"}
                  />
                )}
              </span>
            )}
          </div>

          {hasChildren && isOpen && (
            <div style={{ marginTop: 4 }}>
              {renderTree(node.children ?? [], level + 1)}
            </div>
          )}
        </div>
      );
    });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Botão para ocultar/mostrar menu */}
      {/* <div
        onClick={toggleMenu}
        style={{
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 32,
          height: 32,
          borderRadius: 20,
          background: "#ddd",
          marginBottom: 8,
          transition: "all 0.3s ease",
        }}
      >
        {isMenuOpen ? <ChevronLeft20Filled /> : <ChevronRight20Filled />}
      </div> */}

      <div
        style={{
          width: isMenuOpen ? 320 : 0,
          opacity: isMenuOpen ? 1 : 0,
          padding: isMenuOpen ? 20 : 0,
          overflow: "hidden",
          border: isMenuOpen ? "1px solid #ddd" : "none",
          borderRadius: isMenuOpen ? 5 : 0,
          background: "#f0f0f0",
          boxSizing: "border-box",
          transition: "all 0.3s ease",
        }}
      >
        {/* Barra de pesquisa */}
        <div
          style={{
            width: "100%",
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            border: "1px solid #D6D6D6",
            padding: "6px 10px",
            borderRadius: 40,
            background: "#FFF",
            boxSizing: "border-box",
            gap: 8,
          }}
        >
          <input
            placeholder="Pesquisar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              border: "none",
              outline: "none",
              fontSize: 14,
              background: "transparent",
            }}
          />

          <Search20Regular color="#333" />
        </div>

        {renderTree(filteredData)}
      </div>
    </div>
  );
};

export default MultiLevelMenu;
