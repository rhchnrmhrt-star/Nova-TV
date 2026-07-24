import { parseM3u } from "./m3u.js";

export async function loadSourceCatalogue(configUrl = "/config/public-iptv-sources.json") {
  const response = await fetch(configUrl, { cache: "no-store" });
  if (!response.ok) throw new Error(`تعذر تحميل مصادر القنوات (${response.status})`);

  const config = await response.json();
  return (config.sources || [])
    .filter((source) => source.enabled)
    .sort((a, b) => (a.priority || 999) - (b.priority || 999));
}

export async function loadChannelsFromSource(source, options = {}) {
  const { timeoutMs = 12000, fetchImpl = fetch } = options;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchImpl(source.url, {
      signal: controller.signal,
      cache: "no-store",
      headers: { Accept: "application/x-mpegURL,text/plain,*/*" },
    });

    if (!response.ok) {
      throw new Error(`فشل المصدر ${source.nameAr || source.id}: ${response.status}`);
    }

    return parseM3u(await response.text(), source);
  } finally {
    clearTimeout(timeout);
  }
}

export async function loadAllEnabledChannels(sources, options = {}) {
  const results = await Promise.allSettled(
    sources.map((source) => loadChannelsFromSource(source, options)),
  );

  const channels = [];
  const failures = [];

  results.forEach((result, index) => {
    if (result.status === "fulfilled") channels.push(...result.value);
    else failures.push({ source: sources[index], error: String(result.reason?.message || result.reason) });
  });

  return { channels, failures };
}
