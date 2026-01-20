import * as React from "react";
import * as ReactDom from "react-dom";
import { BaseClientSideWebPart } from "@microsoft/sp-webpart-base";
import CustomGroups from "./components/CustomGroups";

export interface ICustomGroupsWebPartProps {}

export default class CustomGroupsWebPart extends BaseClientSideWebPart<ICustomGroupsWebPartProps> {
  public render(): void {
    const element = React.createElement(CustomGroups, {
      context: this.context,
    });

    ReactDom.render(element, this.domElement);
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }
}
