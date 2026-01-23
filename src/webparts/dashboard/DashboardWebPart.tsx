import { Version } from "@microsoft/sp-core-library";
import { BaseClientSideWebPart } from "@microsoft/sp-webpart-base";
import * as React from "react";
import * as ReactDom from "react-dom";
import Dashboard from "./components/Dashboard";
// import { IDynamicDataCallables } from "@microsoft/sp-dynamic-data";
import { PropertyPaneToggle } from "@microsoft/sp-property-pane";

export interface IDashboardWebPartProps {
  enableCleanLayout: boolean;
}

export default class DashboardWebPart extends BaseClientSideWebPart<IDashboardWebPartProps> {
  // implements IDDynamicDataCallables
  private selectedSector: string | null = null;

  protected onInit(): Promise<void> {
    this.context.dynamicDataSourceManager.initializeSource(this);
    this.properties.enableCleanLayout ??= false;
    return super.onInit();
  }

  public getPropertyDefinitions() {
    return [{ id: "selectedSector", title: "Setor Selecionado" }];
  }

  public getPropertyValue(propertyId: string): any {
    if (propertyId === "selectedSector") return this.selectedSector;
    return undefined;
  }

  public setSelectedSectorValue(sectorId: string) {
    this.selectedSector = sectorId;

    this.context.dynamicDataSourceManager.notifyPropertyChanged(
      "selectedSector"
    );
  }

  protected getPropertyPaneConfiguration() {
    return {
      pages: [
        {
          header: {
            description: "Configurações do Dashboard",
          },
          groups: [
            {
              groupName: "Layout",
              groupFields: [
                PropertyPaneToggle("enableCleanLayout", {
                  label: "Modo tela limpa",
                  onText: "Ativado",
                  offText: "Desativado",
                }),
              ],
            },
          ],
        },
      ],
    };
  }

  public render(): void {
    const element = React.createElement(Dashboard, {
      siteUrl: this.context.pageContext.web.absoluteUrl,
      setSelectedSector: this.setSelectedSectorValue.bind(this),
      context: this.context,
      enableCleanLayout: this.properties.enableCleanLayout,
    });

    ReactDom.render(element, this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse("1.0");
  }
}
