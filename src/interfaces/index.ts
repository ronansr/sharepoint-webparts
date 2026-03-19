interface IKpi {
  id: string;
  title: string;
  [key: string]: any;
  ids_persona?: any[];
  ordemExibicao?: number;
  kpiAlerta?: boolean;


}
interface ICategoria {
  id: string;
  title: string;
  kpis: IKpi[];
  link?: any;
  ids_persona?: string[];
  ordemExibicao?: number;
  kpiAlerta?: boolean;
  
}
interface ITema {
  id: string;
  title: string;
  descricao?: string;
  categorias: ICategoria[];
  ids_persona?: string[];
  ordemExibicao?: number;
  kpiAlerta?: boolean;


}
interface IDiretriz {
  id: string;
  title: string;
  descricao?: string;
  temas: ITema[];
  ids_persona?: string[];
  extradata?: any;
  ordemExibicao?: number;
  kpiAlerta?: boolean;

}
