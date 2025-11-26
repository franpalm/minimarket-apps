import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import authFetch from '../utils/authFetch';

function ConfirmModal({ open, onClose, onConfirm, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded shadow-lg min-w-[300px]">
        <h3 className="font-bold mb-2">{title}</h3>
        <div className="mb-4">{children}</div>
        <div className="flex gap-2 justify-end">
          <button className="px-4 py-1 bg-gray-300 rounded" onClick={onClose}>Cancelar</button>
          <button className="px-4 py-1 bg-red-600 text-white rounded" onClick={onConfirm}>Confirmar</button>
        </div>
      </div>
    </div>
  );
}

export default function UserManagementPage() {
  const { user } = useContext(AuthContext);
  const [usuarios, setUsuarios] = useState([]);
  const [form, setForm] = useState({ username: '', email: '', rol: 'usuario', activo: true });
  const [loading, setLoading] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [deleteUser, setDeleteUser] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [filterRol, setFilterRol] = useState('');
  const [filterActivo, setFilterActivo] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    if (user && user.rol === 'admin') {
      authFetch('/api/usuarios/')
        .then(res => res.json())
        .then(data => setUsuarios(data));
    }
  }, [user]);

  if (!user || user.rol !== 'admin') {
    return <div>No tienes acceso a esta sección.</div>;
  }


  // Filtros y paginación
  const filtered = usuarios.filter(u =>
    (!search || u.username.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())) &&
    (!filterRol || u.rol === filterRol) &&
    (!filterActivo || (filterActivo === 'true' ? u.activo : !u.activo))
  );
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(filtered.length / pageSize);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    await authFetch('/api/usuarios/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    setLoading(false);
    setForm({ username: '', email: '', rol: 'usuario', activo: true });
    fetch('/api/usuarios/')
      .then(res => res.json())
      .then(data => setUsuarios(data));
  };

  const handleEdit = user => {
    setEditUser(user);
    setForm({ ...user });
    setModalOpen(true);
  };

  const handleEditSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    await authFetch(`/api/usuarios/${editUser.id}/`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    setLoading(false);
    setEditUser(null);
    setModalOpen(false);
    fetch('/api/usuarios/')
      .then(res => res.json())
      .then(data => setUsuarios(data));
  };

  const handleDelete = user => {
    setDeleteUser(user);
    setModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setLoading(true);
    await authFetch(`/api/usuarios/${deleteUser.id}/`, { method: 'DELETE' });
    setLoading(false);
    setDeleteUser(null);
    setModalOpen(false);
    fetch('/api/usuarios/')
      .then(res => res.json())
      .then(data => setUsuarios(data));
  };

  // Mover la función handleForceRecovery fuera del render
  const handleForceRecovery = async (usuario) => {
    setLoading(true);
    const res = await authFetch(`/api/usuarios/${usuario.id}/forzar_recuperacion/`, { method: 'POST' });
    setLoading(false);
    if (res.ok) {
      alert(`Email de recuperación enviado a ${usuario.email}`);
    } else {
      alert('Error al enviar recuperación.');
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Gestión de Usuarios</h2>
      <form onSubmit={editUser ? handleEditSubmit : handleSubmit} className="mb-6 flex gap-4 flex-wrap">
        <input name="username" value={form.username} onChange={handleChange} placeholder="Usuario" className="border px-2 py-1" required />
        <input name="email" value={form.email} onChange={handleChange} placeholder="Email" className="border px-2 py-1" required />
        <select name="rol" value={form.rol} onChange={handleChange} className="border px-2 py-1">
          <option value="admin">Admin</option>
          <option value="usuario">Usuario</option>
          <option value="cajero">Cajero</option>
        </select>
        <select name="activo" value={form.activo} onChange={handleChange} className="border px-2 py-1">
          <option value={true}>Activo</option>
          <option value={false}>Inactivo</option>
        </select>
        <button type="submit" className="bg-blue-600 text-white px-4 py-1 rounded" disabled={loading}>{editUser ? 'Guardar cambios' : 'Crear'}</button>
        {editUser && <button type="button" className="bg-gray-400 text-white px-4 py-1 rounded" onClick={() => { setEditUser(null); setForm({ username: '', email: '', rol: 'usuario', activo: true }); }}>Cancelar edición</button>}
      </form>
      <div className="mb-4 flex gap-2">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar usuario/email" className="border px-2 py-1" />
        <select value={filterRol} onChange={e => setFilterRol(e.target.value)} className="border px-2 py-1">
          <option value="">Todos los roles</option>
          <option value="admin">Admin</option>
          <option value="usuario">Usuario</option>
          <option value="cajero">Cajero</option>
        </select>
        <select value={filterActivo} onChange={e => setFilterActivo(e.target.value)} className="border px-2 py-1">
          <option value="">Todos</option>
          <option value="true">Activos</option>
          <option value="false">Inactivos</option>
        </select>
      </div>
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th>Usuario</th>
            <th>Email</th>
            <th>Rol</th>
            <th>Activo</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {paginated.map(u => (
            <tr key={u.id} className="border-t">
              <td>{u.username}</td>
              <td>{u.email}</td>
              <td>{u.rol}</td>
              <td>{u.activo ? 'Sí' : 'No'}</td>
              <td>
                <button className="px-2 py-1 bg-yellow-400 rounded mr-2" onClick={() => handleEdit(u)}>Editar</button>
                <button className="px-2 py-1 bg-red-600 text-white rounded mr-2" onClick={() => handleDelete(u)}>Eliminar</button>
                <button className="px-2 py-1 bg-blue-500 text-white rounded" onClick={() => handleForceRecovery(u)}>Enviar recuperación</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex gap-2 mt-4 justify-center">
        {Array.from({ length: totalPages }, (_, i) => (
          <button key={i} className={`px-3 py-1 rounded ${page === i + 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`} onClick={() => setPage(i + 1)}>{i + 1}</button>
        ))}
      </div>
      {/* Modal de confirmación para eliminar usuario */}
      <ConfirmModal
        open={!!deleteUser && modalOpen}
        onClose={() => { setDeleteUser(null); setModalOpen(false); }}
        onConfirm={handleDeleteConfirm}
        title="¿Eliminar usuario?"
      >
        ¿Estás seguro que deseas eliminar al usuario <b>{deleteUser?.username}</b>?
      </ConfirmModal>
      {/* Modal de edición (reutiliza el formulario arriba) */}
    </div>
  );
}
