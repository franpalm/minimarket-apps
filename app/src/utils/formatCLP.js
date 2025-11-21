// utils/formatCLP.js

export function formatCLP(value) {
  // Formato personalizado: $ 10.000
  let formatted = new Intl.NumberFormat('es-CL', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
  // Reemplazar coma por punto para separador de miles
  formatted = formatted.replace(/,/g, '.');
  return `$ ${formatted}`;
}
