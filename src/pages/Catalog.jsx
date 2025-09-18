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
    <div>
      <h1 className="text-2xl font-semibold mb-6">Choisissez un template</h1>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {items.map(t => (
          <Link
            key={t.id}
            to={`/app/fill/${t.id}`}
            className="group overflow-hidden rounded-2xl border border-white/10 hover:border-white/20 transition block"
          >
            <div className="aspect-[16/10] bg-white/5">
              <img src={t.thumbnail} alt={t.name} className="w-full h-full object-cover" />
            </div>
            <div className="p-4">
              <div className="text-sm opacity-70">{t.category}</div>
              <div className="font-medium">{t.name}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
