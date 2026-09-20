"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function EncargadoDashboard() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [workUnits, setWorkUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [contracts, setContracts] = useState<any[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>("");
  const [selectedContractId, setSelectedContractId] = useState<string>("");
  
  // Helpers para contratos
  const uniqueProviders = Array.from(new Set(contracts.map(c => c.provider)));
  const conceptsForProvider = contracts.filter(c => c.provider === selectedProvider);

  // Formulario Albarán
  const [provider, setProvider] = useState("");
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [allocations, setAllocations] = useState<{chapter: string, work_unit_id: string, percentage: string}[]>([
    {chapter: "", work_unit_id: "", percentage: "100"}
  ]);
  const [albaranMsg, setAlbaranMsg] = useState("");

  // Avance state
  const [avanceChapter, setAvanceChapter] = useState("");
  const [avanceWuId, setAvanceWuId] = useState("");
  const [avanceQty, setAvanceQty] = useState("");
  const [avanceNotes, setAvanceNotes] = useState("");
  const [avanceMsg, setAvanceMsg] = useState("");

  const handleProviderSelect = (prov: string) => {
    setSelectedProvider(prov);
    setSelectedContractId("");
    if (prov === "NEW") {
      setProvider("");
      setDescription("");
      setUnitPrice("");
    }
  };

  const handleContractSelect = (cId: string) => {
    setSelectedContractId(cId);
    if (cId) {
      const c = contracts.find(x => x.id.toString() === cId);
      if (c) {
        setProvider(c.provider);
        setDescription(c.concept);
        setUnitPrice(c.unit_price.toString());
      }
    } else {
      if (selectedProvider !== "NEW") {
        setProvider(selectedProvider);
      }
      setDescription("");
      setUnitPrice("");
    }
  };

  // Fecha compartida del parte
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) {
      router.push("/");
      return;
    }
    const user = JSON.parse(stored);
    setCurrentUser(user);

    Promise.all([
      fetch("/api/projects/1/work-units").then(res => res.json()),
      fetch("/api/projects/1/contracts").then(res => res.json())
    ])
    .then(([wuData, contractData]) => {
      setWorkUnits(wuData);
      setContracts(contractData);
      setLoading(false);
    })
    .catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, [router]);



  const handleAlbaranSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlbaranMsg("Procesando...");
    
    const qty = parseFloat(quantity) || 0;
    const price = parseFloat(unitPrice) || 0;
    const calculatedTotal = qty * price;

    const payload = {
      project_id: 1,
      contract_id: selectedContractId ? parseInt(selectedContractId) : null,
      date: currentDate,
      provider,
      material_description: description,
      total_quantity: qty || 1, // Previene división por 0 si no se ponen unidades
      total_cost: calculatedTotal,
      allocations: allocations.map(a => ({
        work_unit_id: parseInt(a.work_unit_id),
        allocated_quantity: 0,
        allocated_percentage: parseFloat(a.percentage)
      }))
    };
    try {
      const res = await fetch("/api/operations/delivery-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setAlbaranMsg("✅ Albarán registrado y coste repartido.");
        setSelectedContractId("");
        setProvider(""); setDescription(""); setQuantity(""); setUnitPrice("");
        setAllocations([{ work_unit_id: "", percentage: "100" }]);
      } else {
        setAlbaranMsg("❌ Error al registrar el albarán.");
      }
    } catch (error) {
      setAlbaranMsg("❌ Error de conexión.");
    }
  };

  const handleAvanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAvanceMsg("Procesando...");
    
    try {
      const payload = {
        work_unit_id: parseInt(avanceWuId),
        date: currentDate,
        executed_quantity: parseFloat(avanceQty) || 0,
        notes: avanceNotes
      };

      const res = await fetch("/api/operations/daily-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setAvanceMsg("¡Avance registrado correctamente!");
        setAvanceChapter("");
        setAvanceWuId("");
        setAvanceQty("");
        setAvanceNotes("");
      } else {
        setAvanceMsg("Error al registrar el avance.");
      }
    } catch (error) {
      setAvanceMsg("Error de red.");
    }
  };

  const uniqueChapters = Array.from(new Set(workUnits.map(wu => wu.chapter).filter(Boolean)));
  uniqueChapters.sort(); // Opcional, para que salgan en orden (C1, C2...)

  if (loading) return <div className="p-8 font-bold text-slate-500 animate-pulse">Cargando base de datos de tu obra...</div>;

  const wuOptions = workUnits.map(wu => (
    <option key={wu.id} value={wu.id}>{wu.code} - {wu.name.substring(0,50)}...</option>
  ));

  const handleLogout = () => {
    localStorage.removeItem("user");
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <header className="mb-8 border-b pb-4 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Panel de Producción</h1>
          <p className="text-slate-500">Registro diario a pie de obra | Hola, <span className="font-bold text-blue-600">{currentUser?.username}</span></p>
        </div>
        <div className="flex flex-col md:flex-row items-end md:items-center gap-3">
          <div className="flex items-center gap-3 bg-white px-4 py-3 rounded-xl border border-slate-200 shadow-sm">
            <label className="font-bold text-slate-700 text-sm">📅 Fecha del Parte:</label>
            <input 
              type="date" 
              required
              value={currentDate}
              onChange={(e) => setCurrentDate(e.target.value)}
              className="border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500 font-semibold text-slate-800 py-1" 
            />
          </div>
          <button onClick={handleLogout} className="bg-red-50 text-red-600 border border-red-200 px-4 py-3 rounded-xl hover:bg-red-100 font-bold shadow-sm">
            Cerrar Sesión
          </button>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* FORMULARIO DE ALBARANES */}
        <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center mb-6">
            <div className="bg-blue-100 p-3 rounded-lg mr-4 text-2xl">📦</div>
            <h2 className="text-xl font-bold text-slate-800">Registrar Albarán</h2>
          </div>
          
          <form onSubmit={handleAlbaranSubmit} className="space-y-5">
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Proveedor / Subcontrata (Contrato)</label>
                  <select 
                    value={selectedProvider} 
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
                
                {selectedProvider && selectedProvider !== "NEW" && (
                  <div className="pl-4 border-l-2 border-blue-400">
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Concepto Contratado</label>
                    <select 
                      value={selectedContractId} 
                      onChange={(e) => handleContractSelect(e.target.value)} 
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
                <label className="block text-sm font-semibold text-slate-700 mb-1">Nombre del Proveedor</label>
                <input required value={provider} onChange={e=>setProvider(e.target.value)} type="text" 
                  disabled={selectedProvider !== "NEW"}
                  className="w-full rounded-lg border-slate-300 shadow-sm border p-2.5 disabled:bg-slate-100 disabled:text-slate-500" 
                  placeholder="Ej: Hormigones del Sur S.A." />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Concepto / Material</label>
                <input required value={description} onChange={e=>setDescription(e.target.value)} type="text" 
                  disabled={!!selectedContractId}
                  className="w-full rounded-lg border-slate-300 shadow-sm border p-2.5 disabled:bg-slate-100 disabled:text-slate-500" 
                  placeholder="Ej: Hormigón HM-20" />
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Cantidad</label>
                  <input required value={quantity} onChange={e=>setQuantity(e.target.value)} type="number" step="0.01" 
                    className="w-full rounded-lg border-slate-300 shadow-sm border p-2.5" placeholder="Ej: 15" />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Precio Unitario (€)</label>
                  <input required value={unitPrice} onChange={e=>setUnitPrice(e.target.value)} type="number" step="0.01" 
                    disabled={!!selectedContractId}
                    className="w-full rounded-lg border-slate-300 shadow-sm border p-2.5 disabled:bg-slate-100 disabled:text-slate-500" 
                    placeholder="Ej: 60" />
                </div>
              </div>

            <div className="text-right text-sm text-slate-500 font-semibold mt-2">
              Coste Total Calculado: <span className="text-slate-800 text-lg">{((parseFloat(quantity)||0) * (parseFloat(unitPrice)||0)).toLocaleString('es-ES')} €</span>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Reparto a Unidades de Obra</label>
              {allocations.map((alloc, idx) => {
                const chapterWus = workUnits.filter(wu => wu.chapter === alloc.chapter);
                return (
                  <div key={idx} className="flex flex-col gap-2 mb-4 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="flex gap-2">
                      <select 
                        required 
                        value={alloc.chapter} 
                        onChange={e=>{
                          const newAlloc = [...allocations];
                          newAlloc[idx].chapter = e.target.value;
                          newAlloc[idx].work_unit_id = "";
                          setAllocations(newAlloc);
                        }} 
                        className="flex-1 rounded-lg border-slate-300 shadow-sm border p-2 text-sm max-w-full font-semibold"
                      >
                        <option value="">-- Elige Capítulo --</option>
                        {uniqueChapters.map((ch, i) => (
                          <option key={i} value={ch as string}>Capítulo {ch as string}</option>
                        ))}
                      </select>
                      
                      <input 
                        required 
                        type="number" 
                        step="0.01" 
                        max="100" 
                        min="0" 
                        value={alloc.percentage} 
                        onChange={e=>{
                          const newAlloc = [...allocations];
                          newAlloc[idx].percentage = e.target.value;
                          setAllocations(newAlloc);
                        }} 
                        placeholder="%" 
                        className="w-24 rounded-lg border-slate-300 shadow-sm border p-2 text-sm text-center font-bold" 
                        title="Porcentaje (%)" 
                      />
                    </div>
                    {alloc.chapter && (
                      <select 
                        required 
                        value={alloc.work_unit_id} 
                        onChange={e=>{
                          const newAlloc = [...allocations];
                          newAlloc[idx].work_unit_id = e.target.value;
                          setAllocations(newAlloc);
                        }} 
                        className="w-full rounded-lg border-slate-300 shadow-sm border p-2 text-sm bg-white"
                      >
                        <option value="">Selecciona unidad...</option>
                        {chapterWus.map(wu => (
                          <option key={wu.id} value={wu.id}>{wu.code} - {wu.name}</option>
                        ))}
                      </select>
                    )}
                  </div>
                );
              })}
              <button type="button" onClick={() => setAllocations([...allocations, {chapter: "", work_unit_id: "", percentage: "0"}])} className="text-blue-600 text-sm font-semibold hover:text-blue-800">
                + Añadir otro reparto
              </button>
            </div>

            {albaranMsg && <div className="p-3 bg-blue-50 border border-blue-100 text-sm font-bold text-blue-700 rounded-lg">{albaranMsg}</div>}
            
            <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3.5 px-4 rounded-lg hover:bg-blue-700 transition-colors shadow-md mt-2">
              Subir Albarán
            </button>
          </form>
        </section>

        {/* FORMULARIO DE PRODUCCIÓN */}
        <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center mb-6">
            <div className="bg-emerald-100 p-3 rounded-lg mr-4 text-2xl">🚧</div>
            <h2 className="text-xl font-bold text-slate-800">Avance de Obra (Producción)</h2>
          </div>

          <form onSubmit={handleAvanceSubmit} className="space-y-5">
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Capítulo</label>
                <select 
                  required 
                  value={avanceChapter} 
                  onChange={e => {
                    setAvanceChapter(e.target.value);
                    setAvanceWuId("");
                  }} 
                  className="w-full rounded-lg border-slate-300 shadow-sm border p-2.5 bg-emerald-50 font-semibold"
                >
                  <option value="">-- Elige un Capítulo --</option>
                  {uniqueChapters.map((ch, i) => (
                    <option key={i} value={ch as string}>Capítulo {ch as string}</option>
                  ))}
                </select>
              </div>
              
              {avanceChapter && (
                <div className="pl-4 border-l-2 border-emerald-400">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Unidad de Obra Ejecutada</label>
                  <select 
                    required 
                    value={avanceWuId} 
                    onChange={e => setAvanceWuId(e.target.value)} 
                    className="w-full rounded-lg border-slate-300 shadow-sm border p-2.5 bg-white"
                  >
                    <option value="">-- Selecciona unidad... --</option>
                    {workUnits.filter(wu => wu.chapter === avanceChapter).map(wu => (
                      <option key={wu.id} value={wu.id}>{wu.code} - {wu.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Medición Ejecutada Hoy</label>
              <div className="flex gap-3">
                <input required value={avanceQty} onChange={e=>setAvanceQty(e.target.value)} type="number" step="0.01" className="flex-1 rounded-lg border-slate-300 shadow-sm border p-2.5" placeholder="Ej: 20.5" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Notas / Observaciones</label>
              <textarea value={avanceNotes} onChange={e=>setAvanceNotes(e.target.value)} rows={3} className="w-full rounded-lg border-slate-300 shadow-sm border p-2.5" placeholder="Añade detalles si hubo problemas..."></textarea>
            </div>

            {avanceMsg && <div className="p-3 bg-emerald-50 border border-emerald-100 text-sm font-bold text-emerald-700 rounded-lg">{avanceMsg}</div>}

            <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-3.5 px-4 rounded-lg hover:bg-emerald-700 transition-colors shadow-md">
              Registrar Avance
            </button>
          </form>
        </section>

      </main>
    </div>
  );
}
