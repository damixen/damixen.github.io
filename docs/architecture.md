# GingerPot Architecture

## Purpose

GingerPot is a security telemetry platform built around honeypot data.

```
              Public Internet
                    |
                    v
              T-Pot Honeypot
                    |
                    v
           Elasticsearch / Kibana
                    |
        +-----------+------------+
        |                        |
        v                        v
      ESKit              Telemetry Pipeline
 (operate infra)          (export/cache/API)
        |                        |
        +-----------+------------+
                    |
                    v
          GingerPot Dashboard
```

## Components

### Honeypot Environment
- [T-Pot based Lab](https://github.com/damixen/honeypot-elk-siem-lab)
- Elasticsearch
- Suricata
- Metricbeat

### Operations
- [ESKit CLI](https://github.com/damixen/eskit)
- Snapshot management
- Index inspection
- Restore testing

### Telemetry Pipeline
- [Exporter](https://github.com/damixen/live-honeypot-telemetry)
- DigitalOcean Function
- Upstash cache

### Frontend
- GitHub Pages
- Live dashboard
- Public telemetry visualization

