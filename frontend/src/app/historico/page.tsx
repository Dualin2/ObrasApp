"use client";
import { useState, useEffect } from "react";

export default function HistoricoDiario() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // NOTA: Para el prototipo, estamos asumiendo que el ID de proyecto es 1.
  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/daily/1/report?report_date=${date}`);
      if (res.ok) {
        const data = await res.json();
        setReport(data);
      }
    } catch (err) {
      console.error("Error fetching report:", err);
    }
    setLoading(false);
  };

  const handleDelete = async (type: 'delivery' | 'progress', id: number) => {
    if (!window.confirm("¿Seguro que quieres eliminar este registro? La acción es irreversible.")) return;
    
    let endpoint = "";
    if (type === 'delivery') endpoint = `/api/operations/delivery-notes/${id}`;
    if (type === 'progress') endpoint = `/api/operations/daily-progress/${id}`;
    
    try {
      const res = await fetch(endpoint, { method: "DELETE" });
      if (res.ok) {
        fetchReport(); // Refrescar los datos para recalcular totales del día
      } else {
        alert("Error al eliminar el registro. Puede que ya no exista.");
      }
    } catch (err) {
      alert("Error de conexión al servidor.");
    }
  };

  useEffect(() => {
    fetchReport();
  }, [date]);

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <header className="mb-8 border-b pb-4 flex justify-between items-end flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Parte Diario de Obra</h1>
          <p className="text-slate-500">Histórico de actividad y costes</p>
        </div>
        <div className="flex items-center gap-4">
          <label className="font-bold text-slate-700">Seleccionar Fecha:</label>
          <input 
            type="date" 
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2.5 border font-semibold text-slate-700" 
          />
        </div>
      </header>

      {loading && <div className="text-center py-10 text-slate-500 font-semibold">Cargando datos del día...</div>}
      
      {!loading && report && (
        <main className="space-y-6">
          {/* RESUMEN DEL DÍA */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide">Gastos Imputados (Albaranes)</h3>
              <p className="text-3xl font-black text-slate-800 mt-2">{report.total_spent_today.toLocaleString('es-ES')} €</p>
              <p className="text-sm text-slate-500 mt-1">En {report.total_deliveries} albaranes</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide">Avances Registrados</h3>
              <p className="text-3xl font-black text-slate-800 mt-2">{report.progresses.length}</p>
              <p className="text-sm text-slate-500 mt-1">Unidades de obra movidas</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide">Incidencias</h3>
              <p className="text-3xl font-black text-slate-800 mt-2">{report.incidents.length}</p>
              <p className="text-sm text-slate-500 mt-1">Reportes en el día</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ALBARANES DEL DÍA */}
            <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 bg-slate-800 text-white font-bold flex items-center gap-2">
                <span>📦</span> Materiales y Gastos Recibidos
              </div>
              <ul className="divide-y divide-slate-100">
                {report.deliveries.length === 0 ? (
                  <li className="p-6 text-center text-slate-500 italic">No hay albaranes este día.</li>
                ) : (
                  report.deliveries.map((d: any) => (
                    <li key={d.id} className="p-4 flex justify-between items-center hover:bg-slate-50">
                      <div>
                        <p className="font-bold text-slate-800">{d.provider}</p>
                        <p className="text-sm text-slate-500 flex items-center gap-2 mt-1">
                          {d.description}
                          {d.quantity > 0 && (
                            <span className="px-2 py-0.5 bg-slate-200 rounded-full text-xs text-slate-600 font-semibold">
                              {d.quantity} uds a {(d.cost / d.quantity).toLocaleString('es-ES')} €/ud
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 text-right">
                        <p className="font-black text-slate-800">{d.cost.toLocaleString('es-ES')} €</p>
                        <button onClick={() => handleDelete('delivery', d.id)} className="text-red-400 hover:text-red-600 bg-red-50 hover:bg-red-100 p-2 rounded-lg transition-colors" title="Eliminar albarán">
                          🗑️
                        </button>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </section>

            {/* AVANCES DEL DÍA */}
            <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 bg-emerald-600 text-white font-bold flex items-center gap-2">
                <span>🚧</span> Producción Ejecutada
              </div>
              <ul className="divide-y divide-slate-100">
                {report.progresses.length === 0 ? (
                  <li className="p-6 text-center text-slate-500 italic">No hay avance físico este día.</li>
                ) : (
                  report.progresses.map((p: any) => (
                    <li key={p.id} className="p-4 flex justify-between items-center hover:bg-slate-50">
                      <div>
                        <p className="font-bold text-slate-800">{p.code} - {p.work_unit}</p>
                        <p className="text-sm text-slate-500">{p.notes || "Sin observaciones"}</p>
                      </div>
                      <div className="flex items-center gap-4 text-right">
                        <p className="font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                          + {p.quantity} uds
                        </p>
                        <button onClick={() => handleDelete('progress', p.id)} className="text-red-400 hover:text-red-600 bg-red-50 hover:bg-red-100 p-2 rounded-lg transition-colors" title="Eliminar avance">
                          🗑️
                        </button>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </section>
            
            {/* INCIDENCIAS */}
            <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden lg:col-span-2">
              <div className="p-4 bg-amber-500 text-white font-bold flex items-center gap-2">
                <span>⚠️</span> Incidencias y Climatología
              </div>
              <ul className="divide-y divide-slate-100">
                {report.incidents.length === 0 ? (
                  <li className="p-6 text-center text-slate-500 italic">Jornada normal. Sin incidencias.</li>
                ) : (
                  report.incidents.map((i: any) => (
                    <li key={i.id} className="p-4 hover:bg-slate-50">
                      <p className="font-bold text-amber-600 uppercase text-sm mb-1">{i.type}</p>
                      <p className="text-slate-700">{i.description}</p>
                    </li>
                  ))
                )}
              </ul>
            </section>
          </div>
        </main>
      )}
    </div>
  );
}
