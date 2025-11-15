const API_URL = "http://localhost:8000/api/gastos/";

export async function getGastos() {
  const response = await fetch(API_URL);
  return response.json();
}

export async function getGasto(id) {
  const response = await fetch(`${API_URL}${id}/`);
  return response.json();
}

export async function createGasto(data) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function updateGasto(id, data) {
  const response = await fetch(`${API_URL}${id}/`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function deleteGasto(id) {
  const response = await fetch(`${API_URL}${id}/`, {
    method: "DELETE" });
  return response.json();
}
