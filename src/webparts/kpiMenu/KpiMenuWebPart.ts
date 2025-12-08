import { BaseClientSideWebPart } from "@microsoft/sp-webpart-base";
import { PropertyPaneDynamicField } from "@microsoft/sp-property-pane";
import * as React from "react";
import * as ReactDom from "react-dom";
import KpiMenu from "./components/KpiMenu";
import { IKpiMenuProps } from "./components/IKpiMenuProps";

export interface IKpiMenuWebPartProps {
  selectedSectorField?: any; // preenchido via PropertyPaneDynamicField
}

export default class KpiMenuWebPart extends BaseClientSideWebPart<IKpiMenuWebPartProps> {
  public render(): void {
    const element = React.createElement(KpiMenu, {
      siteUrl: this.context.pageContext.web.absoluteUrl,
      selectedSectorField: this.properties.selectedSectorField,
      context: this.context,
    } as IKpiMenuProps);

    ReactDom.render(element, this.domElement);
  }

  protected getPropertyPaneConfiguration() {
    return {
      pages: [
        {
          header: { description: "Configuração do KPI Menu" },
          groups: [
            {
              groupName: "Dados Dinâmicos",
              groupFields: [
                PropertyPaneDynamicField("selectedSectorField", {
                  label: "Setor Selecionado",
                }),
              ],
            },
          ],
        },
      ],
    };
  }
}

// import { BaseClientSideWebPart } from "@microsoft/sp-webpart-base";
// import { IDynamicDataCallables } from "@microsoft/sp-dynamic-data";
// import * as React from "react";
// import * as ReactDom from "react-dom";

// import KpiMenu from "./components/KpiMenu";
// import { IKpiMenuProps } from "./components/IKpiMenuProps";

// export interface IKpiMenuWebPartProps {}

// export default class KpiMenuWebPart
//   extends BaseClientSideWebPart<IKpiMenuWebPartProps>
//   implements IDynamicDataCallables
// {
//   private selectedLink: string | null = null;

//   protected onInit(): Promise<void> {
//     this.context.dynamicDataSourceManager.initializeSource(this);
//     return super.onInit();
//   }

//   public getPropertyDefinitions() {
//     return [{ id: "selectedLink", title: "Link do KPI selecionado" }];
//   }

//   public getPropertyValue(propertyId: string): any {
//     if (propertyId === "selectedLink") return this.selectedLink;
//     return undefined;
//   }

//   public setSelectedLink(link: string) {
//     this.selectedLink = link;
//     this.context.dynamicDataSourceManager.notifyPropertyChanged("selectedLink");
//   }

//   public render(): void {
//     const element = React.createElement(KpiMenu, {
//       context: this.context,
//       siteUrl: this.context.pageContext.web.absoluteUrl,
//       setSelectedLink: this.setSelectedLink.bind(this),
//     } as IKpiMenuProps);

//     ReactDom.render(element, this.domElement);
//   }
// }
