import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useParams, Link } from "react-router-dom";
import { renderTemplate } from "../utils/render";
import { exportPdf } from "../utils/pdf";

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
    if (templateId === "invoice") {
      const qty = Number(v.qty || 0);
      const price = Number(v.price || 0);
      v.total = (qty * price).toFixed(2);
    }
    return v;
  }, [state, templateId]);

  if (!tpl) return <div>Chargement…</div>;

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

  return (
    <div className="grid lg:grid-cols-[1fr,360px] gap-8 items-start">
      <div className="rounded-2xl bg-white/5 border border-white/10 p-4 overflow-auto">
        <div id="print-area" ref={ref} style={style} className="flex justify-center">
          <div dangerouslySetInnerHTML={{ __html: html }} />
        </div>
      </div>

      <div className="sticky top-24 space-y-4">
        <Link
          to={`/app/fill/${tpl.id}`}
          className="block text-center px-4 py-3 rounded-lg border border-slate-300 text-slate-700 font-medium hover:border-slate-400 hover:bg-slate-50 transition-colors duration-200 shadow-sm"
        >
          Modifier
        </Link>
        <button
          onClick={() => ref.current && exportPdf(ref.current, `${tpl.name}.pdf`)}
          className="w-full px-4 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 shadow-sm hover:shadow-md transition-all duration-200"
        >
          Télécharger PDF
        </button>
      </div>
    </div>
  );
}
