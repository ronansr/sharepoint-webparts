export interface BaseDados {
  Id: number; // ID interno do SharePoint
  Title: string; // Título

  nm_linha?: number; // Nível da linha (ex: 1, 2, etc)
  id?: string; // Código (D1, D5, T1, C1, FCO 006.A)

  diretriz?: string; // Diretriz (D1, D5, etc)
  tema?: string; // Tema (T1)
  categoria?: string; // Categoria (C1)

  kpis?: string[]; // KPIs (ex: ["FCO 006.A", "FCO 006.B"])
  status?: boolean; // Status (True / False)
  esconderNoMenu?: boolean; // Status (True / False)

  extradata?: string; // Campo extra (se existir)
  link?: string; // Link (se existir)

  updated?: string; // Data de atualização (ISO string)
}
