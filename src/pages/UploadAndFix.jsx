import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

export default function UploadAndFix() {
  const { templateId } = useParams();
  const navigate = useNavigate();

  // --- state
  const [step, setStep] = useState(1); // 1=Upload, 2=Vérification
  const [tpl, setTpl] = useState(null);
  const [raw, setRaw] = useState(null);
  const [patched, setPatched] = useState(null);
  const [missing, setMissing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasBeenValidated, setHasBeenValidated] = useState(false);

  // --- load template
  useEffect(() => {
    setLoading(true);
    fetch(`/templates/${templateId}.json`)
      .then((r) => r.json())
      .then(setTpl)
      .finally(() => setLoading(false));
  }, [templateId]);

  // revalide si tpl arrive après upload
  useEffect(() => {
    if (tpl && raw && patched && hasBeenValidated) {
      const v = validateAndCoerce(patched, tpl.schema || []);
      setMissing(v.missing);
    }
  }, [tpl]);

  // --- handlers
  function onFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result || "{}"));
        setRaw(data);
        const { patched, missing } = validateAndCoerce(data, tpl?.schema || []);
        setPatched(patched);
        setMissing(missing);
        setHasBeenValidated(true);
        setStep(2); // → passe directement à l’étape vérification
      } catch {
        alert("JSON invalide");
      }
    };
    reader.readAsText(f);
  }

  function onMissingChange(key, value) {
    const cfg = (tpl?.schema || []).find((f) => f.key === key);
    const next = structuredClone(patched || {});
    if (cfg?.type === "list<string>") {
      const arr = String(value).split("\n").map((s) => s.trim()).filter(Boolean);
      setByPath(next, key, arr);
    } else if (cfg?.type === "number") {
      const n = value === "" ? null : parseInt(value, 10);
      setByPath(next, key, Number.isFinite(n) ? n : null);
    } else {
      setByPath(next, key, value);
    }
    setPatched(next);
    const v = validateAndCoerce(next, tpl?.schema || []);
    setMissing(v.missing);
  }

  function goPreview() {
    const flat = flatten(patched);

    // alias timeline si le template utilise {{start_date}} / {{end_date}} / {{duration_months}}
    if (!usesDotPathsInTemplate(tpl?.template)) {
      flat["start_date"] = getByPath(patched, "project_timeline.start_date") || "";
      flat["end_date"] = getByPath(patched, "project_timeline.end_date") || "";
      flat["duration_months"] = getByPath(patched, "project_timeline.duration_months") ?? "";
    }

    // dérivés d’affichage
    if (Array.isArray(getByPath(patched, "project_objectives"))) {
      flat["project_objectives_list"] = getByPath(patched, "project_objectives")
        .map((it) => `<li>${escapeHtml(it)}</li>`)
        .join("");
    } else {
      flat["project_objectives_list"] = "";
    }
    const fmt = (n) => (typeof n === "number" ? n.toLocaleString("fr-FR") : "");
    flat["total_budget_xaf_fmt"] = fmt(getByPath(patched, "total_budget_xaf"));
    flat["funding_requested_xaf_fmt"] = fmt(getByPath(patched, "funding_requested_xaf"));

    navigate(`/app/preview/${templateId}`, {
      state: { values: flat, options: tpl?.defaults || {} },
    });
  }

  if (loading || !tpl) return <div>Chargement…</div>;

  // --- UI helpers
  const canGoNextFromStep1 = !!raw;          // on a bien uploadé un JSON
  const canPreview = missing.length === 0;   // tous les champs OK

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold text-slate-800">{tpl.name}</h1>

      {/* Stepper */}
      <div className="flex items-center gap-3">
        <StepDot active={step === 1} done={step > 1} label="Importer" index={1} onClick={() => setStep(1)} />
        <StepLine />
        <StepDot active={step === 2} done={false} label="Vérification" index={2} onClick={() => raw && setStep(2)} />
      </div>

      {/* Étape 1 — Importer JSON */}
      {step === 1 && (
        <div className="p-4 rounded-lg border border-slate-200 bg-slate-50">
          <label className="text-sm text-slate-600 font-medium block mb-2">
            Charger le fichier JSON du projet
          </label>
          <input
            type="file"
            accept=".json,application/json"
            onChange={onFile}
            className="block w-full rounded-lg border border-slate-300 bg-white p-3 text-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
            disabled={loading || !tpl}
          />
          <p className="text-xs text-slate-500 mt-2">
            Attendu: <code>project_name</code>, <code>project_objectives[]</code>,{" "}
            <code>total_budget_xaf</code>, <code>funding_requested_xaf</code>,{" "}
            <code>project_timeline.start_date</code>, <code>.end_date</code>, <code>.duration_months</code>
          </p>

          <div className="mt-4 flex justify-end">
            <button
              onClick={() => canGoNextFromStep1 ? setStep(2) : alert("Importe d’abord un fichier JSON")}
              className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
                canGoNextFromStep1
                  ? "bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                  : "bg-slate-300 text-slate-500 cursor-not-allowed"
              }`}
            >
              Continuer
            </button>
          </div>
        </div>
      )}

      {/* Étape 2 — Vérification & complétion */}
      {step === 2 && (
        <div className="p-4 rounded-lg border border-amber-300 bg-amber-50">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-medium text-slate-800">Vérification des champs</h2>
            <button
              type="button"
              className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-white"
              onClick={() => setStep(1)}
            >
              Retour
            </button>
          </div>

          {hasBeenValidated && missing.length === 0 && (
            <div className="mb-4 p-3 bg-green-100 border border-green-300 rounded-lg">
              <p className="text-green-700 text-sm font-medium">✓ Tous les champs requis sont valides !</p>
            </div>
          )}

          <div className="space-y-4">
            {tpl?.schema
              ?.filter((f) => f.required || getByPath(patched, f.key) !== undefined)
              .map((field) => {
                const { key, label, type } = field;
                const val = getByPath(patched, key);
                const isMissing = missing.includes(key);

                const baseClasses =
                  "border rounded-lg px-3 py-2 text-slate-700 focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-colors";
                const stateClasses = isMissing ? "border-red-300 bg-red-50" : "border-slate-300 bg-white";

                if (type === "list<string>")
                  return (
                    <div key={key} className="grid gap-2">
                      <label className="text-sm text-slate-700 font-medium">
                        {label}
                        {isMissing && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      <textarea
                        rows={4}
                        placeholder="Un élément par ligne"
                        value={Array.isArray(val) ? val.join("\n") : ""}
                        onChange={(e) => onMissingChange(key, e.target.value)}
                        className={`${baseClasses} ${stateClasses}`}
                      />
                      {isMissing && <p className="text-red-600 text-xs font-medium">Ce champ est requis</p>}
                    </div>
                  );

                if (type === "number")
                  return (
                    <div key={key} className="grid gap-2">
                      <label className="text-sm text-slate-700 font-medium">
                        {label}
                        {isMissing && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      <input
                        type="number"
                        value={val ?? ""}
                        onChange={(e) => onMissingChange(key, e.target.value)}
                        className={`${baseClasses} ${stateClasses}`}
                      />
                      {isMissing && <p className="text-red-600 text-xs font-medium">Ce champ est requis</p>}
                    </div>
                  );

                if (type === "date")
                  return (
                    <div key={key} className="grid gap-2">
                      <label className="text-sm text-slate-700 font-medium">
                        {label}
                        {isMissing && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      <input
                        type="date"
                        value={val ?? ""}
                        onChange={(e) => onMissingChange(key, e.target.value)}
                        className={`${baseClasses} ${stateClasses}`}
                      />
                      {isMissing && <p className="text-red-600 text-xs font-medium">Ce champ est requis</p>}
                    </div>
                  );

                return (
                  <div key={key} className="grid gap-2">
                    <label className="text-sm text-slate-700 font-medium">
                      {label}
                      {isMissing && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <input
                      type="text"
                      value={val ?? ""}
                      onChange={(e) => onMissingChange(key, e.target.value)}
                      className={`${baseClasses} ${stateClasses}`}
                    />
                    {isMissing && <p className="text-red-600 text-xs font-medium">Ce champ est requis</p>}
                  </div>
                );
              })}
          </div>

          <div className="mt-6 flex justify-end">
            <button
              disabled={!canPreview}
              onClick={goPreview}
              className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
                canPreview
                  ? "bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                  : "bg-slate-300 text-slate-500 cursor-not-allowed"
              }`}
            >
              Aperçu
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ----------------- helpers ----------------- */
function getByPath(obj, path) {
  return String(path || "")
    .split(".")
    .reduce((o, k) => (o && k in o ? o[k] : undefined), obj);
}
function setByPath(obj, path, value) {
  const parts = String(path || "").split(".");
  let cur = obj;
  for (let i = 0; i < parts.length; i++) {
    const k = parts[i];
    if (i === parts.length - 1) cur[k] = value;
    else {
      cur[k] ??= {};
      cur = cur[k];
    }
  }
  return obj;
}
function flatten(obj, prefix = "", out = {}) {
  if (!obj || typeof obj !== "object") return out;
  for (const [k, v] of Object.entries(obj)) {
    const p = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) flatten(v, p, out);
    else out[p] = v;
  }
  return out;
}
function isNullish(v) {
  return v === null || v === undefined || (typeof v === "string" && v.trim() === "");
}
function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (m) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;",
  })[m]);
}
function validateAndCoerce(data, schema) {
  const patched = structuredClone(data || {});
  const missing = [];
  for (const f of schema) {
    const { key, type, required, integer } = f;
    const val = getByPath(patched, key);

    if (type === "number") {
      const n =
        val === null || val === undefined || val === ""
          ? null
          : typeof val === "number"
          ? val
          : parseFloat(String(val).replace(/[, ]/g, ""));
      const ok = Number.isFinite(n);
      if (!ok) {
        if (required) missing.push(key);
      } else {
        setByPath(patched, key, integer ? Math.trunc(n) : n);
      }
      continue;
    }

    if (type === "list<string>") {
      const ok =
        Array.isArray(val) &&
        val.length > 0 &&
        val.every((x) => typeof x === "string" && x.trim() !== "");
      if (!ok && required) missing.push(key);
      continue;
    }

    if (type === "date") {
      const ok = typeof val === "string" && /^\d{4}-\d{2}-\d{2}$/.test(val);
      if (!ok && required) missing.push(key);
      continue;
    }

    if (required && isNullish(val)) missing.push(key);
  }
  return { patched, missing };
}
function usesDotPathsInTemplate(tplHtml) {
  return /\{\{\s*project_timeline\.(start_date|end_date|duration_months)\s*\}\}/.test(
    String(tplHtml || "")
  );
}

/* ----------------- UI atoms ----------------- */
function StepDot({ active, done, label, index, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 group"
    >
      <span
        className={[
          "h-8 w-8 rounded-full flex items-center justify-center text-sm font-semibold",
          done ? "bg-green-600 text-white" :
          active ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-700"
        ].join(" ")}
      >
        {done ? "✓" : index}
      </span>
      <span className={active ? "text-slate-900 font-medium" : "text-slate-500"}>
        {label}
      </span>
    </button>
  );
}
function StepLine() {
  return <div className="flex-1 h-[2px] bg-slate-200" />;
}
