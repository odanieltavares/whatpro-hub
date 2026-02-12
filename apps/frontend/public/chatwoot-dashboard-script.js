// Chatwoot Dashboard Script - WhatPro Hub Internal Chat Embed
// Ajuste CHAT_URL para o domínio do Hub.
(function () {
  const CHAT_URL = "https://hub.example.com/chat?embed=1";
  const CHAT_ORIGIN = new URL(CHAT_URL).origin;
  const MENU_LABEL = "Chat Interno";
  const HUB_API_BASE = "https://hub.example.com/api/v1";
  const HUB_ACCOUNT_ID = 1;
  const HUB_TOKEN = "";

  const getTheme = () => {
    return document.documentElement.classList.contains("dark") ? "dark" : "light";
  };

  const findSidebar = () => {
    return (
      document.querySelector('[data-testid="sidebar"]') ||
      document.querySelector(".sidebar") ||
      document.querySelector("aside")
    );
  };

  const findContent = () => {
    return (
      document.querySelector('[data-testid="conversation-panel"]') ||
      document.querySelector("#app") ||
      document.body
    );
  };

  const createMenuItem = (sidebar, onClick) => {
    const item = document.createElement("button");
    item.type = "button";
    item.textContent = MENU_LABEL;
    item.style.display = "flex";
    item.style.alignItems = "center";
    item.style.gap = "8px";
    item.style.width = "100%";
    item.style.padding = "8px 12px";
    item.style.borderRadius = "8px";
    item.style.border = "none";
    item.style.background = "transparent";
    item.style.cursor = "pointer";
    item.onmouseenter = () => (item.style.background = "rgba(0,0,0,0.06)");
    item.onmouseleave = () => (item.style.background = "transparent");
    item.onclick = onClick;
    const badge = document.createElement("span");
    badge.style.marginLeft = "auto";
    badge.style.background = "#0f6cf4";
    badge.style.color = "#fff";
    badge.style.borderRadius = "999px";
    badge.style.padding = "2px 6px";
    badge.style.fontSize = "10px";
    badge.style.display = "none";
    item.appendChild(badge);
    sidebar.appendChild(item);
    return { item, badge };
  };

  const mountIframe = (container) => {
    const iframe = document.createElement("iframe");
    iframe.src = `${CHAT_URL}&theme=${getTheme()}`;
    iframe.style.width = "100%";
    iframe.style.height = "100%";
    iframe.style.border = "0";
    iframe.style.background = "transparent";
    iframe.setAttribute("allow", "clipboard-write; fullscreen");
    container.innerHTML = "";
    container.appendChild(iframe);

    const postInit = () => {
      iframe.contentWindow?.postMessage(
        {
          type: "whatpro:embed:init",
          theme: getTheme(),
        },
        CHAT_ORIGIN
      );
    };

    iframe.addEventListener("load", postInit);
  };

  const pollMentions = (badge) => {
    if (!HUB_TOKEN) return;
    fetch(`${HUB_API_BASE}/accounts/${HUB_ACCOUNT_ID}/chat/mentions?unread=true`, {
      headers: { Authorization: `Bearer ${HUB_TOKEN}` },
    })
      .then((res) => res.json())
      .then((data) => {
        const count = data?.count || 0;
        if (count > 0) {
          badge.textContent = String(count);
          badge.style.display = "inline-flex";
        } else {
          badge.style.display = "none";
        }
      })
      .catch(() => {});
  };

  const init = () => {
    const sidebar = findSidebar();
    const content = findContent();
    if (!sidebar || !content) return;

    const { badge } = createMenuItem(sidebar, () => mountIframe(content));
    pollMentions(badge);
    setInterval(() => pollMentions(badge), 15000);
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
