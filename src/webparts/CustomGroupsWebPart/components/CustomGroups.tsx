import * as React from "react";
import {
  Stack,
  Text,
  PrimaryButton,
  DefaultButton,
  Toggle,
} from "@fluentui/react";
import GroupItemsSelector from "./GroupItemsSelector";
import { WebPartContext } from "@microsoft/sp-webpart-base";
import { generateIdGrupo } from "../../../utils";
import { SPFI, spfi } from "@pnp/sp";
import { SPBrowser } from "@pnp/sp";

export interface ISelectedGroupItem {
  idItem: string;
  title: string;
}

interface ICustomGroupsProps {
  context: WebPartContext;
  idGrupoSelecionado?: number | null;
  onClose?: () => void;
}

const CustomGroups: React.FC<ICustomGroupsProps> = ({
  context,
  idGrupoSelecionado,
  onClose,
}) => {
  const [groupName, setGroupName] = React.useState("");
  const [isPublic, setIsPublic] = React.useState(true);
  const [selectedItems, setSelectedItems] = React.useState<
    ISelectedGroupItem[]
  >([]);
  const [saving, setSaving] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const canSave = !!groupName.trim() && selectedItems.length > 0 && !saving;

  const sp: SPFI = spfi().using(
    SPBrowser({ baseUrl: context.pageContext.web.absoluteUrl })
  );
  const savingRef = React.useRef(false);

  /* 🔄 Carregar lista existente */
  React.useEffect(() => {
    if (idGrupoSelecionado) {
      loadGroup(idGrupoSelecionado);
    }
  }, [idGrupoSelecionado]);

  const loadGroup = async (idGrupo: number): Promise<void> => {
    try {
      const email = context.pageContext.user.email;

      const items = await sp.web.lists
        .getByTitle("UsuarioListas")
        .items.filter(`email eq '${email}' and idGrupo eq ${idGrupo}`)
        .select("Title", "idItem", "privado", "nomeGrupo")();

      if (!items.length) return;

      setGroupName(items[0].nomeGrupo);
      setIsPublic(!items[0].privado);

      setSelectedItems(
        items.map((i) => ({
          idItem: String(i.idItem),
          title: i.Title,
        }))
      );
    } catch (err) {
      console.error("Erro ao carregar lista", err);
    }
  };

  /* 💾 Criar / salvar lista */
  const saveGroup = async (): Promise<void> => {
    if (savingRef.current) return; // 🔒 trava REAL

    savingRef.current = true;
    setSaving(true);

    try {
      const email = context.pageContext.user.email;
      const name = context.pageContext.user.displayName;
      const addDate = new Date();
      const idGrupo = idGrupoSelecionado ?? generateIdGrupo();

      if (idGrupoSelecionado) {
        await deleteGroup(false);
      }

      for (const item of selectedItems) {
        await sp.web.lists.getByTitle("UsuarioListas").items.add({
          Title: item.title,
          email,
          addDate,
          privado: !isPublic,
          nomeGrupo: groupName,
          idGrupo,
          idItem: item.idItem,
          nomeAutor: name,
        });
      }

      // alert("Grupo salvo com sucesso!");
      onClose?.();
    } catch (error) {
      console.error("Erro ao salvar lista", error);
      alert("Erro ao salvar a lista");
    } finally {
      savingRef.current = false; // 🔓 libera
      setSaving(false);
    }
  };

  // const saveGroup = async (): Promise<void> => {
  //   try {
  //     setSaving(true);

  //     const email = context.pageContext.user.email;
  //     const name = context.pageContext.user.displayName;
  //     const addDate = new Date();
  //     const idGrupo = idGrupoSelecionado ?? generateIdGrupo();

  //     // Se estiver editando, remove registros antigos
  //     if (idGrupoSelecionado) {
  //       await deleteGroup(false);
  //     }

  //     for (const item of selectedItems) {
  //       await sp.web.lists.getByTitle("UsuarioListas").items.add({
  //         Title: item.title,
  //         email,
  //         addDate,
  //         privado: !isPublic,
  //         nomeGrupo: groupName,
  //         idGrupo,
  //         idItem: item.idItem,
  //         nomeAutor: name,
  //       });
  //     }

  //     alert("Grupo salvo com sucesso!");
  //     onClose?.();
  //   } catch (error) {
  //     console.error("Erro ao salvar lista", error);
  //     alert("Erro ao salvar o lista");
  //   } finally {
  //     setSaving(false);
  //   }
  // };

  /* 🗑 Excluir lista */
  const deleteGroup = async (showConfirm = true): Promise<void> => {
    if (!idGrupoSelecionado) return;

    if (showConfirm) {
      const confirmDelete = confirm(
        "Tem certeza que deseja excluir este lista? Essa ação não pode ser desfeita."
      );
      if (!confirmDelete) return;
    }

    try {
      setSaving(true);

      const email = context.pageContext.user.email;

      const items = await sp.web.lists
        .getByTitle("UsuarioListas")
        .items.filter(
          `email eq '${email}' and idGrupo eq ${idGrupoSelecionado}`
        )();

      for (const item of items) {
        await sp.web.lists
          .getByTitle("UsuarioListas")
          .items.getById(item.Id)
          .delete();
      }

      // alert("Grupo excluído com sucesso!");
      onClose?.();
    } catch (error) {
      console.error("Erro ao excluir lista", error);
      alert("Erro ao excluir o lista");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Stack
      tokens={{ childrenGap: 20 }}
      styles={{
        root: {
          background: "#fff",
          padding: 24,
          borderRadius: 8,
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        },
      }}
    >
      <Text variant="xLarge">
        {idGrupoSelecionado ? "Editar lista" : "Criar lista personalizada"}
      </Text>

      <Text>
        Crie listas personalizadas de indicadores para facilitar o acesso e a
        análise dos dados.
      </Text>

      {/* 🏷 Nome */}

      {/* 👁 Visibilidade */}
      <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 12 }}>
        <input
          placeholder="Nome da lista"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          style={{
            padding: 10,
            borderRadius: 4,
            border: "1px solid #ccc",
            fontSize: 14,
            width: 300,
          }}
        />
        <Toggle
          label="Público"
          inlineLabel
          checked={isPublic}
          onChange={(_, checked) => setIsPublic(!!checked)}
        />
      </Stack>

      {/* 🔍 Pesquisa */}
      <Stack horizontal horizontalAlign="space-between" verticalAlign="center">
        <Text variant="large" styles={{ root: { fontWeight: 600 } }}>
          Categorias e KPIs disponíveis
        </Text>

        <input
          placeholder="Pesquisar..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: "6px 10px",
            borderRadius: 20,
            border: "1px solid #ccc",
            fontSize: 13,
            width: 220,
          }}
        />
      </Stack>

      {/* 📋 Lista */}
      <GroupItemsSelector
        context={context}
        selectedItems={selectedItems}
        onChange={setSelectedItems}
        searchText={search}
      />

      {/* 🎯 Ações */}
      <Stack horizontal horizontalAlign="space-between">
        <Stack horizontal tokens={{ childrenGap: 8 }}>
          {onClose && <DefaultButton text="Cancelar" onClick={onClose} />}

          {idGrupoSelecionado && (
            <DefaultButton
              text="Excluir"
              onClick={() => deleteGroup()}
              styles={{
                root: { background: "#fde7e9", color: "#a4262c" },
              }}
            />
          )}
        </Stack>

        <PrimaryButton
          text={saving ? "Salvando..." : "Salvar lista"}
          onClick={saveGroup}
          disabled={!canSave}
        />
      </Stack>
    </Stack>
  );
};

export default CustomGroups;
