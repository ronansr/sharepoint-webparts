(function () {
  const styleId = "dashboard-clean-layout-style";

  const existing = document.getElementById(styleId);
  if (existing) existing.remove();

  const style = document.createElement("style");
  style.id = styleId;

  style.innerHTML = `
    /* Ocultar elementos do SharePoint */
    #SuiteNavWrapper,
    #suiteBarDelta,
    #spSiteHeader,
    .ms-compositeHeader,
    #spLeftNav,
    #sp-appBar,
    #spLeftNavContainer,
    #spCommandBar,
    #CommentsWrapper,
    [class^="headerRow-"] {
      display: none !important;
    }

    /* Containers principais */
    body,
    #s4-workspace,
    #contentBox,
    #workbenchPageContent,
    #spPageCanvasContent {
      width: 100% !important;
      max-width: 100% !important;
      margin: 0 !important;
      padding: 0 !important;
    }

    /* Canvas containers */
    .CanvasZoneContainer,
    .CanvasZone,
    .CanvasSection,
    .CanvasZoneSectionContainer {
      width: 100% !important;
      max-width: 100% !important;
      margin: 0 !important;
      padding: 0 !important;
    }

    /* Webparts */
    .CanvasComponent,
    .CanvasComponent > div {
      width: 100% !important;
      max-width: 100% !important;
      margin: 0 !important;
      padding: 0 !important;
    }

    /* ControlZone */
    .ControlZone,
    .ControlZone--clean,
    .ControlZone--control {
      width: 100% !important;
      max-width: 100% !important;
      margin: 0 !important;
      padding: 0 !important;
    }

    .ControlZone--control > div,
    .ControlZone > div {
      width: 100% !important;
      max-width: 100% !important;
    }

    /* Sections */
    .CanvasSection,
    .CanvasSection-col,
    .CanvasSection-sm12,
    .CanvasSection-xl12,
    .CanvasSection--read {
      width: 100% !important;
      max-width: 100% !important;
      margin: 0 !important;
      padding: 0 !important;
    }

    #mainContent {
      margin-top: 0 !important;
    }
  `;

  document.head.appendChild(style);

  console.log("Layout FULL WIDTH aplicado (CanvasZoneSectionContainer incluído)");
})();
