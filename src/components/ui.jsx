import { useCallback, useEffect, useState } from 'react';
import { ESTADOS_PEDIDO } from '../utils/format.js';

/** Muestra el error de la API (mensaje + detalles de validacion) o un mensaje de exito. */
export function Aviso({ tipo = 'error', children, onClose }) {
  if (!children) return null;
  return (
    <div className={`aviso aviso-${tipo}`} role={tipo === 'error' ? 'alert' : 'status'}>
      <div>{children}</div>
      {onClose && (
        <button className="aviso-x" onClick={onClose} aria-label="Cerrar">
          ×
        </button>
      )}
    </div>
  );
}

export function ErrorApi({ error, onClose }) {
  if (!error) return null;
  return (
    <Aviso tipo="error" onClose={onClose}>
      <strong>{error.status ? `${error.status} · ` : ''}</strong>
      {error.message}
      {error.details?.length > 0 && (
        <ul className="aviso-detalles">
          {error.details.map((d) => (
            <li key={d}>{d}</li>
          ))}
        </ul>
      )}
    </Aviso>
  );
}

export function EstadoPedido({ estado }) {
  return <span className={`chip chip-${estado?.toLowerCase()}`}>{ESTADOS_PEDIDO[estado] || estado}</span>;
}

export function Chip({ tono = 'neutro', children }) {
  return <span className={`chip chip-${tono}`}>{children}</span>;
}

export function Cargando({ texto = 'Cargando…' }) {
  return <p className="cargando">{texto}</p>;
}

export function Vacio({ children }) {
  return <p className="vacio">{children}</p>;
}

export function Encabezado({ titulo, subtitulo, children }) {
  return (
    <div className="encabezado">
      <div>
        <h1>{titulo}</h1>
        {subtitulo && <p className="sub">{subtitulo}</p>}
      </div>
      {children && <div className="encabezado-acciones">{children}</div>}
    </div>
  );
}

/** Carga datos de la API con estado de carga/error y una funcion para recargar. */
export function useApi(fn, deps = [], { intervalo } = {}) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(true);

  const recargar = useCallback(async () => {
    try {
      const r = await fn();
      setData(r);
      setError(null);
    } catch (e) {
      setError(e);
    } finally {
      setCargando(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    setCargando(true);
    recargar();
    if (intervalo) {
      const t = setInterval(recargar, intervalo);
      return () => clearInterval(t);
    }
  }, [recargar, intervalo]);

  return { data, error, cargando, recargar, setError };
}

/** Ejecuta una accion (POST/PATCH/DELETE) manejando ocupado/error/exito. */
export function useAccion() {
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(null);

  const ejecutar = async (fn, mensajeExito) => {
    setOcupado(true);
    setError(null);
    setExito(null);
    try {
      const r = await fn();
      if (mensajeExito) setExito(typeof mensajeExito === 'function' ? mensajeExito(r) : mensajeExito);
      return r;
    } catch (e) {
      setError(e);
      return undefined;
    } finally {
      setOcupado(false);
    }
  };

  return { ocupado, error, exito, ejecutar, setError, setExito };
}
