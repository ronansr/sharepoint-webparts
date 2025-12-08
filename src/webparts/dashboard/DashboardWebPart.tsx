import { Version } from "@microsoft/sp-core-library";
import { BaseClientSideWebPart } from "@microsoft/sp-webpart-base";
import * as React from "react";
import * as ReactDom from "react-dom";
import Dashboard from "./components/Dashboard";
import { IDashboardProps } from "./components/IDashboardProps";
import { IDynamicDataCallables } from "@microsoft/sp-dynamic-data";

export interface IDashboardWebPartProps {}

export default class DashboardWebPart
  extends BaseClientSideWebPart<IDashboardWebPartProps>
  implements IDynamicDataCallables
{
  private selectedSector: number | null = null;

  protected onInit(): Promise<void> {
    this.context.dynamicDataSourceManager.initializeSource(this);
    return super.onInit();
  }

  public getPropertyDefinitions() {
    return [{ id: "selectedSector", title: "Setor Selecionado" }];
  }

  public getPropertyValue(propertyId: string): any {
    if (propertyId === "selectedSector") return this.selectedSector;
    return undefined;
  }

  public setSelectedSectorValue(sectorId: number) {
    this.selectedSector = sectorId;
    this.context.dynamicDataSourceManager.notifyPropertyChanged(
      "selectedSector"
    );
  }

  public render(): void {
    const element = React.createElement(Dashboard, {
      siteUrl: this.context.pageContext.web.absoluteUrl,
      setSelectedSector: this.setSelectedSectorValue.bind(this),
    } as IDashboardProps);

    ReactDom.render(element, this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse("1.0");
  }
}

// import { Version } from "@microsoft/sp-core-library";
// import { BaseClientSideWebPart } from "@microsoft/sp-webpart-base";
// import * as React from "react";
// import * as ReactDom from "react-dom";

// import Dashboard from "./components/Dashboard";
// import { SelectedSectorProvider } from "../../shared/context/SelectedSectorContext";

// export interface IDashboardWebPartProps {}

// export default class DashboardWebPart extends BaseClientSideWebPart<IDashboardWebPartProps> {
//   public render(): void {
//     ReactDom.render(
//       <SelectedSectorProvider>
//         <Dashboard siteUrl={this.context.pageContext.web.absoluteUrl} />
//       </SelectedSectorProvider>,
//       this.domElement
//     );
//   }

//   protected get dataVersion(): Version {
//     return Version.parse("1.0");
//   }
// }
