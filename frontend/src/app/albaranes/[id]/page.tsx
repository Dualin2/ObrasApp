"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

export default function AlbaranDetail() {
  const { id } = useParams();
  const router = useRouter();
  
  const [albaran, setAlbaran] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Datos globales para edición
  const [workUnits, setWorkUnits] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);

  // Estado del formulario (copia del albarán)
  const [editDate, setEditDate] = useState("");
  const [editProvider, setEditProvider] = useState("");
  const [editContractId, setEditContractId] = useState<string>("");
  const [editMaterial, setEditMaterial] = useState("");
  const [editQuantity, setEditQuantity] = useState("");
  const [editCost, setEditCost] = useState("");
  const [editAllocations, setEditAllocations] = useState<any[]>([]);

  // Helpers para contratos
  const uniqueProviders = Array.from(new Set(contracts.map(c => c.provider)));
  const conceptsForProvider = contracts.filter(c => c.provider === editProvider);

  useEffect(() => {
    Promise.all([
      fetch(`/api/operations/delivery-notes/${id}`).then(r => r.ok ? r.json() : Promise.reject()),
      fetch("/api/projects/1/work-units").then(r => r.ok ? r.json() : []),
      fetch("/api/projects/1/contracts").then(r => r.ok ? r.json() : [])
    ])
    .then(([albaranData, wuData, contractsData]) => {
      setAlbaran(albaranData);
      setWorkUnits(wuData);
      setContracts(contractsData);
      setLoading(false);
    })
    .catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, [id]);

  const enterEditMode = () => {
    setEditDate(albaran.date);
    setEditProvider(albaran.provider);
    setEditContractId(albaran.contract_id ? albaran.contract_id.toString() : "");
    setEditMaterial(albaran.material_description);
    setEditQuantity(albaran.total_quantity.toString());
    setEditCost(albaran.total_cost.toString());
    setEditAllocations(
      albaran.allocations.map((a: any) => {
        const wu = workUnits.find((w: any) => w.id === a.work_unit_id);
        return {
          chapter: wu ? wu.chapter : "",
          work_unit_id: a.work_unit_id.toString(),
          percentage: a.allocated_percentage
        };
      })
    );
    setIsEditing(true);
  };

  const handleProviderSelect = (prov: string) => {
    setEditProvider(prov);
    setEditContractId("");
    if (prov === "NEW") {
      setEditProvider("");
      setEditMaterial("");
      setEditCost("");
    }
  };

  const handleContractSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const cId = e.target.value;
    setEditContractId(cId);
    if (cId) {
      const contract = contracts.find(c => c.id.toString() === cId);
      if (contract) {
        setEditProvider(contract.provider);
        setEditMaterial(contract.concept);
        if (editQuantity) {
          setEditCost((parseFloat(editQuantity) * contract.unit_price).toFixed(2));
        }
      }
    } else {
      if (editProvider !== "NEW") {
        setEditProvider(editProvider);
      }
      setEditMaterial("");
      setEditCost("");
    }
  };

  const handleAddAllocation = () => {
    setEditAllocations([...editAllocations, { chapter: "", work_unit_id: "", percentage: 100 }]);
  };

  const handleRemoveAllocation = (index: number) => {
    setEditAllocations(editAllocations.filter((_, i) => i !== index));
  };

  const handleAllocationChange = (index: number, field: string, value: string) => {
    const newAlloc = [...editAllocations];
    newAlloc[index][field] = value;
    if (field === "chapter") {
      newAlloc[index]["work_unit_id"] = "";
    }
    setEditAllocations(newAlloc);
  };

  const uniqueChapters = Array.from(new Set(workUnits.map(wu => wu.chapter).filter(Boolean)));
  uniqueChapters.sort();

  const handleSave = async () => {
    setSubmitting(true);
    try {
      const payload = {
        project_id: 1,
        contract_id: editContractId ? parseInt(editContractId) : null,
        date: editDate,
        provider: editProvider,
        material_description: editMaterial,
        total_quantity: parseFloat(editQuantity) || 1,
        total_cost: parseFloat(editCost) || 0,
        allocations: editAllocations.map(a => ({
          work_unit_id: parseInt(a.work_unit_id),
          allocated_quantity: 0,
          allocated_percentage: parseFloat(a.percentage) || 0
        }))
      };

      const res = await fetch(`/api/operations/delivery-notes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const updated = await fetch(`/api/operations/delivery-notes/${id}`).then(r => r.json());
        setAlbaran(updated);
        setIsEditing(false);
      } else {
        alert("Error al actualizar");
      }
    } catch (err) {
      alert("Error de red");
    }
    setSubmitting(false);
  };

  const handleDelete = async () => {
    if (!confirm("¿Seguro que quieres eliminar este albarán y sus imputaciones de coste?")) return;
    try {
      const res = await fetch(`/api/operations/delivery-notes/${id}`, { method: "DELETE" });
      if (res.ok) {
        alert("Albarán eliminado");
        router.push("/albaranes");
      } else {
        alert("Error al eliminar");
      }
    } catch (err) {
      alert("Error de red");
    }
  };

  if (loading) return <div className="p-8 font-bold text-slate-500 animate-pulse">Cargando albarán...</div>;
  if (!albaran) return <div className="p-8 font-bold text-red-500">Error: Albarán no encontrado.</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 text-slate-800">
      <header className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Albarán #{albaran.id}</h1>
          <p className="text-slate-500 font-medium">Detalle del gasto y su reparto económico</p>
        </div>
        <Link href="/albaranes" className="text-blue-600 hover:underline font-bold">
          &larr; Volver al Listado
        </Link>
      </header>

      {isEditing ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
          <h2 className="text-xl font-bold text-slate-800 mb-6 border-b pb-2">Editar Albarán</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-semibold mb-1">Fecha</label>
              <input type="date" value={editDate} onChange={e=>setEditDate(e.target.value)} className="w-full border rounded p-2.5 bg-slate-50" />
            </div>

            <div className="flex flex-col gap-4 row-span-2">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Proveedor / Subcontrata (Contrato)</label>
                <select 
                  value={editProvider} 
                  onChange={(e) => handleProviderSelect(e.target.value)} 
                  className="w-full rounded-lg border-slate-300 shadow-sm border p-2.5 bg-blue-50 focus:ring-blue-500 font-semibold"
                >
                  <option value="">-- Selecciona un Proveedor --</option>
                  <option value="NEW" className="font-bold text-blue-700">+ Sin Contrato / Libre</option>
                  {uniqueProviders.map((p, idx) => (
                    <option key={idx} value={p as string}>{p as string}</option>
                  ))}
                </select>
              </div>
              
              {editProvider && editProvider !== "NEW" && (
                <div className="pl-4 border-l-2 border-blue-400">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Concepto Contratado</label>
                  <select 
                    value={editContractId} 
                    onChange={handleContractSelect} 
                    className="w-full rounded-lg border-slate-300 shadow-sm border p-2.5 bg-blue-50 focus:ring-blue-500 font-semibold"
                  >
                    <option value="">-- Elige el concepto --</option>
                    {conceptsForProvider.map(c => (
                      <option key={c.id} value={c.id}>{c.concept} ({c.unit_price} €/ud)</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-semibold mb-1">Nombre del Proveedor</label>
              <input type="text" disabled={editProvider !== "NEW" && editProvider !== ""} value={editProvider === "NEW" ? "" : editProvider} onChange={e=>setEditProvider(e.target.value)} className="w-full border rounded p-2.5 bg-slate-50 disabled:opacity-50" />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">Material / Concepto</label>
              <input type="text" disabled={!!editContractId} value={editMaterial} onChange={e=>setEditMaterial(e.target.value)} className="w-full border rounded p-2.5 bg-slate-50 disabled:opacity-50" />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">Cantidad / Medición</label>
              <input type="number" step="0.01" value={editQuantity} onChange={e=>{
                setEditQuantity(e.target.value);
                if (editContractId) {
                  const contract = contracts.find(c => c.id.toString() === editContractId);
                  if (contract) setEditCost((parseFloat(e.target.value || "0") * contract.unit_price).toFixed(2));
                }
              }} className="w-full border rounded p-2.5 bg-slate-50" />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">Coste Total (€)</label>
              <input type="number" step="0.01" value={editCost} onChange={e=>setEditCost(e.target.value)} className="w-full border rounded p-2.5 bg-slate-50 font-bold text-blue-700" />
            </div>
          </div>

          <div className="mb-6">
            <h3 className="font-bold border-b pb-2 mb-4">Reparto (Imputaciones)</h3>
            {editAllocations.map((alloc, idx) => {
              const chapterWus = workUnits.filter(wu => wu.chapter === alloc.chapter);
              return (
              <div key={idx} className="flex flex-col gap-2 mb-4 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="flex gap-2">
                  <select 
                    value={alloc.chapter} 
                    onChange={e => handleAllocationChange(idx, "chapter", e.target.value)}
                    className="flex-1 rounded-lg border-slate-300 shadow-sm border p-2 text-sm max-w-full font-semibold"
                  >
                    <option value="">-- Elige Capítulo --</option>
                    {uniqueChapters.map((ch, i) => (
                      <option key={i} value={ch as string}>Capítulo {ch as string}</option>
                    ))}
                  </select>
                  
                  <div className="w-24">
                    <div className="flex items-center border border-slate-300 rounded-lg bg-white overflow-hidden shadow-sm">
                      <input type="number" min="0" max="100" step="0.01" value={alloc.percentage} onChange={e => handleAllocationChange(idx, "percentage", e.target.value)} className="w-full p-2 outline-none font-bold text-center" />
                      <span className="pr-3 text-slate-400 font-bold">%</span>
                    </div>
                  </div>
                  <button type="button" onClick={() => handleRemoveAllocation(idx)} className="text-rose-500 font-bold px-2 text-xl hover:text-rose-700">×</button>
                </div>
                {alloc.chapter && (
                  <select 
                    value={alloc.work_unit_id} 
                    onChange={e => handleAllocationChange(idx, "work_unit_id", e.target.value)}
                    className="w-full border-slate-300 rounded-lg shadow-sm border p-2 text-sm bg-white"
                  >
                    <option value="">Selecciona Unidad de Obra...</option>
                    {chapterWus.map(wu => (
                      <option key={wu.id} value={wu.id}>{wu.code} - {wu.name}</option>
                    ))}
                  </select>
                )}
              </div>
            )})}
            <button type="button" onClick={handleAddAllocation} className="text-sm font-bold text-blue-600 hover:underline">+ Añadir Partida</button>
          </div>

          <div className="flex justify-end gap-4">
            <button onClick={() => setIsEditing(false)} className="px-6 py-2 rounded-lg font-bold text-slate-600 hover:bg-slate-100">Cancelar</button>
            <button onClick={handleSave} disabled={submitting} className="bg-slate-800 text-white font-bold px-6 py-2 rounded-lg hover:bg-slate-700 shadow-sm disabled:opacity-50">
              {submitting ? "Guardando..." : "Guardar Cambios"}
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-xl font-bold text-slate-800 mb-4 border-b pb-2">Cabecera del Albarán</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="block text-slate-500 font-semibold mb-1">Fecha</span>
                  <span className="font-bold text-slate-800 text-lg">{albaran.date}</span>
                </div>
                <div>
                  <span className="block text-slate-500 font-semibold mb-1">Estado Contractual</span>
                  {albaran.contract_id ? (
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      ✅ Bajo Contrato
                    </span>
                  ) : (
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                      ⚠️ Sin Contrato / Libre
                    </span>
                  )}
                </div>
                <div>
                  <span className="block text-slate-500 font-semibold mb-1">Proveedor / Subcontrata</span>
                  <span className="font-bold text-slate-800 text-lg">{albaran.provider}</span>
                </div>
                <div>
                  <span className="block text-slate-500 font-semibold mb-1">Material / Concepto</span>
                  <span className="font-bold text-slate-700">{albaran.material_description}</span>
                </div>
              </div>
            </div>
            
            <div className="bg-slate-800 rounded-xl shadow-sm border border-slate-700 p-6 flex flex-col justify-center items-center text-white text-center">
              <span className="block text-slate-300 font-semibold mb-2">Importe Total</span>
              <span className="text-4xl font-black">{albaran.total_cost.toLocaleString('es-ES')} €</span>
              <span className="block text-slate-400 font-semibold mt-2">({albaran.total_quantity} uds)</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-8">
            <div className="p-4 bg-slate-100 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-800">Reparto Económico (Imputaciones)</h2>
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase">
                  <th className="p-4 font-bold border-b">Código BC3</th>
                  <th className="p-4 font-bold border-b">Unidad de Obra</th>
                  <th className="p-4 font-bold border-b text-right">% Imputado</th>
                  <th className="p-4 font-bold border-b text-right">Coste Imputado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {albaran.allocations.length === 0 ? (
                  <tr><td colSpan={4} className="p-6 text-center text-slate-500 italic">No hay imputaciones. El gasto no afecta al proyecto.</td></tr>
                ) : (
                  albaran.allocations.map((alloc: any) => (
                    <tr key={alloc.id} className="hover:bg-slate-50">
                      <td className="p-4 font-bold text-slate-700">{alloc.work_unit_code}</td>
                      <td className="p-4 text-slate-600 font-medium">{alloc.work_unit_name}</td>
                      <td className="p-4 font-bold text-slate-700 text-right">{alloc.allocated_percentage}%</td>
                      <td className="p-4 font-black text-rose-600 text-right">{alloc.allocated_cost.toLocaleString('es-ES')} €</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center">
            <button onClick={handleDelete} className="bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 font-bold px-6 py-2 rounded-lg transition-colors shadow-sm">
              🗑️ Eliminar Albarán
            </button>
            <button onClick={enterEditMode} className="bg-blue-600 text-white hover:bg-blue-700 font-bold px-8 py-2 rounded-lg transition-colors shadow-sm text-lg">
              ✏️ Editar Albarán
            </button>
          </div>
        </>
      )}
    </div>
  );
}
