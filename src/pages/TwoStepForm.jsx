import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

export default function TwoStepForm() {
  const { templateId } = useParams();
  const navigate = useNavigate();
  const [tpl, setTpl] = useState(null);
  const [step, setStep] = useState(1);
  const [values, setValues] = useState({});
  const [options, setOptions] = useState(null);
  const [loading, setLoading] = useState(true);

  // Charge le template JSON
  useEffect(() => {
    setLoading(true);
    fetch(`/templates/${templateId}.json`)
      .then((r) => r.json())
      .then((data) => {
        setTpl(data);
        setValues(Object.fromEntries(data.schema.map((f) => [f.key, ""])));
        setOptions({
          fontFamily: data.defaults.fontFamily,
          fontSize: data.defaults.fontSize,
          lineHeight: data.defaults.lineHeight,
          accent: data.defaults.accent,
        });
      })
      .finally(() => setLoading(false));
  }, [templateId]);

  const onField = (k, v) => setValues((s) => ({ ...s, [k]: v }));
  const onOpt = (k, v) => setOptions((s) => ({ ...s, [k]: v }));

  const canNext = useMemo(() => {
    if (!tpl) return false;
    return tpl.schema.every((f) => !f.required || String(values[f.key] ?? "").trim() !== "");
  }, [tpl, values]);

  function submit(e) {
    e.preventDefault();
    navigate(`/app/preview/${templateId}`, { state: { values, options } });
  }

  if (loading || !tpl) return <div>Chargement…</div>;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold mb-6">{tpl.name}</h1>

      <form onSubmit={submit} className="space-y-6">
        {step === 1 && (
          <div className="space-y-4">
            {tpl.schema.map((f) => (
              <div key={f.key} className="grid gap-2">
                <label className="text-sm opacity-80">{f.label}</label>
                {f.type === "text" && (
                  <input
                    type="text"
                    value={values[f.key]}
                    onChange={(e) => onField(f.key, e.target.value)}
                    required={f.required}
                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-white/30"
                  />
                )}
                {f.type === "date" && (
                  <input
                    type="date"
                    value={values[f.key]}
                    onChange={(e) => onField(f.key, e.target.value)}
                    required={f.required}
                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-white/30"
                  />
                )}
                {f.type === "number" && (
                  <input
                    type="number"
                    value={values[f.key]}
                    onChange={(e) => onField(f.key, e.target.value)}
                    required={f.required}
                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-white/30"
                  />
                )}
              </div>
            ))}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!canNext}
                className={`px-4 py-2 rounded-lg ${canNext ? "bg-white text-black" : "bg-white/20 text-white/60 cursor-not-allowed"}`}
              >
                Suivant
              </button>
            </div>
          </div>
        )}

        {step === 2 && options && (
          <div className="space-y-4">
            <div className="grid gap-2">
              <label className="text-sm opacity-80">Police</label>
              <input
                type="text"
                value={options.fontFamily}
                onChange={(e) => onOpt("fontFamily", e.target.value)}
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm opacity-80">Taille (pt)</label>
              <input
                type="number"
                value={options.fontSize}
                onChange={(e) => onOpt("fontSize", Number(e.target.value))}
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm opacity-80">Interligne</label>
              <input
                type="number"
                step="0.1"
                value={options.lineHeight}
                onChange={(e) => onOpt("lineHeight", Number(e.target.value))}
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm opacity-80">Couleur d'accent</label>
              <input
                type="color"
                value={options.accent}
                onChange={(e) => onOpt("accent", e.target.value)}
                className="h-10 w-20 bg-white/5 border border-white/10 rounded"
              />
            </div>
            <div className="flex justify-between gap-3">
              <button type="button" onClick={() => setStep(1)} className="px-4 py-2 rounded-lg border border-white/20">
                Retour
              </button>
              <button type="submit" className="px-4 py-2 rounded-lg bg-white text-black">
                Aperçu
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
