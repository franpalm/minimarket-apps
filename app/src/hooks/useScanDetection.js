// Hook para detectar escaneos de código de barras USB (emulación de teclado)
// Sensibilidad ajustable: scanInterval (ms entre teclas), bufferTimeout (ms para limpiar)
// Por defecto: scanInterval=50ms, bufferTimeout=500ms
// Si tu escáner es más lento/rápido, ajusta estos valores.
import { useEffect, useRef } from 'react';

export default function useScanDetection(onScan, {
  scanInterval = 50, // ms máximo entre teclas para considerar escaneo
  bufferTimeout = 500 // ms para limpiar buffer si no llega Enter
} = {}) {
  const buffer = useRef('');
  const lastTime = useRef(0);
  const timer = useRef(null);

  useEffect(() => {
    function isInputActive() {
      const el = document.activeElement;
      return el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA');
    }

    function handleKeyDown(e) {
      if (isInputActive()) return; // Ignora si el usuario está escribiendo
      const now = Date.now();
      // Si el tiempo entre teclas es mayor al intervalo, limpia el buffer
      if (now - lastTime.current > scanInterval) buffer.current = '';
      lastTime.current = now;
      // Si es Enter y hay buffer, dispara onScan
      if (e.key === 'Enter' || e.keyCode === 13) {
        if (buffer.current.length > 0) {
          onScan(buffer.current);
          buffer.current = '';
        }
        if (timer.current) clearTimeout(timer.current);
        return;
      }
      // Solo acumula caracteres alfanuméricos
      if (e.key.length === 1) buffer.current += e.key;
      // Reinicia el timer para limpiar el buffer si no llega Enter
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        buffer.current = '';
      }, bufferTimeout);
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (timer.current) clearTimeout(timer.current);
    };
  }, [onScan, scanInterval, bufferTimeout]);
}
