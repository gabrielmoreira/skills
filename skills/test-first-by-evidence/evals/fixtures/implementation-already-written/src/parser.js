const LINE = /^\s*([A-Za-z_][\w.-]*)\s*=\s*(.*?)\s*$/;

export function parseConfig(text) {
  const out = {};
  let section = "";
  for (const raw of text.split("\n")) {
    const line = raw.replace(/[;#].*$/, "").trim();
    if (!line) continue;
    if (line.startsWith("[") && line.endsWith("]")) {
      section = line.slice(1, -1).trim();
      continue;
    }
    const m = LINE.exec(line);
    if (!m) continue;
    const key = section ? `${section}.${m[1]}` : m[1];
    out[key] = coerce(m[2]);
  }
  return out;
}

function coerce(value) {
  if (value === "true" || value === "false") return value === "true";
  if (/^-?\d+$/.test(value)) return Number(value);
  if (value.startsWith('"') && value.endsWith('"')) return value.slice(1, -1);
  return value;
}
