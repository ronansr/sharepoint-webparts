import * as React from "react";
import * as ReactDom from "react-dom";
import { BaseClientSideWebPart } from "@microsoft/sp-webpart-base";
import Header from "./components/Header";

export interface IHeaderWebPartProps {
  logoUrl: string;
}

export default class HeaderWebPart extends BaseClientSideWebPart<IHeaderWebPartProps> {
  public render(): void {
    const element = React.createElement(Header, {
      logoSrc:
        this.properties.logoUrl || require("../../assets/univesp-logo.png"),
      context: this.context,
    });

    ReactDom.render(element, this.domElement);
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }
}
