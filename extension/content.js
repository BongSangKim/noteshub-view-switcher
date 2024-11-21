class ViewSwitcher {
  constructor() {
    this.STORAGE_KEY = "noteshubViewPreference";
    this.GRID_CLASS = "noteshub-grid-layout";
    this.TOGGLE_CLASS = "noteshub-view-toggle";
    this.shortcut = navigator.platform.toUpperCase().includes("MAC")
      ? "⌥+V"
      : "Alt+V";

    this.icons = {
      list: this.createSVGPath("M3 4h18v2H3V4zm0 7h18v2H3v-2zm0 7h18v2H3v-2z"),
      grid: this.createSVGPath(
        "M3 3h7v7H3V3zm11 0h7v7h-7V3zm-11 11h7v7H3v-7zm11 0h7v7h-7v-7z"
      ),
    };

    this.init();
  }

  createSVGPath(d) {
    return `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="${d}"/>
            </svg>`;
  }

  async init() {
    try {
      await this.restoreView();
      this.createToggleButton();
      this.observeDOM();
    } catch (error) {
      console.warn("ViewSwitcher initialization failed:", error);
    }
  }

  createToggleButton() {
    if (document.querySelector(`.${this.TOGGLE_CLASS}`)) return;

    const button = document.createElement("button");
    button.className = this.TOGGLE_CLASS;
    button.innerHTML = this.icons.list;
    button.title = chrome.i18n.getMessage("toggleButtonTitle", [this.shortcut]);

    button.addEventListener("click", () => this.toggleView());
    document.addEventListener("keydown", this.handleShortcut.bind(this));
    document.body.appendChild(button);
  }

  handleShortcut(event) {
    if (event.altKey && event.key.toLowerCase() === "v") {
      event.preventDefault();
      this.toggleView();
    }
  }

  async toggleView() {
    const fileList = document.querySelector(".MuiList-root");
    const button = document.querySelector(`.${this.TOGGLE_CLASS}`);
    if (!fileList || !button) return;

    const isGrid = fileList.classList.toggle(this.GRID_CLASS);
    button.innerHTML = this.icons[isGrid ? "list" : "grid"];
    await this.saveView(isGrid);
  }

  async saveView(isGrid) {
    try {
      await chrome.storage.sync.set({
        [this.STORAGE_KEY]: isGrid ? "grid" : "list",
      });
    } catch (error) {
      console.warn("Failed to save view preference:", error);
    }
  }

  async restoreView() {
    try {
      const { [this.STORAGE_KEY]: savedView = "list" } =
        await chrome.storage.sync.get(this.STORAGE_KEY);
      const fileList = document.querySelector(".MuiList-root");
      const button = document.querySelector(`.${this.TOGGLE_CLASS}`);
      if (!fileList || !button) return;

      const shouldBeGrid = savedView === "grid";
      const isCurrentlyGrid = fileList.classList.contains(this.GRID_CLASS);

      if (shouldBeGrid !== isCurrentlyGrid) {
        fileList.classList.toggle(this.GRID_CLASS, shouldBeGrid);
        button.innerHTML = this.icons[shouldBeGrid ? "list" : "grid"];
      }
    } catch (error) {
      console.warn("Failed to restore view preference:", error);
    }
  }

  observeDOM() {
    const observer = new MutationObserver((mutations) => {
      const hasNewList = mutations.some((mutation) =>
        Array.from(mutation.addedNodes).some((node) =>
          node.classList?.contains("MuiList-root")
        )
      );

      if (hasNewList) this.restoreView();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }
}

new ViewSwitcher();
