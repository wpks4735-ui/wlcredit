(() => {
  "use strict";

  const isStandalone = () => window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
  const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isAndroid = () => /android/i.test(navigator.userAgent);
  const isInAppBrowser = () => /(FBAN|FBAV|Instagram|Line\/|MicroMessenger|WhatsApp|Telegram)/i.test(navigator.userAgent);

  let deferredPrompt = null;

  function makeUi() {
    if (document.getElementById("wlInstallBanner") || isStandalone()) return;

    const banner = document.createElement("div");
    banner.id = "wlInstallBanner";
    banner.className = "wl-install-banner hidden";
    banner.innerHTML = `
      <div class="wl-install-copy">
        <img src="${location.pathname.includes('/admin/') ? '../assets/icon-192.png' : 'assets/icon-192.png'}" alt="WL Credit">
        <div><strong>Install WL Credit</strong><span>Add WL Credit to your phone home screen.</span></div>
      </div>
      <div class="wl-install-actions">
        <button type="button" id="wlInstallNow" class="btn btn-primary">Install</button>
        <button type="button" id="wlInstallLater" class="btn btn-secondary">Later</button>
      </div>`;

    const guide = document.createElement("div");
    guide.id = "wlInstallGuide";
    guide.className = "wl-install-guide hidden";
    guide.innerHTML = `
      <div class="wl-install-guide-card">
        <button type="button" id="wlInstallGuideClose" class="wl-install-close" aria-label="Close">×</button>
        <h2>Add WL Credit to Home Screen</h2>
        <div id="wlInstallSteps"></div>
      </div>`;

    document.body.appendChild(banner);
    document.body.appendChild(guide);

    document.getElementById("wlInstallLater").addEventListener("click", () => {
      banner.classList.add("hidden");
      localStorage.setItem("wl_pwa_prompt_hidden_until", String(Date.now() + 24 * 60 * 60 * 1000));
    });
    document.getElementById("wlInstallGuideClose").addEventListener("click", () => guide.classList.add("hidden"));
    document.getElementById("wlInstallNow").addEventListener("click", handleInstall);
  }

  function showBanner() {
    if (isStandalone()) return;
    const hiddenUntil = Number(localStorage.getItem("wl_pwa_prompt_hidden_until") || 0);
    if (Date.now() < hiddenUntil) return;
    const banner = document.getElementById("wlInstallBanner");
    if (banner) banner.classList.remove("hidden");
  }

  function openGuide() {
    const guide = document.getElementById("wlInstallGuide");
    const steps = document.getElementById("wlInstallSteps");
    if (!guide || !steps) return;

    if (isInAppBrowser()) {
      steps.innerHTML = `<ol><li>Open the browser menu in this app.</li><li>Select <b>Open in Chrome</b> on Android or <b>Open in Safari</b> on iPhone.</li><li>Then choose <b>Install app</b> or <b>Add to Home Screen</b>.</li></ol>`;
    } else if (isIOS()) {
      steps.innerHTML = `<ol><li>Open this page in <b>Safari</b>.</li><li>Tap the <b>Share</b> button.</li><li>Choose <b>Add to Home Screen</b>.</li><li>Tap <b>Add</b>.</li></ol>`;
    } else if (isAndroid()) {
      steps.innerHTML = `<ol><li>Open this page in <b>Chrome</b>.</li><li>Tap the browser menu <b>⋮</b>.</li><li>Choose <b>Install app</b> or <b>Add to Home screen</b>.</li></ol>`;
    } else {
      steps.innerHTML = `<p>Open this page in Chrome, Edge, or Safari, then use the browser menu to install or add it to your home screen.</p>`;
    }
    guide.classList.remove("hidden");
  }

  async function handleInstall() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      try { await deferredPrompt.userChoice; } catch (_) {}
      deferredPrompt = null;
      document.getElementById("wlInstallBanner")?.classList.add("hidden");
      return;
    }
    openGuide();
  }

  window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault();
    deferredPrompt = event;
    showBanner();
  });

  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    document.getElementById("wlInstallBanner")?.classList.add("hidden");
    localStorage.setItem("wl_pwa_installed", "1");
  });

  document.addEventListener("DOMContentLoaded", () => {
    makeUi();
    if ("serviceWorker" in navigator && !location.pathname.startsWith('/admin')) {
      const swPath = 'sw.js?v=30.0.0';
      navigator.serviceWorker.register(swPath, { updateViaCache: 'none' }).catch(error => console.warn("Service worker registration failed:", error));
    }
    if (!isStandalone() && (isIOS() || isInAppBrowser())) setTimeout(showBanner, 1200);
  });
})();
