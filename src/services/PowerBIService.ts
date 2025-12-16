import { WebPartContext } from "@microsoft/sp-webpart-base";
import * as pbi from "powerbi-client";

export class PowerBIService {
  private powerbi: pbi.service.Service;
  public report?: pbi.Report;

  private resizeObserver?: ResizeObserver;
  private resizeTimeout?: number;
  private isResizing: boolean = false;
  private lastContainerWidth?: number;

  // 🔒 Controle de estado do relatório atual
  private currentEmbedUrl?: string;
  private currentReportId?: string;
  private isReportLoaded: boolean = false;

  private domObserver?: MutationObserver;
  private isContainerMounted: boolean = false;

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
    reportId: string,
    paginaRelatorioBI?: string,
    filtroKpiSelecionado?: string
  ): Promise<void> {
    const container = document.getElementById("reportContainer");
    if (!container) {
      console.error("❌ reportContainer não encontrado");
      return;
    }

    this.isContainerMounted = true;
    this.observeContainerLifecycle("reportContainer");

    // ===============================
    // 🔁 RELATÓRIO JÁ CARREGADO
    // ===============================
    if (
      this.report &&
      this.isReportLoaded &&
      this.currentEmbedUrl === embedUrl &&
      this.currentReportId === reportId
    ) {
      console.log("🔁 Relatório já carregado — atualizando página e filtro");

      if (paginaRelatorioBI) {
        await this.navigateToPageByIndex(paginaRelatorioBI);
        await new Promise((r) => setTimeout(r, 300));
      }

      if (filtroKpiSelecionado) {
        await this.applyKpiSlicerFilter(filtroKpiSelecionado);
      }

      this.forceResize();
      return;
    }

    // ===============================
    // 🆕 NOVO RELATÓRIO
    // ===============================
    console.log("🆕 Carregando novo relatório Power BI");

    const tokenProvider =
      await context.aadTokenProviderFactory.getTokenProvider();

    const token = await tokenProvider.getToken(
      "https://analysis.windows.net/powerbi/api"
    );

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

    this.report = this.powerbi.embed(container, config) as pbi.Report;

    this.currentEmbedUrl = embedUrl;
    this.currentReportId = reportId;
    this.isReportLoaded = false;

    this.report.on("loaded", async () => {
      console.log("✅ Relatório carregado");

      this.isReportLoaded = true;

      if (paginaRelatorioBI) {
        await this.navigateToNavbarPageByIndex(paginaRelatorioBI);
        await new Promise((r) => setTimeout(r, 300));
      }

      if (filtroKpiSelecionado) {
        await this.applyKpiSlicerFilter(filtroKpiSelecionado);
      }

      setTimeout(() => this.forceResize(), 150);
    });

    this.observeResize(container);
    window.addEventListener("resize", this.handleWindowResize);
  }

  // ▶ Navega para página específica pelo nome
  private async navigateToPage(pageName: string) {
    if (!this.report) return;

    const pages = await this.report.getPages();
    const targetPage = pages.find((p) => p.name === pageName);

    if (targetPage) {
      await targetPage.setActive();
      console.log("📄 Página ativada:", pageName);
    } else {
      console.warn("⚠️ Página não encontrada:", pageName);
    }
  }

  private async navigateToPageByIndex(pageIndex: string) {
    if (!this.report) return;

    const pages = await this.report.getPages();
    const index = Number(pageIndex);

    console.warn("Quantidade de paginas do relatorio", pages.length);
    if (isNaN(index) || index < 1 || index > pages.length) {
      console.warn("⚠️ Índice de página inválido:", pageIndex);
      return;
    }

    const page = pages[index - 1];
    await page.setActive();

    console.log("📄 Página ativada:", page.displayName);
  }

  private async navigateToNavbarPageByIndex(navbarIndex: string) {
    if (!this.report) return;

    const pages = await this.report.getPages();
    const index = Number(navbarIndex);

    // 📌 Apenas páginas visíveis no navbar
    // console.warn("pages", pages);

    const visiblePages = pages.filter((p: any) => !p.visibility);

    console.warn(
      "📑 Total de páginas visíveis no navbar:",
      visiblePages.length
    );

    if (isNaN(index) || index < 1 || index > visiblePages.length) {
      console.warn("⚠️ Índice de navbar inválido:", navbarIndex);
      return;
    }

    const page = visiblePages[index - 1];
    await page.setActive();

    console.log(
      "📄 Página ativada via navbar:",
      page.displayName,
      `(index navbar: ${index})`
    );
  }

  private async logActivePageSlicers() {
    if (!this.report) return;

    const pages = await this.report.getPages();
    const activePage = pages.find((p) => p.isActive);

    if (!activePage) return;

    const visuals = await activePage.getVisuals();
    const slicers = visuals.filter((v) => v.type === "slicer");

    console.group(`🎛️ Slicers da página ativa: ${activePage.displayName}`);

    for (const slicer of slicers) {
      console.group(`Slicer: ${slicer.name}`);
      console.log("title:", slicer.title);

      try {
        const state = await slicer.getSlicerState();
        console.log("Slicer state:", state);
      } catch (err) {
        console.warn("⚠️ Não foi possível ler slicer:", err);
      }

      console.groupEnd();
    }

    console.groupEnd();
  }

  private async applyKpiSlicerFilter(filtroKpiSelecionado: string) {
    if (!this.report) return;

    const pages = await this.report.getPages();
    const activePage = pages.find((p) => p.isActive);

    if (!activePage) return;

    const visuals = await activePage.getVisuals();
    const slicers = visuals.filter((v) => v.type === "slicer");

    for (const slicer of slicers) {
      try {
        const state = await slicer.getSlicerState();

        const hasKpiTarget = state.targets?.some(
          (t: any) => t.table === "KPI" && t.column === "KPI Selecionado"
        );

        if (!hasKpiTarget) continue;

        console.log("🎯 Slicer KPI encontrado:", slicer.name);

        await slicer.setSlicerState({
          targets: [{ table: "KPI", column: "KPI Selecionado" }],
          filters: [
            {
              $schema: "http://powerbi.com/product/schema#basic",
              target: { table: "KPI", column: "KPI Selecionado" },
              operator: "In",
              values: [filtroKpiSelecionado],
              filterType: pbi.models.FilterType.Basic,
            },
          ],
        });

        console.log("✅ Filtro KPI aplicado:", filtroKpiSelecionado);
        return;
      } catch (err) {
        console.warn("⚠️ Erro ao aplicar filtro no slicer:", err);
      }
    }

    console.warn("⚠️ Nenhum slicer KPI encontrado");
  }

  // ================== RESIZE / LAYOUT ==================

  private observeResize(container: HTMLElement) {
    if (this.resizeObserver) this.resizeObserver.disconnect();

    this.resizeObserver = new ResizeObserver(() => {
      if (this.resizeTimeout) window.clearTimeout(this.resizeTimeout);

      this.resizeTimeout = window.setTimeout(() => {
        const width = container.offsetWidth;
        if (this.lastContainerWidth === width) return;

        this.lastContainerWidth = width;
        this.forceResize(true);
      }, 200);
    });

    this.resizeObserver.observe(container);
  }

  private async forceResize(fromContainerResize: boolean = false) {
    if (this.isResizing || !this.report) return;

    this.isResizing = true;

    try {
      if (typeof (this.report as any).resize === "function") {
        (this.report as any).resize();
      }

      if (fromContainerResize) {
        await new Promise((r) => setTimeout(r, 250));
      }

      await this.report.updateSettings({ navContentPaneEnabled: false });
      await new Promise((r) => setTimeout(r, 120));

      await this.report.updateSettings({
        navContentPaneEnabled: true,
        customLayout: {
          displayOption: pbi.models.DisplayOption.FitToPage,
        },
      });
    } finally {
      setTimeout(() => (this.isResizing = false), 400);
    }
  }

  private handleWindowResize = () => {
    this.forceResize();
  };

  public destroy(container: HTMLElement) {
    if (this.resizeTimeout) window.clearTimeout(this.resizeTimeout);
    if (this.resizeObserver) this.resizeObserver.disconnect();

    window.removeEventListener("resize", this.handleWindowResize);
    this.powerbi.reset(container);
    this.destroyInternal();

    this.isResizing = false;
    this.isReportLoaded = false;
    this.currentEmbedUrl = undefined;
    this.currentReportId = undefined;
  }

  public async toggleFullscreen(isFullscreen: boolean) {
    if (!this.report) return;

    if (isFullscreen) {
      await (this.report as any).exitFullscreen();
    } else {
      await (this.report as any).fullscreen();
    }

    setTimeout(() => {
      this.isResizing = false;
      this.forceResize();
    }, 400);
  }

  public async refreshLayout() {
    this.isResizing = false;
    await this.forceResize();
  }

  public clearReport(containerId: string = "reportContainer") {
    const container = document.getElementById(containerId);
    if (!container) return;

    this.powerbi.reset(container);
    container.innerHTML = "";

    this.isReportLoaded = false;
    this.currentEmbedUrl = undefined;
    this.currentReportId = undefined;
  }

  private observeContainerLifecycle(containerId: string = "reportContainer") {
    if (this.domObserver) {
      this.domObserver.disconnect();
    }

    this.domObserver = new MutationObserver(() => {
      const container = document.getElementById(containerId);

      // ❌ Container foi removido
      if (!container && this.isContainerMounted) {
        console.warn(
          "🧨 reportContainer removido do DOM — destruindo relatório"
        );

        this.isContainerMounted = false;
        this.destroyInternal();
      }

      // ✅ Container voltou
      if (container && !this.isContainerMounted) {
        console.log("🔄 reportContainer remontado no DOM");
        this.isContainerMounted = true;
      }
    });

    this.domObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  private destroyInternal() {
    if (this.resizeTimeout) window.clearTimeout(this.resizeTimeout);
    if (this.resizeObserver) this.resizeObserver.disconnect();

    window.removeEventListener("resize", this.handleWindowResize);

    if (this.report) {
      try {
        this.report.off("loaded");
      } catch {}
    }

    this.report = undefined;
    this.isResizing = false;
    this.isReportLoaded = false;
    this.currentEmbedUrl = undefined;
    this.currentReportId = undefined;
  }
}
