"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });

      if (res.ok) {
        const user = await res.json();
        localStorage.setItem("user", JSON.stringify(user));
        
        if (user.role === "encargado") {
          router.push("/encargado");
        } else {
          // master o jefe_obra
          router.push("/jefe-obra");
        }
      } else {
        setError("Usuario o contraseña incorrectos");
      }
    } catch (e) {
      setError("Error conectando con el servidor");
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-slate-800">🏗️ ObrasApp</h1>
          <p className="text-slate-500 mt-2">Introduce tus credenciales para acceder</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-6">
          {error && <div className="bg-red-50 text-red-700 p-3 rounded text-sm font-bold border border-red-200">{error}</div>}
          
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Usuario</label>
            <input 
              type="text" 
              className="w-full border border-slate-300 p-3 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none" 
              value={username} 
              onChange={e => setUsername(e.target.value)} 
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Contraseña</label>
            <input 
              type="password" 
              className="w-full border border-slate-300 p-3 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required
            />
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 shadow-md transition-colors">
            Entrar al Sistema
          </button>
        </form>
      </div>
    </div>
  );
}
