import authFetch from '../utils/authFetch';

const API_URL = 'http://localhost:8000/api/presupuesto-global/';

export async function getPresupuestoGlobal() {
  const res = await authFetch(API_URL);
  if (!res.ok) throw new Error('No se pudo obtener el presupuesto');
  const data = await res.json();
  return data.valor;
}

export async function setPresupuestoGlobal(valor) {
  const res = await authFetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ valor })
  });
  if (!res.ok) throw new Error('No se pudo guardar el presupuesto');
  return await res.json();
}
