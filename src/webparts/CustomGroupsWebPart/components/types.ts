// types.ts
export interface IBaseDadosItem {
  id: string;
  title: string;
  categoria?: string;
  kpis?: string[];
  link?: string;
}

export interface IGrupoPersonalizado {
  nome: string;
  publico: boolean;
  itens: string[];
}
