import { useEffect, useState } from "react";

type ServiceConfig = {
  name: string;
  url: string;
};

type ServiceState = ServiceConfig & {
  loading: boolean;
  error?: string;
  data?: any;
};

const SERVICES: ServiceConfig[] = [
  { name: "Workout Ingestor API", url: "http://localhost:8004/version" },
  // Note: Other APIs don't have /version endpoints yet
  // { name: "Mapper API", url: "http://localhost:8001/version" },
  // { name: "Strava Sync API", url: "http://localhost:8000/version" },
  // { name: "Garmin Sync API", url: "http://localhost:8002/version" },
];

export function DevSystemStatus() {
  // Hide entirely in production
  if (import.meta.env.PROD) return null;
  if (SERVICES.length === 0) return null;

  const [services, setServices] = useState<ServiceState[]>(
    SERVICES.map((s) => ({ ...s, loading: true }))
  );

  useEffect(() => {
    let isCancelled = false;

    async function load() {
      const results: ServiceState[] = [];

      for (const svc of SERVICES) {
        const state: ServiceState = { ...svc, loading: false };

        try {
          const res = await fetch(svc.url, {
            headers: { Accept: "application/json" }
          });

          if (!res.ok) {
            state.error = `HTTP ${res.status}`;
          } else {
            const data = await res.json().catch(() => null);
            state.data = data;
          }
        } catch (err: any) {
          state.error = err?.message ?? "Network error";
        }

        results.push(state);
      }

      if (!isCancelled) {
        setServices(results);
      }
    }

    load();

    return () => {
      isCancelled = true;
    };
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        left: 8,
        bottom: 8,
        maxWidth: "50vw",
        padding: 8,
        borderRadius: 8,
        background: "rgba(0,0,0,0.8)",
        color: "#fff",
        fontSize: 11,
        fontFamily:
          'system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
        zIndex: 9999
      }}
    >
      <div style={{ marginBottom: 4, fontWeight: 600 }}>
        Dev System Status
      </div>
      {services.map((svc) => (
        <div
          key={svc.name}
          style={{
            display: "flex",
            flexDirection: "column",
            marginBottom: 4,
            paddingBottom: 4,
            borderBottom: "1px solid rgba(255,255,255,0.15)"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>{svc.name}</span>
            <span>
              {svc.loading
                ? "Loading…"
                : svc.error
                ? "❌"
                : "✅"}
            </span>
          </div>
          {!svc.loading && svc.error && (
            <div style={{ color: "#fbb" }}>{svc.error}</div>
          )}
          {!svc.loading && !svc.error && svc.data && (
            <div
              style={{
                marginTop: 2,
                maxHeight: 80,
                overflow: "auto",
                fontFamily: "Menlo, monospace",
                fontSize: 10
              }}
            >
              <pre
                style={{
                  margin: 0,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word"
                }}
              >
                {JSON.stringify(svc.data, null, 2)}
              </pre>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

