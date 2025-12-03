import authFetch from '../utils/authFetch';
const API_URL = "http://localhost:8000/api/gastos/";

export async function getGastos() {
  const res = await authFetch(API_URL);
  if (!res.ok) throw new Error('No se pudo obtener los gastos');
  return await res.json();
}

export async function getGasto(id) {
  const res = await authFetch(`${API_URL}${id}/`);
  if (!res.ok) throw new Error('No se pudo obtener el gasto');
  return await res.json();
}

export async function createGasto(data) {
  const res = await authFetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('No se pudo crear el gasto');
  return await res.json();
}

export async function updateGasto(id, data) {
  const res = await authFetch(`${API_URL}${id}/`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('No se pudo actualizar el gasto');
  return await res.json();
}

export async function deleteGasto(id) {
  const res = await authFetch(`${API_URL}${id}/`, {
    method: "DELETE" });
  if (!res.ok) throw new Error('No se pudo eliminar el gasto');
  return await res.json();
}
