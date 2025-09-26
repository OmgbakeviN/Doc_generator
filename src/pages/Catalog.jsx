import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function Catalog() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/templates.json")
      .then(r => r.json())
      .then(setItems)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Chargement…</div>;

  return (
<div className="bg-white p-6 rounded-lg">
  <h1 className="text-2xl font-semibold text-slate-800 mb-6">Choisissez un template</h1>
  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
    {items.map(t => (
      <Link
        key={t.id}
        to={`/app/fill/${t.id}`}
        className="group overflow-hidden rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all duration-300 block bg-white"
      >
        <div className="aspect-[16/10] bg-slate-100">
          <img src={t.thumbnail} alt={t.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        </div>
        <div className="p-4">
          <div className="text-sm text-slate-500 font-medium mb-1">{t.category}</div>
          <div className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">{t.name}</div>
        </div>
      </Link>
    ))}
  </div>
</div>
  );
}
