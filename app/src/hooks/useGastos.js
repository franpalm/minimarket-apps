import { useState, useEffect } from "react";
import { getGastos } from "../services/GastoService";

export function useGastos() {
  const [gastos, setGastos] = useState([]);
  useEffect(() => {
    getGastos().then(setGastos);
  }, []);
  return gastos;
}
