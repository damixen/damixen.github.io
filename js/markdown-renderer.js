
async function renderMarkdown(markdownPath, elementId) {
  const container = document.getElementById(elementId);

  try {
    const response = await fetch(markdownPath);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const markdown = await response.text();

    container.innerHTML = DOMPurify.sanitize(
      marked.parse(markdown)
    );
  } catch (error) {
    console.error("Markdown loading failed:", error);
    container.textContent = "Unable to load article.";
  }
}
