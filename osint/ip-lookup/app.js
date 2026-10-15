(() => {
  const form = document.getElementById('lookup-form');
  const input = document.getElementById('ip-input');
  const message = document.getElementById('lookup-message');
  const results = document.getElementById('lookup-results');
  const heading = document.getElementById('results-heading');

  function validIPv4(value) {
    const parts = value.split('.');
    return parts.length === 4 && parts.every(part => /^\d{1,3}$/.test(part) && Number(part) <= 255);
  }

  function render(ip) {
    results.replaceChildren();
    const categories = [...new Set(window.GINGER_OSINT_PROVIDERS.map(p => p.category))];
    categories.forEach(category => {
      const section = document.createElement('section');
      section.className = 'provider-section';
      const h3 = document.createElement('h3');
      h3.textContent = category;
      section.appendChild(h3);
      const grid = document.createElement('div');
      grid.className = 'provider-grid';
      window.GINGER_OSINT_PROVIDERS.filter(p => p.category === category).forEach(p => {
        const link = document.createElement('a');
        link.className = 'provider-link';
        link.href = p.url(ip);
        link.rel = 'noopener noreferrer';
        const name = document.createElement('strong');
        name.textContent = `${p.name} ↗`;
        const description = document.createElement('span');
        description.textContent = p.description;
        link.append(name, description);
        grid.appendChild(link);
      });
      section.appendChild(grid);
      results.appendChild(section);
    });
    heading.textContent = `OSINT links for ${ip}`;
    results.hidden = false;
  }

  function lookup(value, updateUrl = true) {
    const ip = value.trim();
    if (!validIPv4(ip)) {
      message.textContent = 'Enter a valid IPv4 address (for example, 8.8.8.8).';
      heading.textContent = '';
      results.hidden = true;
      return;
    }
    message.textContent = 'Links open third-party services; login or rate limits may apply.';
    render(ip);
    if (updateUrl) {
      const url = new URL(window.location.href);
      url.searchParams.set('ip', ip);
      history.replaceState(null, '', url);
    }
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    lookup(input.value);
  });
  const initialIp = new URLSearchParams(window.location.search).get('ip');
  if (initialIp) {
    input.value = initialIp;
    lookup(initialIp, false);
  }
})();
