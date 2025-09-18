export function renderTemplate(html, data) {
    return html.replace(/{{\s*([\w.]+)\s*}}/g, (_, k) => {
      const v = data[k];
      return v === 0 ? 0 : (v ?? "");
    });
  }
  