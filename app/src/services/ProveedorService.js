const API_URL = "http://localhost:8000/api/proveedores/";

export async function getProveedores() {
  const response = await fetch(API_URL);
  return response.json();
}

export async function getProveedor(id) {
  const response = await fetch(`${API_URL}${id}/`);
  return response.json();
}

export async function createProveedor(data) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function updateProveedor(id, data) {
  const response = await fetch(`${API_URL}${id}/`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function deleteProveedor(id) {
  const response = await fetch(`${API_URL}${id}/`, {
    method: "DELETE" });
  return response.json();
}
