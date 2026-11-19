import { useState } from 'react';
import { pedidoService } from '../api/services.js';
import { Aviso, Cargando, EstadoPedido, Encabezado, ErrorApi, Vacio, useAccion, useApi } from '../components/ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { ESTADOS_PEDIDO, TERMINOS, dinero, hora } from '../utils/format.js';

/** Mesero/Admin: todos los pedidos con filtro por estado; entregar (LISTO -> ENTREGADO) y cancelar (DELETE). */
export default function PedidosPage() {
  const { usuario } = useAuth();
  const esMesero = usuario.rol === 'MESERO';
  const [estado, setEstado] = useState('');
  const lista = useApi(() => pedidoService.listar(estado || undefined), [estado], { intervalo: 10000 });
  const accion = useAccion();

  const entregar = async (p) => {
    await accion.ejecutar(() => pedidoService.cambiarEstado(p.id, 'ENTREGADO'), `Pedido #${p.id} entregado a la mesa ${p.idMesa}.`);
    lista.recargar();
  };
  const cancelar = async (p) => {
    if (!window.confirm(`¿Cancelar el pedido #${p.id}?`)) return;
    await accion.ejecutar(() => pedidoService.cancelar(p.id), `Pedido #${p.id} cancelado.`);
    lista.recargar();
  };

  const listos = (lista.data || []).filter((p) => p.estado === 'LISTO').length;

  return (
    <div className="pagina">
      <Encabezado
        titulo="Pedidos"
        subtitulo={listos ? `${listos} pedido(s) listos para llevar a la mesa.` : 'Flujo: Recibido → En preparación → Listo → Entregado.'}
      >
        <select value={estado} onChange={(e) => setEstado(e.target.value)}>
          <option value="">Todos los estados</option>
          {Object.entries(ESTADOS_PEDIDO).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </Encabezado>
      <ErrorApi error={accion.error || lista.error} onClose={() => accion.setError(null)} />
      <Aviso tipo="exito" onClose={() => accion.setExito(null)}>{accion.exito}</Aviso>

      <section className="panel">
        {lista.cargando && !lista.data ? (
          <Cargando />
        ) : !lista.data?.length ? (
          <Vacio>No hay pedidos {estado && `en estado ${ESTADOS_PEDIDO[estado]}`}.</Vacio>
        ) : (
          <table className="tabla">
            <thead>
              <tr><th>#</th><th>Mesa</th><th>Hora</th><th>Detalle</th><th>Total</th><th>Estado</th><th /></tr>
            </thead>
            <tbody>
              {lista.data.map((p) => (
                <tr key={p.id} className={p.estado === 'LISTO' ? 'fila-destacada' : ''}>
                  <td>{p.id}</td>
                  <td>{p.idMesa}</td>
                  <td>{hora(p.timestamp)}</td>
                  <td>
                    {p.items.map((i) => (
                      <div key={i.id} className="item-linea">
                        {i.cantidad}× {i.nombrePlato}
                        {i.terminoCoccion && <em> · {TERMINOS[i.terminoCoccion]}</em>}
                        {i.observaciones && <small> — {i.observaciones}</small>}
                      </div>
                    ))}
                  </td>
                  <td>{dinero(p.total)}</td>
                  <td><EstadoPedido estado={p.estado} /></td>
                  <td className="acciones">
                    {esMesero && p.estado === 'LISTO' && (
                      <button className="btn btn-primario btn-sm" onClick={() => entregar(p)}>Entregar</button>
                    )}
                    {p.estado === 'RECIBIDO' && (
                      <button className="btn btn-peligro btn-sm" onClick={() => cancelar(p)}>Cancelar</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
