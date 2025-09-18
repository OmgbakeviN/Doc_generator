import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

export async function exportPdf(el, filename = 'document.pdf') {
  const canvas = await html2canvas(el, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    // Ignore tout élément dont la couleur calculée contiendrait "oklch"
    ignoreElements: (node) => {
      try {
        const cs = window.getComputedStyle(node)
        return (
          (cs && (
            (cs.color && cs.color.includes('oklch')) ||
            (cs.backgroundColor && cs.backgroundColor.includes('oklch')) ||
            (cs.borderColor && cs.borderColor.includes('oklch')) ||
            (cs.boxShadow && cs.boxShadow.includes('oklch'))
          )) || false
        )
      } catch {
        return false
      }
    },
    // Dernière ceinture de sécurité: au clone, on neutralise des variables potentiellement exotiques
    onclone: (doc) => {
      const root = doc.getElementById('print-area')
      if (root) {
        root.style.setProperty('--tw-ring-color', 'rgba(0,0,0,0)')
        root.style.setProperty('--tw-shadow-color', '#000')
      }
    }
  })

  const img = canvas.toDataURL('image/png')
  const pdf = new jsPDF('p', 'mm', 'a4')
  const pdfW = pdf.internal.pageSize.getWidth()
  const pdfH = (canvas.height * pdfW) / canvas.width
  pdf.addImage(img, 'PNG', 0, 0, pdfW, pdfH)
  pdf.save(filename)
}
