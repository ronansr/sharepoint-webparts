import * as React from "react";
import * as ReactDom from "react-dom";
import { BaseClientSideWebPart } from "@microsoft/sp-webpart-base";

import Search from "./components/Search";
import { ISearchProps } from "./components/ISearchProps";

export default class SearchWebPart extends BaseClientSideWebPart<{}> {
  public render(): void {
    const element: React.ReactElement<ISearchProps> = React.createElement(
      Search,
      {}
    );

    ReactDom.render(element, this.domElement);
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }
}
