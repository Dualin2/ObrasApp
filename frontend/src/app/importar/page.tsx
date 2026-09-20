"use client";
import { useState } from "react";

export default function ImportarPresupuesto() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setMessage("");

    const formData = new FormData();
    formData.append("file", file);

    // Determinamos el endpoint según la extensión
    const isBC3 = file.name.toLowerCase().endsWith(".bc3");
    const endpoint = isBC3 
      ? "/api/projects/1/import-bc3" 
      : "/api/projects/1/import-excel";

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(data.message || "¡Presupuesto importado con éxito!");
      } else {
        setMessage("Error: " + (data.detail || "Ha fallado la importación."));
      }
    } catch (error) {
      setMessage("Error de conexión con el servidor.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8 flex items-center justify-center">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-lg w-full">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Importar Obra Nueva</h1>
        <p className="text-slate-500 mb-6">Sube tu archivo Excel (.xlsx) o formato FIEBDC-3 (.bc3) para cargar las unidades de obra base.</p>
        
        <form onSubmit={handleUpload} className="space-y-6">
          <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:bg-slate-50 transition-colors">
            <input 
              type="file" 
              accept=".xlsx, .xls, .bc3" 
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full text-slate-600 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
            />
          </div>

          {message && (
            <div className={`p-4 rounded-lg font-medium text-sm ${message.includes("Error") ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>
              {message}
            </div>
          )}

          <button 
            type="submit" 
            disabled={!file || loading}
            className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Procesando..." : "Subir e Importar"}
          </button>
        </form>

        <div className="mt-6 border-t pt-6 text-xs text-slate-500">
          <p className="font-bold mb-2 text-slate-700">⚠️ Instrucciones para Excel:</p>
          <p>El Excel debe contener al menos las siguientes columnas en la cabecera (sin importar el orden):</p>
          <ul className="list-disc pl-4 mt-2 space-y-1">
            <li><span className="font-bold text-slate-700">Codigo</span> (Ej: 01.01)</li>
            <li><span className="font-bold text-slate-700">Nombre</span> (Ej: Zapata hormigón...)</li>
            <li><span className="font-bold text-slate-700">Medicion</span> (Ej: 150.5)</li>
            <li><span className="font-bold text-slate-700">Precio Coste</span> (Ej: 60.00)</li>
            <li><span className="font-bold text-slate-700">Precio Venta</span> (Ej: 75.00)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
