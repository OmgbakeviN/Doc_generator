import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useParams, Link } from "react-router-dom";
import { renderTemplate } from "../utils/render"; // <-- garde si tu veux continuer l'aperçu HTML
import { exportPdfProject } from "../utils/pdf";   // <-- nouvelle fonction jsPDF pure

export default function Preview() {
  const { templateId } = useParams();
  const { state } = useLocation();
  const [tpl, setTpl] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    fetch(`/templates/${templateId}.json`)
      .then((r) => r.json())
      .then(setTpl);
  }, [templateId]);

  const values = useMemo(() => {
    const v = { ...(state?.values || {}) };
    // si d'autres templates ont besoin de calculs, ajoute ici
    return v;
  }, [state, templateId]);

  if (!tpl) return <div>Chargement…</div>;

  // --- Aperçu (facultatif) : on peut garder un rendu HTML lisible à l'écran
  const html = renderTemplate(tpl.template, {
    ...values,
    accent: state?.options?.accent || tpl.defaults.accent
  });

  const style = {
    color: '#111',
    backgroundColor: '#fff',
    fontSize: `${state?.options?.fontSize || tpl.defaults.fontSize}pt`,
    lineHeight: state?.options?.lineHeight || tpl.defaults.lineHeight
  };

  // --- Données à passer à jsPDF (structure "project")
  const pdfData = {
    project_name: values.project_name,
    project_objectives: values.project_objectives || [], // tableau de strings
    total_budget_xaf: Number(values.total_budget_xaf),
    funding_requested_xaf: Number(values.funding_requested_xaf),
    // alias si tu utilises encore des dot-paths
    start_date: values.start_date || values["project_timeline.start_date"],
    end_date: values.end_date || values["project_timeline.end_date"],
    duration_months: Number(values.duration_months ?? values["project_timeline.duration_months"])
  };

  const pdfOptions = {
    accent: state?.options?.accent || tpl.defaults.accent
  };

  const handleDownload = () => {
    if (templateId === "project") {
      // Export spécifique “Fiche Projet (SI)” en pur jsPDF
      exportPdfProject(pdfData, pdfOptions, `${tpl.name}.pdf`);
    } else {
      // TODO: si tu ajoutes d’autres templates, crée d’autres fonctions d’export dédiées
      exportPdfProject(pdfData, pdfOptions, `${tpl.name}.pdf`);
    }
  };

  return (
    <div className="grid lg:grid-cols-[1fr,360px] gap-8 items-start">
      {/* Aperçu écran (HTML) */}
      <div className="rounded-2xl bg-white/5 border border-white/10 p-4 overflow-auto">
        <div id="print-area" ref={ref} style={style} className="flex justify-center">
          <div dangerouslySetInnerHTML={{ __html: html }} />
        </div>
      </div>

      {/* Actions */}
      <div className="sticky top-24 space-y-4">
        <Link
          to={`/app/fill/${tpl.id}`}
          className="block text-center px-4 py-3 rounded-lg border border-slate-300 text-slate-700 font-medium hover:border-slate-400 hover:bg-slate-50 transition-colors duration-200 shadow-sm"
        >
          Modifier
        </Link>
        <button
          onClick={handleDownload}
          className="w-full px-4 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 shadow-sm hover:shadow-md transition-all duration-200"
        >
          Télécharger PDF
        </button>
      </div>
    </div>
  );
}
