"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function Contratos() {
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedProvider, setExpandedProvider] = useState<string | null>(null);

  // Formulario nuevo contrato
  const [providerMode, setProviderMode] = useState<string>(""); // "" (none), "NEW", or existing provider name
  const [newProviderName, setNewProviderName] = useState("");
  const [concept, setConcept] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchContracts = async () => {
    try {
      const res = await fetch("/api/projects/1/contracts");
      if (res.ok) setContracts(await res.json());
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchContracts();
  }, []);

  const handleAddContract = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    const finalProvider = providerMode === "NEW" ? newProviderName : providerMode;

    try {
      const res = await fetch("/api/projects/1/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: finalProvider,
          concept,
          unit_price: parseFloat(unitPrice)
        })
      });
      if (res.ok) {
        setProviderMode("");
        setNewProviderName("");
        setConcept(""); 
        setUnitPrice("");
        fetchContracts();
      }
    } catch (err) {
      alert("Error al añadir contrato");
    }
    setSubmitting(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setSubmitting(true);
    try {
      const res = await fetch("/api/projects/1/import-contracts", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      alert(data.message || data.detail);
      if (res.ok) fetchContracts();
    } catch (err) {
      console.error(err);
      alert("Error en la importación");
    }
    setSubmitting(false);
    e.target.value = ''; // reset file input
  };

  const uniqueProviders = Array.from(new Set(contracts.map(c => c.provider)));

  // Agrupar contratos por proveedor
  const contractsByProvider = contracts.reduce((acc: any, c: any) => {
    if (!acc[c.provider]) acc[c.provider] = [];
    acc[c.provider].push(c);
    return acc;
  }, {});

  const toggleProvider = (providerName: string) => {
    if (expandedProvider === providerName) {
      setExpandedProvider(null);
    } else {
      setExpandedProvider(providerName);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <header className="mb-8 border-b pb-4 flex justify-between items-end flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Gestión de Contratos</h1>
          <p className="text-slate-500">Proveedores y precios cerrados de la obra</p>
        </div>
        <div>
          <Link href="/jefe-obra" className="text-blue-600 hover:underline font-semibold">
            &larr; Volver al Panel
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LISTADO DE CONTRATOS */}
        <section className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 bg-slate-800 text-white font-bold flex justify-between items-center">
            <span>Contratos Activos</span>
            <div>
              <label className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded text-sm cursor-pointer shadow-sm">
                + Importar Excel
                <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleFileUpload} disabled={submitting} />
              </label>
            </div>
          </div>
          {loading ? (
            <p className="p-6 text-slate-500">Cargando contratos...</p>
          ) : (
            <div className="flex flex-col">
              {Object.keys(contractsByProvider).length === 0 ? (
                <p className="p-6 text-center text-slate-500 italic">No hay contratos registrados.</p>
              ) : (
                Object.keys(contractsByProvider).map((prov) => (
                  <div key={prov} className="border-b border-slate-100 last:border-b-0">
                    <button 
                      onClick={() => toggleProvider(prov)}
                      className="w-full text-left p-4 bg-slate-50 hover:bg-slate-100 flex justify-between items-center font-bold text-slate-800 transition-colors"
                    >
                      <span>{prov}</span>
                      <span className="text-slate-400 text-sm">{contractsByProvider[prov].length} concepto(s) {expandedProvider === prov ? '▲' : '▼'}</span>
                    </button>
                    {expandedProvider === prov && (
                      <div className="p-4 bg-white">
                        <table className="w-full text-left border-collapse text-sm">
                          <thead>
                            <tr className="text-slate-400 border-b">
                              <th className="pb-2 font-semibold">Concepto / Material</th>
                              <th className="pb-2 font-semibold text-right">Precio Unitario</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {contractsByProvider[prov].map((c: any) => (
                              <tr key={c.id}>
                                <td className="py-3 text-slate-700">{c.concept}</td>
                                <td className="py-3 font-black text-blue-700 text-right">{c.unit_price.toLocaleString('es-ES')} €</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </section>

        {/* AÑADIR CONTRATO */}
        <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-fit">
          <h2 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">Añadir Unidad o Concepto</h2>
          <form onSubmit={handleAddContract} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Proveedor / Subcontrata</label>
              <select 
                required 
                value={providerMode} 
                onChange={e => setProviderMode(e.target.value)}
                className="w-full rounded-lg border-slate-300 shadow-sm border p-2.5 bg-slate-50"
              >
                <option value="" disabled>Selecciona un proveedor...</option>
                <option value="NEW" className="font-bold">+ Nuevo Proveedor</option>
                {uniqueProviders.map((p, idx) => (
                  <option key={idx} value={p as string}>{p as string}</option>
                ))}
              </select>
            </div>
            
            {providerMode === "NEW" && (
              <div className="pt-2 pl-4 border-l-2 border-blue-500">
                <label className="block text-sm font-semibold text-slate-700 mb-1">Nombre del Nuevo Proveedor</label>
                <input required value={newProviderName} onChange={e=>setNewProviderName(e.target.value)} type="text" 
                  className="w-full rounded-lg border-slate-300 shadow-sm border p-2.5" placeholder="Ej: Aceros S.L." />
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Concepto / Material</label>
              <input required value={concept} onChange={e=>setConcept(e.target.value)} type="text" 
                className="w-full rounded-lg border-slate-300 shadow-sm border p-2.5" placeholder="Ej: Acero B500S" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Precio Unitario (€)</label>
              <input required value={unitPrice} onChange={e=>setUnitPrice(e.target.value)} type="number" step="0.01" 
                className="w-full rounded-lg border-slate-300 shadow-sm border p-2.5" placeholder="Ej: 1.15" />
            </div>
            <button type="submit" disabled={submitting || !providerMode} className="w-full bg-slate-800 text-white font-bold py-3 rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50">
              {submitting ? "Guardando..." : "Guardar Concepto"}
            </button>
          </form>
        </section>

      </div>
    </div>
  );
}
