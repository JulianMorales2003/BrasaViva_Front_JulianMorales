import { useState } from 'react';
import { reporteService } from '../api/services.js';
import { Cargando, Encabezado, ErrorApi, Vacio, useApi } from '../components/ui.jsx';
import { CATEGORIAS, ESTADOS_PEDIDO, dinero, hoyISO } from '../utils/format.js';

/** Admin: resumen del dia, platos mas vendidos e ingresos por categoria en un rango. */
export default function ReportesPage() {
  const resumen = useApi(() => reporteService.resumen(), [], { intervalo: 30000 });
  const [top, setTop] = useState(5);
  const populares = useApi(() => reporteService.populares(top), [top]);
  const [rango, setRango] = useState(() => {
    const h = hoyISO();
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return { desde: d.toISOString().slice(0, 10), hasta: h };
  });
  const [consulta, setConsulta] = useState(rango);
  const ingresos = useApi(() => reporteService.ingresos(consulta.desde, consulta.hasta), [consulta.desde, consulta.hasta]);

  const r = resumen.data;
  const maxPop = Math.max(1, ...(populares.data || []).map((p) => p.cantidadVendida));
  const cats = Object.entries(ingresos.data?.ingresosPorCategoria || {}).sort((a, b) => b[1] - a[1]);
  const maxCat = Math.max(1, ...cats.map(([, v]) => v));

  return (
    <div className="pagina">
      <Encabezado titulo="Reportes" subtitulo="Inteligencia del negocio calculada en la API." />
      <ErrorApi error={resumen.error} />
      {r && (
        <div className="kpis">
          <div className="kpi"><span>Pedidos hoy</span><strong>{r.totalPedidos}</strong></div>
          <div className="kpi"><span>Ingresos hoy</span><strong>{dinero(r.ingresoTotal)}</strong></div>
          <div className="kpi"><span>Mesas con cuenta abierta</span><strong>{r.mesasConCuentaAbierta}</strong></div>
          <div className="kpi">
            <span>Por estado</span>
            <div className="mini-estados">
              {Object.entries(r.pedidosPorEstado || {}).map(([k, v]) => (
                <small key={k}>{ESTADOS_PEDIDO[k] || k}: <b>{v}</b></small>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="dos-columnas mitad">
        <section className="panel">
          <div className="panel-cab">
            <h2>Platos más vendidos</h2>
            <select value={top} onChange={(e) => setTop(Number(e.target.value))}>
              {[3, 5, 10].map((n) => <option key={n} value={n}>Top {n}</option>)}
            </select>
          </div>
          <ErrorApi error={populares.error} />
          {populares.cargando ? <Cargando /> : !populares.data?.length ? <Vacio>Aún no hay ventas.</Vacio> : (
            <ol className="barras">
              {populares.data.map((p) => (
                <li key={p.nombrePlato}>
                  <span className="barras-label">{p.nombrePlato}</span>
                  <div className="barras-pista"><div style={{ width: `${(p.cantidadVendida / maxPop) * 100}%` }} /></div>
                  <span className="barras-valor">{p.cantidadVendida}</span>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="panel">
          <h2>Ingresos por categoría</h2>
          <form className="fila-campos" onSubmit={(e) => { e.preventDefault(); setConsulta(rango); }}>
            <label>Desde<input type="date" value={rango.desde} onChange={(e) => setRango({ ...rango, desde: e.target.value })} required /></label>
            <label>Hasta<input type="date" value={rango.hasta} onChange={(e) => setRango({ ...rango, hasta: e.target.value })} required /></label>
            <button className="btn btn-primario">Consultar</button>
          </form>
          <ErrorApi error={ingresos.error} />
          {ingresos.cargando ? <Cargando /> : ingresos.data && (
            <>
              {cats.length === 0 ? <Vacio>Sin ingresos en el rango.</Vacio> : (
                <ol className="barras">
                  {cats.map(([k, v]) => (
                    <li key={k}>
                      <span className="barras-label">{CATEGORIAS[k] || k}</span>
                      <div className="barras-pista"><div style={{ width: `${(v / maxCat) * 100}%` }} /></div>
                      <span className="barras-valor">{dinero(v)}</span>
                    </li>
                  ))}
                </ol>
              )}
              <div className="carrito-total"><span>Total del rango</span><strong>{dinero(ingresos.data.total)}</strong></div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
