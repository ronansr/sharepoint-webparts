import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  ChevronRight20Filled,
  ChevronDown20Filled,
  Search20Regular,
  CheckmarkCircle20Filled,
  Edit20Regular,
  Star20Regular,
  Star20Filled,
  Pin20Filled,
  Pin20Regular,
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
  iconComponent?: React.ReactNode;
}

interface IMultiLevelMenuProps {
  data: IGenericNode[];
  onSelect: (node: IGenericNode) => void;
  menuVisible?: boolean;
  onToggleMenu?: (visible: boolean) => void;
  hideSearch?: boolean;
  expandAll?: boolean;
  showToggleOnlyValidates?: boolean;
  onPressEditItemGroup?: (id: any) => void | null;
  onPressStarItemGroup?: (id: any) => void;
  /** 🆕 Controle de expansão inicial */
  initialExpanded?: "open" | "closed";
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
  onPressEditItemGroup,
  onPressStarItemGroup,
  initialExpanded = "open",
}) => {
  const [expanded, setExpanded] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(true);
  const [onlyValidated, setOnlyValidated] = useState(false);

  /** 🔐 Garante que a lógica inicial rode só uma vez */
  const hasInitializedExpansion = useRef(false);

  const isMenuOpen =
    expandAll === true
      ? true
      : menuVisible !== undefined
      ? menuVisible
      : menuOpen;

  /** 🔓 IDs expansíveis */
  const getAllExpandableIds = (
    nodes: IGenericNode[],
    parentPath = ""
  ): string[] => {
    let ids: string[] = [];

    for (const node of nodes) {
      if (node.children?.length) {
        const key = `${parentPath}/${node.id}`;
        ids.push(key);
        ids = ids.concat(getAllExpandableIds(node.children, key));
      }
    }

    return ids;
  };

  /** 🌳 FILTRO FINAL */
  const filterTree = (nodes: IGenericNode[], q: string): IGenericNode[] => {
    const query = normalizeText(q);

    return nodes.reduce<IGenericNode[]>((acc, node) => {
      if (isHiddenInMenu(node)) return acc;

      const filteredChildren = node.children
        ? filterTree(node.children, q)
        : [];

      const isGroup = !!node.children?.length;
      const isValidated = node.data?.kpiValidado === true;

      if (onlyValidated && !isGroup && !isValidated) return acc;
      if (onlyValidated && isGroup && filteredChildren.length === 0) return acc;

      if (q.trim()) {
        const titleMatch = normalizeText(node.title).includes(query);
        if (!titleMatch && filteredChildren.length === 0) return acc;
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

  /** 🆕 Expansão inicial controlada por prop */
  useEffect(() => {
    if (hasInitializedExpansion.current) return;

    if (initialExpanded === "open") {
      setExpanded(getAllExpandableIds(filteredData));
    } else {
      setExpanded([]);
    }

    hasInitializedExpansion.current = true;
  }, [filteredData, initialExpanded]);

  /** 🧱 Renderização */
  const renderTree = (nodes: IGenericNode[], level = 0, parentPath = "") =>
    nodes.map((node) => {
      const expansionKey = `${parentPath}/${node.id}`;

      const isOpen = expanded.includes(expansionKey);
      // const isOpen = expanded.includes(node.id);
      const hasChildren = !!node.children?.length;
      const isSelected = selected === node.id;

      return (
        <div key={node.id}>
          <div
            onClick={() => {
              // seleciona se tiver link
              if (node.link) {
                setSelected(node.id);
                onSelect(node);
              }

              // expande/recolhe se tiver filhos
              if (hasChildren) {
                setExpanded((p) =>
                  p.includes(expansionKey)
                    ? p.filter((x) => x !== expansionKey)
                    : [...p, expansionKey]
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
              alignItems: "center",
              background: isSelected ? "#A32828" : "transparent",
              color: isSelected ? "#fff" : "#4A4A4A",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {node?.data?.iconComponent && node?.data?.iconComponent}
              <span>{node.title}</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {node.data?.kpiValidado && (
                <CheckmarkCircle20Filled color="#2e7d32" />
              )}

              {onPressStarItemGroup &&
                hasChildren &&
                node.data?.hideStar !== true && (
                  <>
                    {node.data?.isFavorited ? (
                      <Pin20Filled
                        onClick={(e) => {
                          e.stopPropagation();
                          onPressStarItemGroup(node.id);
                        }}
                        style={{
                          color: "black",
                        }}
                      />
                    ) : (
                      <Pin20Regular
                        onClick={(e) => {
                          e.stopPropagation();
                          onPressStarItemGroup(node.id);
                        }}
                        style={{
                          color: "gray",
                        }}
                      />
                    )}
                  </>
                )}
              {onPressEditItemGroup && hasChildren && (
                <Edit20Regular
                  onClick={(e) => {
                    e.stopPropagation();
                    onPressEditItemGroup(node.id);
                  }}
                />
              )}

              {hasChildren &&
                (isOpen ? <ChevronDown20Filled /> : <ChevronRight20Filled />)}
            </div>
          </div>

          {hasChildren &&
            isOpen &&
            renderTree(node.children!, level + 1, expansionKey)}
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
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        // minHeight: 500, // ✅ altura mínima do menu
      }}
    >
      {!hideSearch && isMenuOpen && (
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

              flexShrink: 0,
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

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          // minHeight: 500, // ✅ garante scroll mesmo sem flex pai externo
          paddingRight: 4, // evita corte da scrollbar
          maxHeight: 600,
        }}
      >
        {isMenuOpen && (
          filteredData.length === 0 ? (
            <div
              style={{
                padding: 16,
                textAlign: "center",
                color: "#666",
                fontSize: 14,
              }}
            >
              Nenhum item encontrado
            </div>
          ) : (
            renderTree(filteredData)
          )
        )}
      </div>
    </div>
  );
};

export default MultiLevelMenu;
