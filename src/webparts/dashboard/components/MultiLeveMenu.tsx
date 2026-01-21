import React, { useState, useMemo, useEffect } from "react";
import {
  ChevronRight20Filled,
  ChevronDown20Filled,
  Search20Regular,
  CheckmarkCircle20Filled,
} from "@fluentui/react-icons";
import { Toggle } from "@fluentui/react";
import { normalizeText } from "../../../utils";

export interface IGenericNode {
  id: string;
  title: string;
  link?: string;
  children?: IGenericNode[];
  showChildren?: boolean;
  data?: any;
  // data?: {
  //   kpiValidado?: boolean;
  //   esconderNoMenu?: boolean;
  //   menuVisible?: boolean;
  //   [key: string]: any;
  // };
}

interface IMultiLevelMenuProps {
  data: IGenericNode[];
  onSelect: (node: IGenericNode) => void;
  menuVisible?: boolean;
  onToggleMenu?: (visible: boolean) => void;
  hideSearch?: boolean;
  expandAll?: boolean;
  showToggleOnlyValidates?: boolean;
}

/** 🔒 Visibilidade base */
const isHiddenInMenu = (node: IGenericNode) =>
  node.data?.esconderNoMenu === true || node.data?.menuVisible === false;

const MultiLevelMenu: React.FC<IMultiLevelMenuProps> = ({
  data,
  onSelect,
  menuVisible,
  onToggleMenu,
  hideSearch,
  expandAll,
  showToggleOnlyValidates,
}) => {
  const [expanded, setExpanded] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(true);
  const [onlyValidated, setOnlyValidated] = useState(false);

  const isMenuOpen =
    expandAll === true
      ? true
      : menuVisible !== undefined
      ? menuVisible
      : menuOpen;

  /** 🔓 IDs expansíveis */
  const getAllExpandableIds = (nodes: IGenericNode[]): string[] => {
    let ids: string[] = [];
    for (const node of nodes) {
      if (node.children?.length) {
        ids.push(node.id);
        ids = ids.concat(getAllExpandableIds(node.children));
      }
    }
    return ids;
  };

  /** 🌳 FILTRO FINAL CORRETO */
  const filterTree = (nodes: IGenericNode[], q: string): IGenericNode[] => {
    const query = normalizeText(q);

    return nodes.reduce<IGenericNode[]>((acc, node) => {
      if (isHiddenInMenu(node)) return acc;

      const filteredChildren = node.children
        ? filterTree(node.children, q)
        : [];

      const isGroup = !!node.children?.length;
      const isValidated = node.data?.kpiValidado === true;

      // 🔐 KPI não validado some
      if (onlyValidated && !isGroup && !isValidated) {
        return acc;
      }

      // 🔐 Grupo só entra se tiver filhos válidos
      if (onlyValidated && isGroup && filteredChildren.length === 0) {
        return acc;
      }

      // 🔍 Busca
      if (q.trim()) {
        const titleMatch = normalizeText(node.title).includes(query);
        if (!titleMatch && filteredChildren.length === 0) {
          return acc;
        }
      }

      acc.push({
        ...node,
        children: filteredChildren,
      });

      return acc;
    }, []);
  };

  const filteredData = useMemo(
    () => filterTree(data, search),
    [data, search, onlyValidated]
  );

  /** 🔄 Expansão SEMPRE consistente */
  useEffect(() => {
    setExpanded(getAllExpandableIds(filteredData));
  }, [filteredData]);

  /** 🧱 Renderização */
  const renderTree = (nodes: IGenericNode[], level = 0) =>
    nodes.map((node) => {
      const isOpen = expanded.includes(node.id);
      const hasChildren = !!node.children?.length;
      const isSelected = selected === node.id;

      return (
        <div key={node.id}>
          <div
            onClick={() => {
              if (node.link) {
                setSelected(node.id);
                onSelect(node);
              } else if (hasChildren) {
                setExpanded((p) =>
                  p.includes(node.id)
                    ? p.filter((x) => x !== node.id)
                    : [...p, node.id]
                );
              }
            }}
            style={{
              cursor: "pointer",
              padding: "8px 10px",
              marginLeft: level * 12,
              borderRadius: 4,
              fontWeight: level === 0 ? 600 : 400,
              display: "flex",
              justifyContent: "space-between",
              background: isSelected ? "#A32828" : "transparent",
              color: isSelected ? "#fff" : "#4A4A4A",
            }}
          >
            <span>{node.title}</span>

            {node.data?.kpiValidado && (
              <CheckmarkCircle20Filled color="#2e7d32" />
            )}

            {hasChildren &&
              (isOpen ? <ChevronDown20Filled /> : <ChevronRight20Filled />)}
          </div>

          {hasChildren && isOpen && renderTree(node.children!, level + 1)}
        </div>
      );
    });

  return (
    <div
      style={{
        width: isMenuOpen ? 320 : 0,
        padding: isMenuOpen ? 16 : 0,
        background: "#f0f0f0",
        transition: "all 0.3s ease",
      }}
    >
      {!hideSearch && (
        <>
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

          {showToggleOnlyValidates && (
            <Toggle
              label="Mostrar apenas validados"
              checked={onlyValidated}
              inlineLabel
              onChange={(_, v) => setOnlyValidated(!!v)}
            />
          )}
        </>
      )}

      {renderTree(filteredData)}
    </div>
  );
};

export default MultiLevelMenu;
