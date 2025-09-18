import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

export default function UploadAndFix() {
    const { templateId } = useParams();
    const navigate = useNavigate();
    const [tpl, setTpl] = useState(null);
    const [raw, setRaw] = useState(null);
    const [patched, setPatched] = useState(null);
    const [missing, setMissing] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showFixer, setShowFixer] = useState(false);
    const [hasBeenValidated, setHasBeenValidated] = useState(false);

    useEffect(() => {
        setLoading(true);
        fetch(`/templates/${templateId}.json`)
            .then((r) => r.json())
            .then(setTpl)
            .finally(() => setLoading(false));
    }, [templateId]);

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
                setShowFixer(true);
                setHasBeenValidated(true);
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
            const arr = String(value)
                .split("\n")
                .map((s) => s.trim())
                .filter(Boolean);
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
        if (!usesDotPathsInTemplate(tpl?.template)) {
            flat["start_date"] = getByPath(patched, "project_timeline.start_date") || "";
            flat["end_date"] = getByPath(patched, "project_timeline.end_date") || "";
            flat["duration_months"] =
                getByPath(patched, "project_timeline.duration_months") ?? "";
        }
        if (Array.isArray(getByPath(patched, "project_objectives"))) {
            flat["project_objectives_list"] = getByPath(patched, "project_objectives")
                .map((it) => `<li>${escapeHtml(it)}</li>`)
                .join("");
        } else {
            flat["project_objectives_list"] = "";
        }
        const fmt = (n) => (typeof n === "number" ? n.toLocaleString("fr-FR") : "");
        flat["total_budget_xaf_fmt"] = fmt(getByPath(patched, "total_budget_xaf"));
        flat["funding_requested_xaf_fmt"] = fmt(
            getByPath(patched, "funding_requested_xaf")
        );
        navigate(`/app/preview/${templateId}`, {
            state: { values: flat, options: tpl?.defaults || {} },
        });
    }

    if (loading || !tpl) return <div>Chargement…</div>;

    return (
        <div className="max-w-2xl space-y-6">
            <h1 className="text-2xl font-semibold">{tpl.name}</h1>

            <div className="p-4 rounded-lg border border-white/10 bg-white/5">
                <label className="text-sm opacity-80 block mb-2">
                    Charger le fichier JSON du projet
                </label>
                <input
                    type="file"
                    accept=".json,application/json"
                    onChange={onFile}
                    className="block w-full rounded-lg border border-white/10 bg-black/30 p-2"
                />
                <p className="text-xs opacity-70 mt-2">
                    Attendu: project_name, project_objectives[], total_budget_xaf,
                    funding_requested_xaf, project_timeline.start_date, .end_date, .duration_months
                </p>
            </div>

            {raw && showFixer && (
                <div className="p-4 rounded-lg border border-amber-500/30 bg-amber-500/10">
                    <h2 className="font-medium mb-3">Champs du projet</h2>
                    
                    {hasBeenValidated && missing.length === 0 && (
                        <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                            <p className="text-green-300 text-sm">Tous les champs requis sont valides!</p>
                        </div>
                    )}
                    
                    <div className="space-y-4">
                        {tpl?.schema
                            ?.filter(field => field.required || getByPath(patched, field.key) !== undefined)
                            .map((field) => {
                                const { key, label, type } = field;
                                const val = getByPath(patched, key);
                                const isMissing = missing.includes(key);

                                if (type === "list<string>")
                                    return (
                                        <div key={key} className="grid gap-2">
                                            <label className="text-sm opacity-80">
                                                {label}
                                                {isMissing && <span className="text-red-500 ml-1">*</span>}
                                            </label>
                                            <textarea
                                                rows={4}
                                                placeholder="Un élément par ligne"
                                                value={Array.isArray(val) ? val.join("\n") : ""}
                                                onChange={(e) => onMissingChange(key, e.target.value)}
                                                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2"
                                            />
                                            {isMissing && <p className="text-red-500 text-xs">Ce champ est requis</p>}
                                        </div>
                                    );

                                if (type === "number")
                                    return (
                                        <div key={key} className="grid gap-2">
                                            <label className="text-sm opacity-80">
                                                {label}
                                                {isMissing && <span className="text-red-500 ml-1">*</span>}
                                            </label>
                                            <input
                                                type="number"
                                                value={val ?? ""}
                                                onChange={(e) => onMissingChange(key, e.target.value)}
                                                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2"
                                            />
                                            {isMissing && <p className="text-red-500 text-xs">Ce champ est requis</p>}
                                        </div>
                                    );

                                if (type === "date")
                                    return (
                                        <div key={key} className="grid gap-2">
                                            <label className="text-sm opacity-80">
                                                {label}
                                                {isMissing && <span className="text-red-500 ml-1">*</span>}
                                            </label>
                                            <input
                                                type="date"
                                                value={val ?? ""}
                                                onChange={(e) => onMissingChange(key, e.target.value)}
                                                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2"
                                            />
                                            {isMissing && <p className="text-red-500 text-xs">Ce champ est requis</p>}
                                        </div>
                                    );

                                return (
                                    <div key={key} className="grid gap-2">
                                        <label className="text-sm opacity-80">
                                            {label}
                                            {isMissing && <span className="text-red-500 ml-1">*</span>}
                                        </label>
                                        <input
                                            type="text"
                                            value={val ?? ""}
                                            onChange={(e) => onMissingChange(key, e.target.value)}
                                            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2"
                                        />
                                        {isMissing && <p className="text-red-500 text-xs">Ce champ est requis</p>}
                                    </div>
                                );
                            })}
                    </div>
                </div>
            )}

            {raw && (
                <div className="flex justify-end">
                    <button
                        disabled={missing.length > 0}
                        onClick={goPreview}
                        className={`px-4 py-2 rounded-lg ${missing.length
                                ? "bg-white/20 text-white/60 cursor-not-allowed"
                                : "bg-white text-black"
                            }`}
                    >
                        Aperçu
                    </button>
                </div>
            )}
        </div>
    );
}

/* helpers (sans commentaires dans le code) */
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
        if (i === parts.length - 1) {
            cur[k] = value;
        } else {
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
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
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