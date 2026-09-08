import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs";

const darkModeQuery = window.matchMedia("(prefers-color-scheme: dark)");

function getThemeVariables() {
  return darkModeQuery.matches
    ? {
        background: "#171b22",
        primaryColor: "#202733",
        primaryTextColor: "#f0f3f7",
        primaryBorderColor: "#344050",
        lineColor: "#aeb7c3",
        secondaryColor: "#202733",
        tertiaryColor: "#171b22",
        textColor: "#f0f3f7"
      }
    : {
        background: "#ffffff",
        primaryColor: "#eef2f6",
        primaryTextColor: "#202731",
        primaryBorderColor: "#c8d0db",
        lineColor: "#596575",
        secondaryColor: "#eef2f6",
        tertiaryColor: "#ffffff",
        textColor: "#202731"
      };
}

async function renderMermaid() {
  const elements = document.querySelectorAll(".mermaid");

  // Save Mermaid source the first time.
  for (const element of elements) {
    if (!element.dataset.mermaidSource) {
      element.dataset.mermaidSource = element.textContent;
    }
  }

  // Replace rendered elements with fresh elements containing
  // the original Mermaid source.
  for (const element of elements) {
    const replacement = document.createElement("div");

    replacement.className = "mermaid";
    replacement.dataset.mermaidSource = element.dataset.mermaidSource;
    replacement.textContent = element.dataset.mermaidSource;

    element.replaceWith(replacement);
  }

  mermaid.initialize({
    startOnLoad: false,
    theme: "base",
    themeVariables: getThemeVariables()
  });

  await mermaid.run({
    nodes: document.querySelectorAll(".mermaid")
  });
}

renderMermaid();

darkModeQuery.addEventListener("change", renderMermaid);