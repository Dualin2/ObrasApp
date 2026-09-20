"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function UnidadesDashboard() {
  const [workUnits, setWorkUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form state for editing or creating
  const [formData, setFormData] = useState({
    chapter: "",
    code: "",
    name: "",
    measurement: 0,
    target_cost_price: 0,
    sale_price: 0
  });

  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchWorkUnits();
  }, []);

  const fetchWorkUnits = async () => {
    try {
      const res = await fetch("/api/projects/1/work-units");
      if (res.ok) {
        const data = await res.json();
        setWorkUnits(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const uniqueChapters = Array.from(new Set(workUnits.map(wu => wu.chapter).filter(Boolean)));
  uniqueChapters.sort();

  const handleEditClick = (wu: any) => {
    setEditingId(wu.id);
    setIsCreating(false);
    setFormData({
      chapter: wu.chapter || "",
      code: wu.code || "",
      name: wu.name || "",
      measurement: wu.measurement || 0,
      target_cost_price: wu.target_cost_price || 0,
      sale_price: wu.sale_price || 0
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setIsCreating(false);
  };

  const handleSave = async () => {
    const method = isCreating ? "POST" : "PUT";
    const url = isCreating ? "/api/projects/1/work-units" : `/api/projects/1/work-units/${editingId}`;
    
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        await fetchWorkUnits();
        setEditingId(null);
        setIsCreating(false);
      } else {
        alert("Error al guardar la unidad de obra.");
      }
    } catch (e) {
      alert("Error de red.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Seguro que quieres eliminar esta unidad de obra?")) return;
    try {
      const res = await fetch(`/api/projects/1/work-units/${id}`, { method: "DELETE" });
      if (res.ok) {
        await fetchWorkUnits();
      } else {
        alert("Error al eliminar. Comprueba que no tenga albaranes o avances asociados.");
      }
    } catch (e) {
      alert("Error de red.");
    }
  };

  const startCreate = () => {
    setIsCreating(true);
    setEditingId(null);
    setFormData({
      chapter: "",
      code: "",
      name: "",
      measurement: 0,
      target_cost_price: 0,
      sale_price: 0
    });
  };

  if (loading) return <div className="p-8 font-bold text-slate-500 animate-pulse">Cargando base de datos...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 text-slate-800">
      <header className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Unidades de Obra</h1>
          <p className="text-slate-500 font-medium">Gestiona tu presupuesto y estructura de costes</p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm font-bold">
          <Link href="/importar" className="bg-white border border-slate-300 text-slate-700 px-3 py-2 rounded-lg hover:bg-slate-100 shadow-sm">
            📥 Importar Excel
          </Link>
          <button onClick={startCreate} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow-sm">
            + Nueva Unidad
          </button>
          <Link href="/jefe-obra" className="bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-700 shadow-sm">
            Volver al Dashboard
          </Link>
        </div>
      </header>

      {/* CREATE / EDIT FORM */}
      {(isCreating || editingId) && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8 border-l-4 border-l-blue-500">
          <h2 className="text-lg font-bold text-slate-800 mb-4">{isCreating ? "Crear Nueva Unidad" : `Editar Unidad`}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold mb-1">Capítulo</label>
              <input type="text" value={formData.chapter} onChange={e=>setFormData({...formData, chapter: e.target.value})} className="w-full border p-2 rounded bg-slate-50" placeholder="Ej: C1" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Código</label>
              <input type="text" value={formData.code} onChange={e=>setFormData({...formData, code: e.target.value})} className="w-full border p-2 rounded bg-slate-50" placeholder="Ej: 1.01" />
            </div>
            <div className="lg:col-span-3">
              <label className="block text-sm font-semibold mb-1">Nombre / Resumen</label>
              <input type="text" value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} className="w-full border p-2 rounded bg-slate-50" placeholder="Ej: Excavación en zanjas..." />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Medición de Proyecto</label>
              <input type="number" step="0.01" value={formData.measurement} onChange={e=>setFormData({...formData, measurement: parseFloat(e.target.value)||0})} className="w-full border p-2 rounded bg-slate-50" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Precio Coste Objetivo (€)</label>
              <input type="number" step="0.01" value={formData.target_cost_price} onChange={e=>setFormData({...formData, target_cost_price: parseFloat(e.target.value)||0})} className="w-full border p-2 rounded bg-slate-50" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Precio Venta (Ingreso) (€)</label>
              <input type="number" step="0.01" value={formData.sale_price} onChange={e=>setFormData({...formData, sale_price: parseFloat(e.target.value)||0})} className="w-full border p-2 rounded bg-slate-50" />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={handleCancel} className="px-4 py-2 bg-white border border-slate-300 rounded font-bold text-slate-600 hover:bg-slate-50">Cancelar</button>
            <button onClick={handleSave} className="px-6 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700">Guardar</button>
          </div>
        </div>
      )}

      {/* LISTADO AGRUPADO POR CAPÍTULO */}
      <div className="space-y-6">
        {uniqueChapters.map((ch, idx) => {
          const wus = workUnits.filter(wu => wu.chapter === ch);
          return (
            <div key={idx} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-slate-100 p-4 border-b border-slate-200">
                <h2 className="text-lg font-bold text-slate-800">Capítulo {ch as string}</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 uppercase text-xs">
                      <th className="p-3 font-bold border-b">Cód.</th>
                      <th className="p-3 font-bold border-b w-1/3">Nombre</th>
                      <th className="p-3 font-bold border-b text-right">Medición</th>
                      <th className="p-3 font-bold border-b text-right">Precio Coste</th>
                      <th className="p-3 font-bold border-b text-right">Precio Venta</th>
                      <th className="p-3 font-bold border-b text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {wus.map(wu => (
                      <tr key={wu.id} className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-slate-700">{wu.code}</td>
                        <td className="p-3 font-medium text-slate-600">{wu.name}</td>
                        <td className="p-3 text-right">{wu.measurement}</td>
                        <td className="p-3 text-right text-rose-600 font-semibold">{wu.target_cost_price} €</td>
                        <td className="p-3 text-right text-emerald-600 font-semibold">{wu.sale_price} €</td>
                        <td className="p-3 text-center">
                          <div className="flex justify-center gap-2">
                            <button onClick={() => handleEditClick(wu)} className="px-3 py-1 bg-blue-100 text-blue-700 font-bold rounded hover:bg-blue-200">✏️ Editar</button>
                            <button onClick={() => handleDelete(wu.id)} className="px-3 py-1 bg-rose-100 text-rose-700 font-bold rounded hover:bg-rose-200">🗑️</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
        {uniqueChapters.length === 0 && (
          <div className="p-8 text-center text-slate-500 font-bold bg-white rounded-xl shadow-sm border border-slate-200">
            Aún no has importado ninguna unidad de obra a este proyecto.
          </div>
        )}
      </div>
    </div>
  );
}
