// Add or remove providers here; no HTML changes required.
window.GINGER_OSINT_PROVIDERS = [
  { name: 'VirusTotal', category: 'Reputation', description: 'IP detections and community context', url: ip => `https://www.virustotal.com/gui/ip-address/${encodeURIComponent(ip)}` },
  { name: 'AbuseIPDB', category: 'Reputation', description: 'Community abuse reports', url: ip => `https://www.abuseipdb.com/check/${encodeURIComponent(ip)}` },
  { name: 'GreyNoise', category: 'Reputation', description: 'Internet scanning context', url: ip => `https://viz.greynoise.io/ip/${encodeURIComponent(ip)}` },
  { name: 'Shodan', category: 'Exposure', description: 'Observed internet-facing services', url: ip => `https://www.shodan.io/host/${encodeURIComponent(ip)}` },
  {
    name: 'Censys',
    category: 'Exposure',
    description: 'Internet host intelligence',
    supports: ['ip'],
    url: value =>
      `https://platform.censys.io/legacy-redirect?q=${encodeURIComponent(value)}`
  },
  { name: 'urlscan.io', category: 'Web activity', description: 'Search for scans referencing this IP', url: ip => `https://urlscan.io/search/#ip:${encodeURIComponent(ip)}` }
];
