interface IKpi {
  id: string;
  title: string;
  [key: string]: any;
}
interface ICategoria {
  id: string;
  title: string;
  kpis: IKpi[];
  link?: any;
}
interface ITema {
  id: string;
  title: string;
  descricao?: string;
  categorias: ICategoria[];
}
interface IDiretriz {
  id: string;
  title: string;
  descricao?: string;
  temas: ITema[];
  extradata?: any;
}
