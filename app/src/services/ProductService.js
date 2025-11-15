const API_URL = "http://localhost:8000/api/productos/";

export async function getProducts() {
  const response = await fetch(API_URL);
  return response.json();
}

export async function getProduct(id) {
  const response = await fetch(`${API_URL}${id}/`);
  return response.json();
}

export async function createProduct(data) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function updateProduct(id, data) {
  const response = await fetch(`${API_URL}${id}/`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function deleteProduct(id) {
  const response = await fetch(`${API_URL}${id}/`, {
    method: "DELETE" });
  return response.json();
}
