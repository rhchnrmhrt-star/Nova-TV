const ATTRIBUTE_PATTERN = /([\w-]+)="([^"]*)"/g;

export function parseM3u(text, source = {}) {
  if (typeof text !== "string" || !text.trim()) return [];

  const lines = text.split(/\r?\n/).map((line) => line.trim());
  const channels = [];
  let metadata = null;

  for (const line of lines) {
    if (!line) continue;

    if (line.startsWith("#EXTINF:")) {
      const commaIndex = line.indexOf(",");
      const header = commaIndex >= 0 ? line.slice(0, commaIndex) : line;
      const name = commaIndex >= 0 ? line.slice(commaIndex + 1).trim() : "قناة غير معروفة";
      const attributes = {};

      for (const match of header.matchAll(ATTRIBUTE_PATTERN)) {
        attributes[match[1]] = match[2];
      }

      metadata = {
        id: attributes["tvg-id"] || "",
        name: attributes["tvg-name"] || name,
        displayName: name,
        logo: attributes["tvg-logo"] || "",
        group: attributes["group-title"] || "أخرى",
        language: attributes["tvg-language"] || "",
        country: attributes["tvg-country"] || source.country || "",
      };
      continue;
    }

    if (!line.startsWith("#") && metadata) {
      channels.push({
        ...metadata,
        streamUrl: line,
        sourceId: source.id || "external",
        sourceName: source.nameAr || source.nameEn || "مصدر خارجي",
        favorite: false,
      });
      metadata = null;
    }
  }

  return deduplicateChannels(channels);
}

export function deduplicateChannels(channels) {
  const seen = new Set();
  return channels.filter((channel) => {
    const key = `${channel.id || channel.displayName}|${channel.streamUrl}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function searchChannels(channels, query) {
  const normalized = String(query || "").trim().toLocaleLowerCase("ar");
  if (!normalized) return channels;

  return channels.filter((channel) =>
    [channel.displayName, channel.name, channel.group, channel.country]
      .filter(Boolean)
      .some((value) => String(value).toLocaleLowerCase("ar").includes(normalized)),
  );
}

export function groupChannels(channels) {
  return channels.reduce((groups, channel) => {
    const group = channel.group || "أخرى";
    (groups[group] ||= []).push(channel);
    return groups;
  }, {});
}
