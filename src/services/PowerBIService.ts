// src/services/PowerBIService.ts

import { WebPartContext } from "@microsoft/sp-webpart-base";
import * as pbi from "powerbi-client";

export class PowerBIService {
  public async embedReport(
    context: WebPartContext,
    embedUrl: string,
    reportId: string
  ): Promise<void> {
    // Token AAD
    const tokenProvider =
      await context.aadTokenProviderFactory.getTokenProvider();
    const token = await tokenProvider.getToken(
      "https://analysis.windows.net/powerbi/api"
    );

    const config: pbi.IEmbedConfiguration = {
      type: "report",
      embedUrl,
      accessToken: token,
      tokenType: pbi.models.TokenType.Aad,
      id: reportId,
      permissions: pbi.models.Permissions.Read,
      settings: {
        filterPaneEnabled: false,
        navContentPaneEnabled: true,
      },
    };

    const embedContainer = document.getElementById("reportContainer");

    if (!embedContainer) {
      console.error("❌ reportContainer não encontrado no DOM");
      return;
    }

    const powerbi = new pbi.service.Service(
      pbi.factories.hpmFactory,
      pbi.factories.wpmpFactory,
      pbi.factories.routerFactory
    );

    powerbi.embed(embedContainer, config);
  }
}
