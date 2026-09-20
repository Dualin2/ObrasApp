"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AlbaranesGlobal() {
  const router = useRouter();
  const [albaranes, setAlbaranes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAlbaranes = async () => {
    try {
      const res = await fetch("/api/projects/1/delivery-notes");
      if (res.ok) {
        setAlbaranes(await res.json());
      }
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAlbaranes();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <header className="mb-8 border-b pb-4 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Listado de Albaranes</h1>
          <p className="text-slate-500">Histórico completo de la obra</p>
        </div>
        <div>
          <Link href="/jefe-obra" className="text-blue-600 hover:underline font-semibold">
            &larr; Volver al Panel
          </Link>
        </div>
      </header>

      {loading ? (
        <p className="text-slate-500 font-bold">Cargando albaranes...</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-sm border-b">
                <th className="p-4 font-bold">Fecha</th>
                <th className="p-4 font-bold">Proveedor / Subcontrata</th>
                <th className="p-4 font-bold">Concepto</th>
                <th className="p-4 font-bold">Unidades</th>
                <th className="p-4 font-bold">Coste Total</th>
                <th className="p-4 font-bold">Estado (Contrato)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {albaranes.length === 0 ? (
                <tr><td colSpan={6} className="p-6 text-center text-slate-500 italic">No hay albaranes registrados.</td></tr>
              ) : (
                albaranes.map((a: any) => (
                  <tr key={a.id} className="hover:bg-blue-50 cursor-pointer transition-colors group" onClick={() => router.push(`/albaranes/${a.id}`)}>
                    <td className="p-4 font-semibold text-slate-700 group-hover:text-blue-700">{a.date}</td>
                    <td className="p-4 font-bold text-slate-800">{a.provider}</td>
                    <td className="p-4 text-slate-600">{a.material_description}</td>
                    <td className="p-4 font-semibold text-slate-700">{a.total_quantity}</td>
                    <td className="p-4 font-black text-slate-800">{a.total_cost.toLocaleString('es-ES')} €</td>
                    <td className="p-4 flex items-center justify-between">
                      {a.contract_id ? (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                          ✅ Contratado
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
                          ⚠️ Sin Contrato
                        </span>
                      )}
                      <span className="text-slate-300 ml-4">➡️</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
