import * as React from "react";
import { Checkbox, IconButton, Separator, Stack, Text } from "@fluentui/react";
import { SPFI, spfi } from "@pnp/sp";
import { SPBrowser } from "@pnp/sp";
import { WebPartContext } from "@microsoft/sp-webpart-base";

import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import { ISelectedGroupItem } from "./CustomGroups";

/**
 * 🔹 Props
 */
interface IGroupItemsSelectorProps {
  context: WebPartContext;
  selectedItems: ISelectedGroupItem[];
  onChange: (items: ISelectedGroupItem[]) => void;
  searchText: string;
}

/**
 * 🔹 Item BaseDados
 */
interface IBaseDadosItem {
  Id: number;
  id0: string;
  Title: string;
  esconderNoMenu?: boolean;
}

const ITEMS_PER_PAGE = 8;

const GroupItemsSelector: React.FC<IGroupItemsSelectorProps> = ({
  context,
  selectedItems,
  onChange,
  searchText,
}) => {
  const [items, setItems] = React.useState<IBaseDadosItem[]>([]);
  const [favoriteIds, setFavoriteIds] = React.useState<string[]>([]);
  const [page, setPage] = React.useState(1);

  const sp: SPFI = spfi().using(
    SPBrowser({ baseUrl: context.pageContext.web.absoluteUrl })
  );

  React.useEffect(() => {
    loadItems();
    loadFavorites();
  }, []);

  React.useEffect(() => {
    setPage(1);
  }, [searchText]);

  /* 📥 BaseDados */
  const loadItems = async (): Promise<void> => {
    const data = await sp.web.lists
      .getByTitle("BaseDados")
      // .items.select("Id", "Title", "esconderNoMenu", "id")();
      .items();

    setItems(
      data.filter(
        (i) =>
          !i.esconderNoMenu &&
          i.link && // existe
          i.link.Url && // tem URL
          i.link.Url.trim() !== ""
      )
    );
  };

  /* ⭐ Favoritos */
  const loadFavorites = async (): Promise<void> => {
    const email = context.pageContext.user.email;

    const favs = await sp.web.lists
      .getByTitle("UsuarioListas")
      .items.filter(`email eq '${email}' and privado eq 1`)
      .select("idItem")();

    setFavoriteIds(favs.map((f) => String(f.idItem)));
  };

  /* ⭐ Salvar favorito */
  const saveFavorite = async (item: IBaseDadosItem) => {
    try {
      const email = context.pageContext.user.email;
      console.warn(item);

      await sp.web.lists.getByTitle("UsuarioListas").items.add({
        Title: item.Title,
        email,
        addDate: new Date(),
        privado: true,
        idItem: item.id0,
        nomeGrupo: "Favoritos",
        idGrupo: 1,
      });

      await loadFavorites();
    } catch (err) {
      console.error("Erro ao salvar favorito", err);
    }
  };

  /* ☑ Seleção */
  const toggleItem = (item: IBaseDadosItem): void => {
    const exists = selectedItems.some((x) => x.idItem === item.id0);

    if (exists) {
      onChange(selectedItems.filter((x) => x.idItem !== item.id0));
    } else {
      onChange([...selectedItems, { idItem: item.id0, title: item.Title }]);
    }
  };

  /* 🔍 Filtro + ordenação */

  const orderedItems = React.useMemo(() => {
    const q = searchText.toLowerCase();

    return items
      .filter((item) => (!q ? true : item.Title.toLowerCase().includes(q)))
      .sort((a, b) => {
        const aId = String(a.id0);
        const bId = String(b.id0);

        /* ☑ Selecionados primeiro */
        const aSelected = selectedItems.some((s) => s.idItem === aId);
        const bSelected = selectedItems.some((s) => s.idItem === bId);

        if (aSelected !== bSelected) {
          return aSelected ? -1 : 1;
        }

        /* ⭐ Favoritos depois */
        const aFav = favoriteIds.includes(aId);
        const bFav = favoriteIds.includes(bId);

        if (aFav !== bFav) {
          return aFav ? -1 : 1;
        }

        /* 🔤 Ordem alfabética */
        return a.Title.localeCompare(b.Title);
      });
  }, [items, selectedItems, favoriteIds, searchText]);

  const totalPages = Math.ceil(orderedItems.length / ITEMS_PER_PAGE);

  const pagedItems = orderedItems.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  return (
    <Stack tokens={{ childrenGap: 0 }}>
      {pagedItems.map((item) => {
        const id = String(item.id0);
        const isChecked = selectedItems.some((x) => x.idItem === id);
        const isFavorite = favoriteIds.includes(id);

        return (
          <React.Fragment key={item.Id}>
            <Stack
              horizontal
              verticalAlign="center"
              horizontalAlign="space-between"
              styles={{ root: { padding: "10px 6px" } }}
            >
              <Text>{item.Title}</Text>

              <Stack horizontal tokens={{ childrenGap: 8 }}>
                {/* ⭐ Favorito */}
                <IconButton
                  iconProps={{
                    iconName: isFavorite ? "FavoriteStarFill" : "FavoriteStar",
                  }}
                  title="Favoritar"
                  ariaLabel="Favoritar"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isFavorite) saveFavorite(item);
                  }}
                />

                {/* ☑ Checkbox */}
                <Checkbox
                  checked={isChecked}
                  onChange={() => toggleItem(item)}
                />
              </Stack>
            </Stack>

            <Separator />
          </React.Fragment>
        );
      })}

      {/* ⏮ Paginação */}
      {totalPages > 1 && (
        <Stack
          horizontal
          horizontalAlign="center"
          tokens={{ childrenGap: 8 }}
          styles={{ root: { marginTop: 8 } }}
        >
          <IconButton
            iconProps={{ iconName: "ChevronLeft" }}
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          />
          <Text>
            {page} / {totalPages}
          </Text>
          <IconButton
            iconProps={{ iconName: "ChevronRight" }}
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
          />
        </Stack>
      )}
    </Stack>
  );
};

export default GroupItemsSelector;
