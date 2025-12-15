import { WebPartContext } from "@microsoft/sp-webpart-base";
import * as pbi from "powerbi-client";

export class PowerBIService {
  private powerbi: pbi.service.Service;
  public report?: pbi.Report;
  private resizeObserver?: ResizeObserver;
  private resizeTimeout?: number;
  private isResizing: boolean = false; // 🔒 Flag para evitar loop
  private lastContainerWidth?: number;

  constructor() {
    this.powerbi = new pbi.service.Service(
      pbi.factories.hpmFactory,
      pbi.factories.wpmpFactory,
      pbi.factories.routerFactory
    );
  }

  public async embedReport(
    context: WebPartContext,
    embedUrl: string,
    reportId: string
  ): Promise<void> {
    // 🔐 Token AAD
    const tokenProvider =
      await context.aadTokenProviderFactory.getTokenProvider();

    const token = await tokenProvider.getToken(
      "https://analysis.windows.net/powerbi/api"
    );

    const container = document.getElementById("reportContainer");

    if (!container) {
      console.error("❌ reportContainer não encontrado");
      return;
    }

    // 🔄 RESET obrigatório (troca de relatório)
    this.powerbi.reset(container);

    const config: pbi.IEmbedConfiguration = {
      type: "report",
      embedUrl,
      id: reportId,
      accessToken: token,
      tokenType: pbi.models.TokenType.Aad,
      permissions: pbi.models.Permissions.Read,
      settings: {
        filterPaneEnabled: false,
        navContentPaneEnabled: true,
        layoutType: pbi.models.LayoutType.Custom,
        customLayout: {
          displayOption: pbi.models.DisplayOption.FitToPage,
        },
      },
    };

    // ▶ Embed
    this.report = this.powerbi.embed(container, config) as pbi.Report;

    // ✅ Quando carregar (apenas primeira vez)
    this.report.on("loaded", () => {
      console.log("✅ Relatório carregado");
      // Pequeno delay para garantir que o DOM está pronto
      setTimeout(() => this.forceResize(), 100);
    });

    // ❌ REMOVIDO: evento 'rendered' causa loop infinito

    // 📐 Observa resize do container
    this.observeResize(container);

    // 🔁 Resize global (fullscreen depende disso)
    window.addEventListener("resize", this.handleWindowResize);
  }

  // 📐 Resize Observer
  private observeResize(container: HTMLElement) {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }

    this.resizeObserver = new ResizeObserver(() => {
      if (this.resizeTimeout) {
        window.clearTimeout(this.resizeTimeout);
      }

      this.resizeTimeout = window.setTimeout(() => {
        const width = container.offsetWidth;
        const height = container.offsetHeight;

        // 🔍 Só recalcula se a largura realmente mudou
        if (this.lastContainerWidth === width) {
          return;
        }

        this.lastContainerWidth = width;

        console.log("📐 Resize real detectado:", { width, height });

        this.forceResize(true); // 👈 sinaliza resize de container
      }, 200); // ⏱️ delay maior para DOM estabilizar
    });

    this.resizeObserver.observe(container);
  }

  // 🔁 Resize manual - MÉTODO PRINCIPAL CORRIGIDO
  private async forceResize(fromContainerResize: boolean = false) {
    if (this.isResizing || !this.report) return;

    this.isResizing = true;

    try {
      console.log("🔄 ForceResize", {
        fromContainerResize,
      });

      // 1️⃣ Força resize do iframe
      if (typeof (this.report as any).resize === "function") {
        (this.report as any).resize();
      }

      // ⚠️ IMPORTANTE:
      // Em resize de container, o Power BI precisa de MAIS TEMPO
      if (fromContainerResize) {
        await new Promise((r) => setTimeout(r, 250));
      }

      // 2️⃣ Recria o navContentPane (única forma confiável)
      await this.report.updateSettings({ navContentPaneEnabled: false });

      await new Promise((r) => setTimeout(r, 120));

      await this.report.updateSettings({
        navContentPaneEnabled: true,
        customLayout: {
          displayOption: pbi.models.DisplayOption.FitToPage,
        },
      });

      console.log("✅ Nav pane recalculado");
    } catch (err) {
      console.error("❌ Erro no forceResize:", err);
    } finally {
      setTimeout(() => {
        this.isResizing = false;
      }, 400);
    }
  }

  // 🔁 Resize da janela
  private handleWindowResize = () => {
    console.log("🪟 Janela redimensionada");
    this.forceResize();
  };

  // 🧹 Cleanup (desmontar componente)
  public destroy(container: HTMLElement) {
    console.log("🧹 Limpando Power BI Service");

    if (this.resizeTimeout) {
      window.clearTimeout(this.resizeTimeout);
    }

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }

    window.removeEventListener("resize", this.handleWindowResize);

    this.powerbi.reset(container);

    this.isResizing = false; // Reset da flag
  }

  // 🖥️ Fullscreen com resize forçado
  public async toggleFullscreen(isFullscreen: boolean) {
    if (!this.report) return;

    console.log("🖥️ Toggle fullscreen:", isFullscreen ? "Sair" : "Entrar");

    try {
      if (isFullscreen) {
        await (this.report as any).exitFullscreen();
      } else {
        await (this.report as any).fullscreen();
      }

      // Aguardar transição de fullscreen e forçar resize
      setTimeout(() => {
        this.isResizing = false; // Reset para permitir resize
        this.forceResize(false);
      }, 400);
    } catch (error) {
      console.error("❌ Erro no fullscreen:", error);
    }
  }

  // 🔄 Método auxiliar para forçar refresh completo (uso opcional)
  public async refreshLayout() {
    console.log("🔄 Refresh completo do layout");
    this.isResizing = false; // Reset da flag
    await this.forceResize();
  }

  public clearReport(containerId: string = "reportContainer") {
    const container = document.getElementById(containerId);

    if (!container) return;

    console.log("🧹 Limpando reportContainer");

    // Remove embed do Power BI
    this.powerbi.reset(container);

    // Limpa DOM (remove iframe residual)
    container.innerHTML = "";
  }
}
