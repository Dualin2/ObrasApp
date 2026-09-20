"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

interface CertData {
  id: number;
  chapter: string;
  code: string;
  name: string;
  sale_price: number;
  executed_quantity: number;
  certified_quantity: number;
}

export default function CertificacionDashboard() {
  const [data, setData] = useState<CertData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editedItems, setEditedItems] = useState<{ [key: number]: number }>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/projects/1/certification-data");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleQtyChange = (id: number, val: string) => {
    const num = parseFloat(val);
    setEditedItems(prev => ({
      ...prev,
      [id]: isNaN(num) ? 0 : num
    }));
  };

  const handleSave = async () => {
    if (Object.keys(editedItems).length === 0) return;
    
    setSaving(true);
    const payload = {
      items: Object.entries(editedItems).map(([id, qty]) => ({
        work_unit_id: parseInt(id),
        certified_quantity: qty
      }))
    };

    try {
      const res = await fetch("/api/projects/1/certifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        setEditedItems({});
        await fetchData();
        alert("Certificación guardada correctamente.");
      } else {
        alert("Error al guardar la certificación.");
      }
    } catch (e) {
      alert("Error de red.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 font-bold text-slate-500 animate-pulse">Cargando unidades...</div>;

  const uniqueChapters = Array.from(new Set(data.map(d => d.chapter).filter(Boolean)));
  uniqueChapters.sort();

  // Calcular totales
  const totalCertificacion = data.reduce((acc, curr) => {
    const qty = editedItems[curr.id] !== undefined ? editedItems[curr.id] : curr.certified_quantity;
    return acc + (qty * curr.sale_price);
  }, 0);

  const totalProduccion = data.reduce((acc, curr) => acc + (curr.executed_quantity * curr.sale_price), 0);
  const hasChanges = Object.keys(editedItems).length > 0;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 text-slate-800">
      <header className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sticky top-0 bg-slate-50/90 backdrop-blur pb-4 z-10 border-b border-slate-200">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Venta / Certificación</h1>
          <p className="text-slate-500 font-medium">Control mensual de cantidades a facturar</p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm font-bold items-center">
          <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 mr-4 shadow-sm flex gap-4">
            <div>
              <span className="text-xs text-slate-500 uppercase block">Producción Total</span>
              <span className="text-lg font-black text-slate-700">{totalProduccion.toLocaleString('es-ES', { maximumFractionDigits: 2 })} €</span>
            </div>
            <div className="border-l pl-4">
              <span className="text-xs text-blue-500 uppercase block">Certificación Total</span>
              <span className="text-lg font-black text-blue-700">{totalCertificacion.toLocaleString('es-ES', { maximumFractionDigits: 2 })} €</span>
            </div>
          </div>

          <button 
            onClick={handleSave} 
            disabled={!hasChanges || saving}
            className={`px-6 py-2 rounded-lg shadow-sm transition-colors ${hasChanges ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
          >
            {saving ? "Guardando..." : "💾 Guardar Cambios"}
          </button>
          <Link href="/jefe-obra" className="bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-700 shadow-sm">
            Volver al Dashboard
          </Link>
        </div>
      </header>

      <div className="space-y-6">
        {uniqueChapters.map((ch, idx) => {
          const wus = data.filter(wu => wu.chapter === ch);
          return (
            <div key={idx} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-slate-100 p-3 border-b border-slate-200">
                <h2 className="text-md font-bold text-slate-800">Capítulo {ch}</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 uppercase text-xs">
                      <th className="p-3 font-bold border-b w-16">Cód.</th>
                      <th className="p-3 font-bold border-b w-1/3">Nombre</th>
                      <th className="p-3 font-bold border-b text-right">Precio Venta</th>
                      <th className="p-3 font-bold border-b text-right bg-slate-100">Prod. Ejecutada</th>
                      <th className="p-3 font-bold border-b text-right text-blue-700 bg-blue-50">Cantidad Certificada</th>
                      <th className="p-3 font-bold border-b text-right text-blue-700 bg-blue-50">Total Venta</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {wus.map(wu => {
                      const currentQty = editedItems[wu.id] !== undefined ? editedItems[wu.id] : wu.certified_quantity;
                      const isEdited = editedItems[wu.id] !== undefined;
                      const totalRow = currentQty * wu.sale_price;
                      const pendingToCertify = wu.executed_quantity > currentQty ? (wu.executed_quantity - currentQty) : 0;

                      return (
                        <tr key={wu.id} className="hover:bg-slate-50">
                          <td className="p-3 font-bold text-slate-700">{wu.code}</td>
                          <td className="p-3 font-medium text-slate-600 truncate max-w-xs" title={wu.name}>
                            {wu.name}
                            {pendingToCertify > 0 && (
                              <span className="block text-xs font-bold text-red-500 mt-0.5">
                                🚨 Faltan {pendingToCertify.toLocaleString('es-ES', { maximumFractionDigits: 2 })} sin certificar
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-right text-slate-600">{wu.sale_price.toLocaleString('es-ES')} €</td>
                          
                          <td className={`p-3 text-right font-bold ${pendingToCertify > 0 ? 'bg-red-50 text-red-700' : 'bg-slate-50/50 text-slate-800'}`}>
                            {wu.executed_quantity > 0 ? (
                              <span>{wu.executed_quantity.toLocaleString('es-ES', { maximumFractionDigits: 2 })}</span>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>

                          <td className={`p-2 text-right bg-blue-50/30 ${isEdited ? 'bg-amber-50/50' : ''}`}>
                            <input 
                              type="number" 
                              step="0.01"
                              value={currentQty || ""} 
                              onChange={(e) => handleQtyChange(wu.id, e.target.value)}
                              className={`w-24 text-right p-1.5 border rounded font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 ${isEdited ? 'border-amber-400 text-amber-700 bg-amber-50' : 'border-slate-200 text-blue-700'} ${pendingToCertify > 0 ? 'border-red-400 bg-red-50 text-red-700' : ''}`}
                              placeholder="0.00"
                            />
                          </td>

                          <td className="p-3 text-right font-black text-blue-700 bg-blue-50/30">
                            {totalRow > 0 ? `${totalRow.toLocaleString('es-ES', { maximumFractionDigits: 2 })} €` : '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
