"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function UsuariosPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("encargado");
  const router = useRouter();

  useEffect(() => {
    // Basic auth check
    const stored = localStorage.getItem("user");
    if (!stored) {
      router.push("/");
      return;
    }
    const user = JSON.parse(stored);
    if (user.role !== "master") {
      alert("Solo el usuario master puede gestionar usuarios");
      router.push("/jefe-obra");
      return;
    }

    fetchUsers();
  }, [router]);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        setUsers(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername || !newPassword) return;

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: newUsername, password: newPassword, role: newRole })
      });
      if (res.ok) {
        setNewUsername("");
        setNewPassword("");
        fetchUsers();
      } else {
        const error = await res.json();
        alert(error.detail || "Error al crear usuario");
      }
    } catch (e) {
      alert("Error de red");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Seguro que quieres borrar este usuario?")) return;
    try {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchUsers();
      } else {
        const error = await res.json();
        alert(error.detail || "Error al borrar");
      }
    } catch (e) {
      alert("Error de red");
    }
  };

  if (loading) return <div className="p-8">Cargando...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Gestión de Usuarios</h1>
          <p className="text-slate-500 font-medium">Panel exclusivo para el Máster</p>
        </div>
        <Link href="/jefe-obra" className="bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-700">
          Volver al Dashboard
        </Link>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-bold text-slate-800 mb-4">Crear Nuevo Usuario</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Nombre de usuario</label>
              <input type="text" value={newUsername} onChange={e => setNewUsername(e.target.value)} className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" required />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Contraseña</label>
              <input type="text" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" required />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Rol</label>
              <select value={newRole} onChange={e => setNewRole(e.target.value)} className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                <option value="encargado">Encargado (Solo puede meter partes y albaranes)</option>
                <option value="jefe_obra">Jefe de Obra (Dashboard y gestión económica)</option>
                <option value="master">Máster (Jefe de Obra + Crear Usuarios)</option>
              </select>
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white font-bold py-2 rounded shadow hover:bg-blue-700">Crear Usuario</button>
          </form>
        </div>

        <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-slate-100 p-4 border-b">
            <h2 className="font-bold text-slate-800">Usuarios Activos</h2>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-sm">
                <th className="p-4 font-bold border-b">ID</th>
                <th className="p-4 font-bold border-b">Usuario</th>
                <th className="p-4 font-bold border-b">Rol</th>
                <th className="p-4 font-bold border-b text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="p-4 text-slate-500">{u.id}</td>
                  <td className="p-4 font-bold text-slate-800">{u.username}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${u.role === 'master' ? 'bg-purple-100 text-purple-700' : u.role === 'jefe_obra' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'}`}>
                      {u.role.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    {u.username !== 'master' && (
                      <button onClick={() => handleDelete(u.id)} className="text-red-500 font-bold hover:text-red-700 bg-red-50 px-3 py-1 rounded">Borrar</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
