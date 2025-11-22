const API_URL = "http://localhost:8000/api/categorias-gasto/";

export async function getCategories() {
  const response = await fetch(API_URL);
  return response.json();
}

export async function getCategory(id) {
  const response = await fetch(`${API_URL}${id}/`);
  return response.json();
}

export async function createCategory(data) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function updateCategory(id, data) {
  const response = await fetch(`${API_URL}${id}/`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function deleteCategory(id) {
  const response = await fetch(`${API_URL}${id}/`, {
    method: "DELETE" });
  return response.json();
}
