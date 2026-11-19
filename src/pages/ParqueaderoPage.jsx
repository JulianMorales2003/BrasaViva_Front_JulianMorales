import { useState } from 'react';
import { parqueaderoService } from '../api/services.js';
import { Aviso, Cargando, Encabezado, ErrorApi, Vacio, useAccion, useApi } from '../components/ui.jsx';
import { dinero, hora, minutosDesde } from '../utils/format.js';

/** Parqueadero: cupos, entrada por placa y salida con cobro por hora o fraccion. */
export default function ParqueaderoPage() {
  const datos = useApi(
    async () => {
      const [disp, activos] = await Promise.all([parqueaderoService.disponibilidad(), parqueaderoService.activos()]);
      return { disp, activos };
    },
    [],
    { intervalo: 20000 }
  );
  const accion = useAccion();
  const [placa, setPlaca] = useState('');
  const [salida, setSalida] = useState(null);

  const entrar = async (e) => {
    e.preventDefault();
    const r = await accion.ejecutar(() => parqueaderoService.entrada(placa.trim().toUpperCase()), (x) => `Entrada registrada: ${x.placa}.`);
    if (r) {
      setPlaca('');
      datos.recargar();
    }
  };

  const salir = async (v) => {
    const r = await accion.ejecutar(() => parqueaderoService.salida(v.placa));
    if (r) {
      setSalida(r);
      datos.recargar();
    }
  };

  const d = datos.data?.disp;
  const pct = d ? Math.round((d.ocupados / d.capacidad) * 100) : 0;

  return (
    <div className="pagina">
      <Encabezado titulo="Parqueadero" subtitulo="Cobro por hora o fracción. Placas: ABC123 (carro) o ABC12D (moto)." />
      <ErrorApi error={accion.error || datos.error} onClose={() => accion.setError(null)} />
      <Aviso tipo="exito" onClose={() => accion.setExito(null)}>{accion.exito}</Aviso>

      {d && (
        <div className="kpis">
          <div className="kpi"><span>Capacidad</span><strong>{d.capacidad}</strong></div>
          <div className="kpi"><span>Ocupados</span><strong>{d.ocupados}</strong></div>
          <div className="kpi"><span>Disponibles</span><strong className={d.disponibles === 0 ? 'texto-error' : ''}>{d.disponibles}</strong></div>
          <div className="kpi kpi-barra">
            <span>Ocupación {pct}%</span>
            <div className="barra"><div style={{ width: `${pct}%` }} /></div>
          </div>
        </div>
      )}

      <div className="dos-columnas angosta">
        <div>
          <form className="panel" onSubmit={entrar}>
            <h2>Registrar entrada</h2>
            <label>
              Placa
              <input
                className="placa"
                value={placa}
                onChange={(e) => setPlaca(e.target.value.toUpperCase())}
                placeholder="ABC123"
                maxLength={6}
                pattern="[A-Za-z]{3}[0-9]{2}[0-9A-Za-z]"
                title="ABC123 (carro) o ABC12D (moto)"
                required
              />
            </label>
            <button className="btn btn-primario btn-block" disabled={accion.ocupado}>Registrar entrada</button>
          </form>
          {salida && (
            <div className="panel recibo">
              <h3>Salida {salida.placa}</h3>
              <dl>
                <dt>Entrada</dt><dd>{hora(salida.entrada)}</dd>
                <dt>Salida</dt><dd>{hora(salida.salida)}</dd>
                <dt>Cobro</dt><dd className="destacado">{dinero(salida.cobro)}</dd>
              </dl>
            </div>
          )}
        </div>

        <section className="panel">
          <h2>Vehículos dentro</h2>
          {datos.cargando && !datos.data ? (
            <Cargando />
          ) : !datos.data?.activos.length ? (
            <Vacio>No hay vehículos en el parqueadero.</Vacio>
          ) : (
            <table className="tabla">
              <thead><tr><th>Placa</th><th>Entrada</th><th>Tiempo</th><th /></tr></thead>
              <tbody>
                {datos.data.activos.map((v) => (
                  <tr key={v.id}>
                    <td><span className="placa-chip">{v.placa}</span></td>
                    <td>{hora(v.entrada)}</td>
                    <td>{minutosDesde(v.entrada)} min</td>
                    <td className="acciones">
                      <button className="btn btn-ghost btn-sm" onClick={() => salir(v)} disabled={accion.ocupado}>Registrar salida</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </div>
  );
}
