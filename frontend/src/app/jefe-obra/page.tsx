"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function JefeObraDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const router = useRouter();

  const fetchDashboard = async () => {
    try {
      const res = await fetch("/api/projects/1/dashboard");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) {
      router.push("/");
      return;
    }
    const user = JSON.parse(stored);
    if (user.role === "encargado") {
      router.push("/encargado");
      return;
    }
    setCurrentUser(user);
    fetchDashboard();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-8 flex items-center justify-center">
        <p className="text-slate-500 font-bold animate-pulse text-lg">Calculando desviaciones de la obra...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-50 p-8 flex items-center justify-center">
        <p className="text-red-500 font-bold">Error conectando con el servidor.</p>
      </div>
    );
  }

  const { kpis, top_deviations } = data;
  const rentabilidadProduccion = kpis.produccion_total > 0 ? ((kpis.margen_produccion / kpis.produccion_total) * 100).toFixed(1) : "0.0";
  const rentabilidadCertificacion = kpis.certificacion > 0 ? ((kpis.margen_certificacion / kpis.certificacion) * 100).toFixed(1) : "0.0";

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Panel del Jefe de Obra</h1>
          <p className="text-slate-500 font-medium">Control económico en tiempo real | Hola, <span className="font-bold text-blue-600">{currentUser?.username}</span></p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm font-bold items-center">
          {currentUser?.role === 'master' && (
            <Link href="/usuarios" className="bg-purple-100 border border-purple-300 text-purple-700 px-3 py-2 rounded-lg hover:bg-purple-200">
              Gestión Usuarios
            </Link>
          )}
          <Link href="/unidades" className="bg-white border border-slate-300 text-slate-700 px-3 py-2 rounded-lg hover:bg-slate-100">
            Unidades y Presupuesto
          </Link>
          <Link href="/certificacion" className="bg-white border border-slate-300 text-slate-700 px-3 py-2 rounded-lg hover:bg-slate-100">
            Venta (Certificación)
          </Link>
          <Link href="/contratos" className="bg-white border border-slate-300 text-slate-700 px-3 py-2 rounded-lg hover:bg-slate-100">
            Gestión Contratos
          </Link>
          <Link href="/albaranes" className="bg-white border border-slate-300 text-slate-700 px-3 py-2 rounded-lg hover:bg-slate-100">
            Ver Todos los Albaranes
          </Link>
          <Link href="/historico" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow-sm">
            Parte Diario
          </Link>
          <button onClick={handleLogout} className="bg-red-50 text-red-600 border border-red-200 px-3 py-2 rounded-lg hover:bg-red-100 ml-4">
            Cerrar Sesión
          </button>
        </div>
      </header>

      {/* ALERTAS */}
      {kpis.uncontracted_deliveries > 0 && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl mb-6 flex justify-between items-center shadow-sm">
          <div className="flex items-start">
            <div className="text-amber-500 font-black text-xl mr-3">⚠️</div>
            <div>
              <h3 className="font-bold text-amber-800">Hay {kpis.uncontracted_deliveries} albaranes sin contrato asociado</h3>
              <p className="text-sm text-amber-700 mt-1">
                El encargado ha introducido gastos que no pertenecen a ningún contrato o precio pactado previo. 
                Revisa los partes diarios para negociar o legalizar estos suministros.
              </p>
            </div>
          </div>
        </div>
      )}

      {kpis.unidades_pendientes_certificar > 0 && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-xl mb-8 flex justify-between items-center shadow-sm">
          <div className="flex items-start">
            <div className="text-red-500 font-black text-xl mr-3">🚨</div>
            <div>
              <h3 className="font-bold text-red-800">Tienes {kpis.unidades_pendientes_certificar} unidades pendientes de certificar al cliente</h3>
              <p className="text-sm text-red-700 mt-1">
                Hay unidades con producción ejecutada que aún no has certificado. En total estás dejando de facturar <strong>{kpis.importe_pendiente_certificar.toLocaleString('es-ES', { maximumFractionDigits: 2 })} €</strong>.
              </p>
            </div>
          </div>
          <Link href="/certificacion" className="ml-4 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-red-700 whitespace-nowrap">
            Ir a Certificar
          </Link>
        </div>
      )}

      {/* KPIS GLOBALES */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 relative group">
          <Link href="/certificacion" className="absolute top-4 right-4 bg-slate-100 p-1.5 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Actualizar Certificación">
            ✏️
          </Link>
          <h3 className="text-sm font-bold text-slate-500 uppercase">Venta (Certificación)</h3>
          <p className="text-3xl font-black text-blue-700 mt-2">{kpis.certificacion.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</p>
          <p className="text-sm text-slate-400 mt-1">Lo que se cobrará al cliente</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-sm font-bold text-slate-500 uppercase">Producción Ejecutada</h3>
          <p className="text-3xl font-black text-slate-800 mt-2">{kpis.produccion_total.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</p>
          <p className="text-sm text-slate-400 mt-1">Presupuestado global: {kpis.presupuesto_venta.toLocaleString('es-ES')} €</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-sm font-bold text-slate-500 uppercase">Coste Previsto (Objetivo)</h3>
          <p className="text-3xl font-black text-slate-600 mt-2">{kpis.coste_previsto.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</p>
          <p className="text-sm text-slate-400 mt-1">Para la medición ejecutada</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-sm font-bold text-slate-500 uppercase">Coste Real Imputado</h3>
          <p className="text-3xl font-black text-slate-800 mt-2">{kpis.coste_real_total.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</p>
          <p className={`text-sm mt-1 font-bold ${kpis.desviacion_coste < 0 ? 'text-red-500' : 'text-emerald-500'}`}>
            {kpis.desviacion_coste < 0 ? "⚠️ Sobrecoste de " : "✅ Ahorro de "}
            {Math.abs(kpis.desviacion_coste).toLocaleString('es-ES', { maximumFractionDigits: 2 })} € vs previsto
          </p>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* TABLA DE DESVIACIONES TOP */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-200 lg:col-span-2 overflow-hidden">
          <div className="p-4 bg-slate-800 text-white font-bold flex justify-between items-center">
            <span>📉 Top 5 Partidas con Desviación Económica</span>
            <span className="text-xs font-normal text-slate-300">Coste Real &gt; Coste Previsto (para la cantidad ejecutada)</span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-sm border-b">
                  <th className="p-4 font-bold">Unidad de Obra</th>
                  <th className="p-4 font-bold">Ejecutado</th>
                  <th className="p-4 font-bold text-blue-600">Venta</th>
                  <th className="p-4 font-bold">Coste Previsto</th>
                  <th className="p-4 font-bold">Coste Real</th>
                  <th className="p-4 font-bold">Desviación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {top_deviations.length === 0 ? (
                  <tr><td colSpan={6} className="p-6 text-center text-slate-500 italic">No hay datos de ejecución suficientes para calcular desviaciones.</td></tr>
                ) : (
                  top_deviations.map((dev: any) => (
                    <tr key={dev.id} className="hover:bg-slate-50">
                      <td className="p-4">
                        <p className="font-bold text-slate-800">{dev.code}</p>
                        <p className="text-xs text-slate-500 truncate max-w-xs">{dev.name}</p>
                      </td>
                      <td className="p-4 font-semibold text-slate-700">
                        {dev.executed_qty.toLocaleString('es-ES', { maximumFractionDigits: 2 })}
                      </td>
                      <td className="p-4 font-bold text-blue-700">
                        {dev.sale_value.toLocaleString('es-ES', { maximumFractionDigits: 2 })} €
                      </td>
                      <td className="p-4 font-semibold text-slate-600">
                        {dev.target_cost.toLocaleString('es-ES', { maximumFractionDigits: 2 })} €
                      </td>
                      <td className="p-4 font-black text-slate-800">
                        {dev.real_cost.toLocaleString('es-ES', { maximumFractionDigits: 2 })} €
                      </td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${dev.status === 'warning' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {dev.deviation > 0 ? '+' : ''}{dev.deviation.toLocaleString('es-ES', { maximumFractionDigits: 2 })} €
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* ANÁLISIS DE RENDIMIENTO */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col">
          <h2 className="text-lg font-bold text-slate-800 border-b pb-2 mb-4">Análisis Rápido</h2>
          
          <div className="flex-1 space-y-4">
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
              <h4 className="font-bold text-slate-700 text-sm mb-1">Estado General</h4>
              {kpis.desviacion_coste < 0 ? (
                <p className="text-sm text-slate-600">
                  La obra presenta un <strong className="text-red-600">sobrecoste operativo</strong>. Has gastado {Math.abs(kpis.desviacion_coste).toLocaleString('es-ES', {maximumFractionDigits: 0})} € más del coste previsto para lo que llevas producido. 
                  Revisa urgentemente las partidas con mayor desviación (rojas en la tabla).
                </p>
              ) : (
                <p className="text-sm text-slate-600">
                  La obra presenta un <strong className="text-emerald-600">ahorro operativo</strong> de {Math.abs(kpis.desviacion_coste).toLocaleString('es-ES', {maximumFractionDigits: 0})} € respecto a lo previsto para lo producido. ¡Buen trabajo!
                </p>
              )}
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mt-4">
              <h4 className="font-bold text-blue-800 text-sm mb-1">Rentabilidad de Producción</h4>
              <p className="text-sm text-blue-700">
                Tu margen de producción es de <strong>{kpis.margen_produccion.toLocaleString('es-ES', {maximumFractionDigits: 0})} €</strong> (Rentabilidad del {rentabilidadProduccion}%).
              </p>
            </div>

            <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100 mt-4">
              <h4 className="font-bold text-emerald-800 text-sm mb-1">Rentabilidad de Venta (Certificación)</h4>
              <p className="text-sm text-emerald-700">
                Tu margen real facturable es de <strong>{kpis.margen_certificacion.toLocaleString('es-ES', {maximumFractionDigits: 0})} €</strong> (Rentabilidad del {rentabilidadCertificacion}%).
              </p>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
