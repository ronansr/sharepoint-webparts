import { Version } from "@microsoft/sp-core-library";
import { BaseClientSideWebPart } from "@microsoft/sp-webpart-base";
import * as React from "react";
import * as ReactDom from "react-dom";
import Dashboard from "./components/Dashboard";
import {
  PropertyPaneToggle,
  PropertyPaneTextField,
} from "@microsoft/sp-property-pane";

export interface IDashboardWebPartProps {
  enableCleanLayout: boolean;
  useInternalHeader: boolean;
  additionalCss: string; // 👈 NOVA PROPRIEDADE
}

export default class DashboardWebPart extends BaseClientSideWebPart<IDashboardWebPartProps> {
  private selectedSector: string | null = null;

  protected onInit(): Promise<void> {
    this.context.dynamicDataSourceManager.initializeSource(this);

    this.properties.enableCleanLayout ??= false;
    this.properties.useInternalHeader ??= false;
    this.properties.additionalCss ??= ""; // 👈 default

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
                PropertyPaneToggle("useInternalHeader", {
                  label: "Usar Header interno",
                  onText: "Sim",
                  offText: "Não",
                }),
                PropertyPaneTextField("additionalCss", {
                  label: "CSS adicional",
                  multiline: true,
                  rows: 10,
                  placeholder: "Digite CSS customizado aqui...",
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
      useInternalHeader: this.properties.useInternalHeader,
      additionalCss: this.properties.additionalCss, // 👈 PASSANDO
    });

    ReactDom.render(element, this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse("1.2");
  }
}
