import { useEffect, useState } from 'react';
import { cuentaService, mesaService, pedidoService } from '../api/services.js';
import { Aviso, Cargando, Chip, EstadoPedido, Encabezado, ErrorApi, Vacio, useAccion, useApi } from '../components/ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { TERMINOS, dinero, fechaHora, hora } from '../utils/format.js';

const TONO_MESA = { DISPONIBLE: 'ok', OCUPADA: 'fuego', RESERVADA: 'aviso' };

/**
 * Salon: estado de las mesas, apertura de cuenta (mesero), detalle de cuenta con pedidos
 * y cobro (POST /cuentas/{id}/pago). El admin puede crear mesas y consultar cuentas.
 */
export default function SalonPage() {
  const { usuario } = useAuth();
  const esMesero = usuario.rol === 'MESERO';
  const esAdmin = usuario.rol === 'ADMIN';
  const [filtro, setFiltro] = useState('');
  const mesas = useApi(() => mesaService.listar(filtro || undefined), [filtro], { intervalo: 15000 });
  const [sel, setSel] = useState(null);
  const accion = useAccion();
  const [nueva, setNueva] = useState({ numero: '', capacidad: 4 });

  const abrirCuenta = async (m) => {
    const r = await accion.ejecutar(() => cuentaService.abrir(m.id), `Cuenta abierta en la mesa ${m.numero}.`);
    if (r) {
      await mesas.recargar();
      setSel(m.id);
    }
  };

  const crearMesa = async (e) => {
    e.preventDefault();
    const r = await accion.ejecutar(
      () => mesaService.crear({ numero: Number(nueva.numero), capacidad: Number(nueva.capacidad) }),
      (x) => `Mesa ${x.numero} creada.`
    );
    if (r) {
      setNueva({ numero: '', capacidad: 4 });
      mesas.recargar();
    }
  };

  const mesaSel = mesas.data?.find((m) => m.id === sel);

  return (
    <div className="pagina">
      <Encabezado titulo="Salón y cuentas" subtitulo="Una sola cuenta abierta por mesa. Para cobrar, todos los pedidos deben estar entregados.">
        <select value={filtro} onChange={(e) => setFiltro(e.target.value)}>
          <option value="">Todas las mesas</option>
          <option value="DISPONIBLE">Disponibles</option>
          <option value="OCUPADA">Ocupadas</option>
          <option value="RESERVADA">Reservadas</option>
        </select>
      </Encabezado>

      <ErrorApi error={accion.error} onClose={() => accion.setError(null)} />
      <Aviso tipo="exito" onClose={() => accion.setExito(null)}>{accion.exito}</Aviso>
      <ErrorApi error={mesas.error} />

      <div className="dos-columnas">
        <section>
          {mesas.cargando && !mesas.data ? (
            <Cargando />
          ) : !mesas.data?.length ? (
            <Vacio>No hay mesas.</Vacio>
          ) : (
            <div className="mesas">
              {mesas.data.map((m) => (
                <button
                  key={m.id}
                  className={`mesa mesa-${m.estado.toLowerCase()} ${sel === m.id ? 'sel' : ''}`}
                  onClick={() => setSel(m.id)}
                >
                  <span className="mesa-num">{m.numero}</span>
                  <span className="mesa-cap">{m.capacidad} personas</span>
                  <Chip tono={TONO_MESA[m.estado]}>{m.estado}</Chip>
                  {m.cuentaAbierta && <span className="mesa-cuenta">● Cuenta abierta</span>}
                </button>
              ))}
            </div>
          )}

          {esAdmin && (
            <form className="panel" onSubmit={crearMesa}>
              <h2>Crear mesa</h2>
              <div className="fila-campos">
                <label>
                  Número
                  <input type="number" min="1" value={nueva.numero} onChange={(e) => setNueva({ ...nueva, numero: e.target.value })} required />
                </label>
                <label>
                  Capacidad
                  <input type="number" min="1" max="20" value={nueva.capacidad} onChange={(e) => setNueva({ ...nueva, capacidad: e.target.value })} required />
                </label>
                <button className="btn btn-primario" disabled={accion.ocupado}>Crear</button>
              </div>
            </form>
          )}
        </section>

        <aside className="panel">
          {!mesaSel ? (
            <Vacio>Selecciona una mesa para ver su cuenta.</Vacio>
          ) : (
            <DetalleMesa
              key={mesaSel.id}
              mesa={mesaSel}
              esMesero={esMesero}
              onAbrir={() => abrirCuenta(mesaSel)}
              onCerrada={mesas.recargar}
              ocupado={accion.ocupado}
            />
          )}
        </aside>
      </div>
    </div>
  );
}

function DetalleMesa({ mesa, esMesero, onAbrir, onCerrada, ocupado }) {
  const [cuenta, setCuenta] = useState(null);
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [pago, setPago] = useState({ medioPago: 'EFECTIVO', montoRecibido: '' });
  const [recibo, setRecibo] = useState(null);
  const accion = useAccion();

  const cargar = async () => {
    setCargando(true);
    try {
      if (mesa.cuentaAbierta) {
        const [c, p] = await Promise.all([cuentaService.abiertaPorMesa(mesa.id), pedidoService.activosPorMesa(mesa.id)]);
        setCuenta(c);
        setPedidos(p);
        setRecibo(null);
        setPago((x) => ({ ...x, montoRecibido: x.montoRecibido || c.total }));
      } else {
        setCuenta(null);
        setPedidos([]);
      }
    } catch (e) {
      accion.setError(e);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mesa.id, mesa.cuentaAbierta]);

  const entregar = async (p) => {
    await accion.ejecutar(() => pedidoService.cambiarEstado(p.id, 'ENTREGADO'), `Pedido #${p.id} entregado.`);
    cargar();
  };

  const pagar = async (e) => {
    e.preventDefault();
    const r = await accion.ejecutar(() => cuentaService.pagar(cuenta.id, pago.medioPago, Number(pago.montoRecibido)));
    if (r) {
      setRecibo(r);
      onCerrada();
    }
  };

  const pendientes = pedidos.filter((p) => p.estado !== 'ENTREGADO' && p.estado !== 'CANCELADO').length;

  return (
    <div className="detalle-mesa">
      <h2>Mesa {mesa.numero}</h2>
      <p className="sub">{mesa.capacidad} personas · {mesa.estado}</p>
      <ErrorApi error={accion.error} onClose={() => accion.setError(null)} />
      <Aviso tipo="exito" onClose={() => accion.setExito(null)}>{accion.exito}</Aviso>

      {recibo && (
        <div className="recibo">
          <h3>Pago registrado ✓</h3>
          <dl>
            <dt>Cuenta</dt><dd>#{recibo.id}</dd>
            <dt>Total</dt><dd>{dinero(recibo.total)}</dd>
            <dt>Medio</dt><dd>{recibo.medioPago}</dd>
            <dt>Recibido</dt><dd>{dinero(recibo.montoRecibido)}</dd>
            <dt>Cambio</dt><dd className="destacado">{dinero(recibo.cambio)}</dd>
            <dt>Cierre</dt><dd>{fechaHora(recibo.fechaCierre)}</dd>
          </dl>
        </div>
      )}

      {cargando ? (
        <Cargando />
      ) : !cuenta ? (
        !recibo && (
          <>
            <Vacio>Esta mesa no tiene cuenta abierta.</Vacio>
            {esMesero && (
              <button className="btn btn-primario btn-block" onClick={onAbrir} disabled={ocupado}>
                Abrir cuenta
              </button>
            )}
          </>
        )
      ) : (
        <>
          <div className="cuenta-cab">
            <span>Cuenta #{cuenta.id} · abierta {hora(cuenta.fechaApertura)}</span>
            <strong>{dinero(cuenta.total)}</strong>
          </div>
          {pedidos.length === 0 ? (
            <Vacio>Sin pedidos todavía.</Vacio>
          ) : (
            <ul className="pedidos-mesa">
              {pedidos.map((p) => (
                <li key={p.id}>
                  <div className="pm-cab">
                    <span>Pedido #{p.id} · {hora(p.timestamp)}</span>
                    <EstadoPedido estado={p.estado} />
                  </div>
                  <ul>
                    {p.items.map((i) => (
                      <li key={i.id}>
                        {i.cantidad}× {i.nombrePlato}
                        {i.terminoCoccion && ` (${TERMINOS[i.terminoCoccion]})`}
                        <span>{dinero(i.subtotal)}</span>
                      </li>
                    ))}
                  </ul>
                  {esMesero && p.estado === 'LISTO' && (
                    <button className="btn btn-primario btn-sm" onClick={() => entregar(p)}>Marcar entregado</button>
                  )}
                </li>
              ))}
            </ul>
          )}

          {esMesero && (
            <form className="pago" onSubmit={pagar}>
              <h3>Cobrar y cerrar cuenta</h3>
              {pendientes > 0 && <p className="texto-aviso">Hay {pendientes} pedido(s) sin entregar: la API no dejará cerrar la cuenta.</p>}
              <div className="fila-campos">
                <label>
                  Medio de pago
                  <select value={pago.medioPago} onChange={(e) => setPago({ ...pago, medioPago: e.target.value })}>
                    <option value="EFECTIVO">Efectivo</option>
                    <option value="TARJETA">Tarjeta</option>
                  </select>
                </label>
                <label>
                  Monto recibido
                  <input type="number" min="0.01" step="any" value={pago.montoRecibido} onChange={(e) => setPago({ ...pago, montoRecibido: e.target.value })} required />
                </label>
              </div>
              <button className="btn btn-primario btn-block" disabled={accion.ocupado}>Registrar pago</button>
            </form>
          )}
        </>
      )}
    </div>
  );
}
