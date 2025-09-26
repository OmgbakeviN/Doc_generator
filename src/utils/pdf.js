import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

// applique un style inline temporaire à tout le sous-arbre
function patchTree(root, patch, filter = () => true) {
  const undo = []
  const stack = [root]
  while (stack.length) {
    const el = stack.pop()
    if (!(el instanceof HTMLElement)) continue
    if (!filter(el)) { stack.push(...el.children); continue }
    const prev = {}
    for (const [k, v] of Object.entries(patch)) {
      prev[k] = el.style.getPropertyValue(k)
      el.style.setProperty(k, v, 'important')
    }
    undo.push(() => {
      for (const k of Object.keys(patch)) {
        if (prev[k]) el.style.setProperty(k, prev[k])
        else el.style.removeProperty(k)
      }
    })
    stack.push(...el.children)
  }
  return () => { while (undo.length) undo.pop()() }
}

// remplace couleurs problématiques détectées dans les styles calculés
function stripOKLCH(root) {
  const undo = []
  const stack = [root]
  while (stack.length) {
    const el = stack.pop()
    if (!(el instanceof HTMLElement)) continue
    const cs = getComputedStyle(el)
    const patch = {}
    const bad = (s) => typeof s === 'string' && s.includes('oklch')
    if (bad(cs.color)) patch.color = '#111'
    if (bad(cs.backgroundColor)) patch.backgroundColor = '#fff'
    if (bad(cs.borderColor)) patch.borderColor = '#000'
    if (bad(cs.boxShadow)) patch.boxShadow = 'none'
    if (Object.keys(patch).length) {
      const prev = {}
      for (const [k,v] of Object.entries(patch)) {
        prev[k] = el.style.getPropertyValue(k)
        el.style.setProperty(k, v, 'important')
      }
      undo.push(() => {
        for (const k of Object.keys(patch)) {
          if (prev[k]) el.style.setProperty(k, prev[k])
          else el.style.removeProperty(k)
        }
      })
    }
    stack.push(...el.children)
  }
  return () => { while (undo.length) undo.pop()() }
}

// injecte des règles qui neutralisent les pseudo-éléments (souvent porteurs de couleurs modernes)
function injectSanitizeStyle(targetEl) {
  let id = targetEl.id
  if (!id) {
    id = 'print-area-temp-id'
    targetEl.id = id
  }
  const styleEl = document.createElement('style')
  styleEl.dataset.printSanitize = '1'
  styleEl.textContent = `
  #${CSS.escape(id)}::before, #${CSS.escape(id)}::after,
  #${CSS.escape(id)} *::before, #${CSS.escape(id)} *::after { content: none !important; }
  `
  targetEl.prepend(styleEl)
  return () => { styleEl.remove() }
}

export async function exportPdf(elOrSelector, filename = 'document.pdf') {
  const el = typeof elOrSelector === 'string'
    ? document.querySelector(elOrSelector)
    : elOrSelector
  if (!el) return

  // 1) sanitize dans le DOM réel (pas d'onclone fragile)
  const revertPseudo = injectSanitizeStyle(el)
  const revertColors = patchTree(el, {
    'color': '#111',
    'background-color': '#fff',
    '--tw-ring-color': 'rgba(0,0,0,0)',
    '--tw-shadow-color': '#000'
  })
  const revertBGImg = patchTree(el, { 'background-image': 'none' }, (node) => {
    const bg = getComputedStyle(node).backgroundImage
    return !!bg && /oklch|color\(/i.test(bg)
  })
  const revertStrip = stripOKLCH(el)

  try {
    const canvas = await html2canvas(el, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false
    })
    const img = canvas.toDataURL('image/png')
    const pdf = new jsPDF('p','mm','a4')
    const w = pdf.internal.pageSize.getWidth()
    const h = (canvas.height * w) / canvas.width
    pdf.addImage(img, 'PNG', 0, 0, w, h)
    pdf.save(filename)
  } finally {
    // 2) restore
    revertStrip()
    revertBGImg()
    revertColors()
    revertPseudo()
  }
}
