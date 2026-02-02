import { WebPartContext } from "@microsoft/sp-webpart-base";
import * as pbi from "powerbi-client";

export class PowerBIService {
  private powerbi: pbi.service.Service;
  public report?: pbi.Report;

  private resizeObserver?: ResizeObserver;
  private resizeTimeout?: number;
  private isResizing: boolean = false;
  private lastContainerWidth?: number;

  // 🔒 Estado do relatório atual
  private currentEmbedUrl?: string;
  private currentReportId?: string;
  private isReportLoaded: boolean = false;

  private domObserver?: MutationObserver;
  private isContainerMounted: boolean = false;

  private containerId: string;

  constructor(containerId: string) {
    this.containerId = containerId;

    this.powerbi = new pbi.service.Service(
      pbi.factories.hpmFactory,
      pbi.factories.wpmpFactory,
      pbi.factories.routerFactory
    );
  }

  /* ===================== UTIL ===================== */

  private getContainer(): HTMLElement | null {
    return document.getElementById(this.containerId);
  }

  /* ===================== EMBED ===================== */

  public async embedReport(
    context: WebPartContext,
    embedUrl: string,
    reportId: string,
    paginaRelatorioBI?: string,
    filtroKpiSelecionado?: string
  ): Promise<void> {
    try {
      const container = this.getContainer();

      if (!container) {
        console.error(`❌ Container ${this.containerId} não encontrado`);
        return;
      }

      this.powerbi.reset(container);

      const tokenProvider =
        await context.aadTokenProviderFactory.getTokenProvider();

      const token = await tokenProvider.getToken(
        "https://analysis.windows.net/powerbi/api"
      );

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

      this.observeResize(container);
      this.observeContainerLifecycle();

      this.report.on("loaded", async () => {
        this.isReportLoaded = true;

        if (paginaRelatorioBI) {
          await this.navigateToNavbarPageByIndex(paginaRelatorioBI);
        }

        if (filtroKpiSelecionado) {
          await this.applyKpiSlicerFilter(filtroKpiSelecionado);
        }
      });
    } catch (error) {
      console.warn("embedReport", error);
    }
  }

  /* ===================== NAVEGAÇÃO ===================== */

  private async navigateToPage(pageName: string) {
    if (!this.report) return;

    const pages = await this.report.getPages();
    const page = pages.find((p) => p.name === pageName);

    if (page) {
      await page.setActive();
    }
  }

  private async navigateToPageByIndex(pageIndex: string) {
    if (!this.report) return;

    const pages = await this.report.getPages();
    const index = Number(pageIndex);

    if (isNaN(index) || index < 1 || index > pages.length) return;

    await pages[index - 1].setActive();
  }

  private async navigateToNavbarPageByIndex(navbarIndex: string) {
    if (!this.report) return;

    const pages = await this.report.getPages();
    const visiblePages = pages.filter((p: any) => !p.visibility);
    const index = Number(navbarIndex);

    if (isNaN(index) || index < 1 || index > visiblePages.length) return;

    await visiblePages[index - 1].setActive();
  }

  /* ===================== SLICER ===================== */

  private async applyKpiSlicerFilter(filtro: string) {
    if (!this.report) return;

    const pages = await this.report.getPages();
    const activePage = pages.find((p) => p.isActive);
    if (!activePage) return;

    const visuals = await activePage.getVisuals();
    const slicers = visuals.filter((v) => v.type === "slicer");

    for (const slicer of slicers) {
      try {
        const state = await slicer.getSlicerState();

        const hasTarget = state.targets?.some(
          (t: any) => t.table === "KPI" && t.column === "KPI Selecionado"
        );

        if (!hasTarget) continue;

        await slicer.setSlicerState({
          targets: [{ table: "KPI", column: "KPI Selecionado" }],
          filters: [
            {
              $schema: "http://powerbi.com/product/schema#basic",
              target: {
                table: "KPI",
                column: "KPI Selecionado",
              },
              operator: "In",
              values: [filtro],
              filterType: pbi.models.FilterType.Basic,
            },
          ],
        });

        return;
      } catch {}
    }
  }

  /* ===================== RESIZE ===================== */

  private observeResize(container: HTMLElement) {
    if (this.resizeObserver) this.resizeObserver.disconnect();

    this.resizeObserver = new ResizeObserver(() => {
      if (this.resizeTimeout) clearTimeout(this.resizeTimeout);

      this.resizeTimeout = window.setTimeout(() => {
        const width = container.offsetWidth;
        if (this.lastContainerWidth === width) return;

        this.lastContainerWidth = width;
        this.forceResize(true);
      }, 200);
    });

    this.resizeObserver.observe(container);
    window.addEventListener("resize", this.handleWindowResize);
  }

  private async forceResize(fromContainerResize = false) {
    if (!this.report || this.isResizing) return;

    this.isResizing = true;

    try {
      (this.report as any).resize?.();

      if (fromContainerResize) {
        await new Promise((r) => setTimeout(r, 250));
      }

      await this.report.updateSettings({
        navContentPaneEnabled: false,
      });

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

  /* ===================== FULLSCREEN ===================== */

  public async toggleFullscreen(isFullscreen: boolean) {
    if (!this.report) return;

    if (isFullscreen) {
      await (this.report as any).exitFullscreen();
    } else {
      await (this.report as any).fullscreen();
    }

    setTimeout(() => this.forceResize(), 400);
  }

  public async refreshLayout() {
    this.isResizing = false;
    await this.forceResize();
  }

  /* ===================== LIMPEZA ===================== */

  public clearReport() {
    const container = this.getContainer();
    if (!container) return;

    this.powerbi.reset(container);
    container.innerHTML = "";
    this.report = undefined;
    this.destroyInternal();
  }

  private observeContainerLifecycle() {
    if (this.domObserver) this.domObserver.disconnect();

    this.domObserver = new MutationObserver(() => {
      const container = this.getContainer();

      if (!container && this.isContainerMounted) {
        this.isContainerMounted = false;
        this.destroyInternal();
      }

      if (container && !this.isContainerMounted) {
        this.isContainerMounted = true;
      }
    });

    this.domObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  private destroyInternal() {
    if (this.resizeTimeout) clearTimeout(this.resizeTimeout);
    if (this.resizeObserver) this.resizeObserver.disconnect();

    window.removeEventListener("resize", this.handleWindowResize);

    try {
      this.report?.off("loaded");
    } catch {}

    this.report = undefined;
    this.isResizing = false;
    this.isReportLoaded = false;
    this.currentEmbedUrl = undefined;
    this.currentReportId = undefined;
  }
}
