import { WebPartContext } from "@microsoft/sp-webpart-base";

export interface IKpiMenuProps {
  context: WebPartContext;
  siteUrl: string;
  selectedSectorField?: any; // qualquer tipo que venha do PropertyPaneDynamicField
}
// export interface IKpiMenuProps {
//   siteUrl: string;
//   setSelectedLink: (link: string) => void;
//   context: any;
//   selectedSector: any;
// }
