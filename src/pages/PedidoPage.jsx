import { useEffect, useState } from 'react';
import { menuService, mesaService, pedidoService } from '../api/services.js';
import { Aviso, Cargando, EstadoPedido, Encabezado, ErrorApi, Vacio, useAccion, useApi } from '../components/ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { CATEGORIAS, TERMINOS, dinero, hora } from '../utils/format.js';

const claveSeguimiento = (email) => `brasaviva.pedidos.${email}`;

/**
 * Cliente y mesero: armar un pedido desde la carta y confirmarlo (POST /api/v1/pedidos),
 * o agregar platos a un pedido que sigue en RECIBIDO (POST /api/v1/pedidos/{id}/items).
 */
export default function PedidoPage() {
  const { usuario } = useAuth();
  const esMesero = usuario.rol === 'MESERO';
  const menu = useApi(() => menuService.listar(), []);
  const mesas = useApi(() => (esMesero ? mesaService.listar() : Promise.resolve([])), [esMesero]);

  const [idMesa, setIdMesa] = useState('');
  const [carrito, setCarrito] = useState([]);
  const [destino, setDestino] = useState(null); // pedido existente al que se agregan platos
  const accion = useAccion();

  const [seguimiento, setSeguimiento] = useState(() =>
    JSON.parse(sessionStorage.getItem(claveSeguimiento(usuario.email)) || '[]')
  );
  const [pedidos, setPedidos] = useState({});

  const guardarSeguimiento = (ids) => {
    setSeguimiento(ids);
    sessionStorage.setItem(claveSeguimiento(usuario.email), JSON.stringify(ids));
  };

  const refrescarSeguimiento = async () => {
    const res = {};
    await Promise.all(
      seguimiento.map(async (id) => {
        try {
          res[id] = await pedidoService.obtener(id);
        } catch {
          /* ignorar pedidos que ya no existan */
        }
      })
    );
    setPedidos(res);
  };

  useEffect(() => {
    refrescarSeguimiento();
    const t = setInterval(refrescarSeguimiento, 10000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seguimiento.join(',')]);

  const agregar = (plato) =>
    setCarrito((c) => [
      ...c,
      {
        key: crypto.randomUUID(),
        idPlato: plato.id,
        nombre: plato.nombre,
        precio: plato.precio,
        categoria: plato.categoria,
        cantidad: 1,
        terminoCoccion: plato.categoria === 'CORTE' ? 'TRES_CUARTOS' : '',
        observaciones: '',
      },
    ]);
  const cambiar = (key, campo, valor) => setCarrito((c) => c.map((i) => (i.key === key ? { ...i, [campo]: valor } : i)));
  const quitar = (key) => setCarrito((c) => c.filter((i) => i.key !== key));
  const total = carrito.reduce((s, i) => s + i.precio * i.cantidad, 0);

  const aItem = (i) => ({
    idPlato: i.idPlato,
    cantidad: Number(i.cantidad),
    terminoCoccion: i.terminoCoccion || null,
    observaciones: i.observaciones.trim() || null,
  });

  const confirmar = async () => {
    if (destino) {
      const r = await accion.ejecutar(async () => {
        let ultimo;
        for (const i of carrito) ultimo = await pedidoService.agregarItem(destino.id, aItem(i));
        return ultimo;
      }, (p) => `Se agregaron los platos al pedido #${p.id}. Nuevo total: ${dinero(p.total)}`);
      if (r) {
        setCarrito([]);
        setDestino(null);
        refrescarSeguimiento();
      }
      return;
    }
    const r = await accion.ejecutar(
      () => pedidoService.crear({ idMesa: Number(idMesa), items: carrito.map(aItem) }),
      (p) => `Pedido #${p.id} enviado a cocina para la mesa ${p.idMesa}. Total: ${dinero(p.total)}`
    );
    if (r) {
      setCarrito([]);
      guardarSeguimiento([r.id, ...seguimiento.filter((x) => x !== r.id)].slice(0, 10));
    }
  };

  const grupos = Object.keys(CATEGORIAS)
    .map((c) => ({ c, items: (menu.data || []).filter((p) => p.categoria === c) }))
    .filter((g) => g.items.length);

  return (
    <div className="pagina">
      <Encabezado
        titulo={destino ? `Agregar platos al pedido #${destino.id}` : 'Hacer pedido'}
        subtitulo={
          destino
            ? 'Solo se puede mientras el pedido siga en RECIBIDO (aún no entra a la parrilla).'
            : 'Elige los platos; los cortes requieren término de cocción. La mesa debe tener una cuenta abierta.'
        }
      >
        {destino && (
          <button className="btn btn-ghost" onClick={() => setDestino(null)}>
            Volver a pedido nuevo
          </button>
        )}
      </Encabezado>

      <div className="dos-columnas">
        <section className="panel">
          <h2>Carta</h2>
          <ErrorApi error={menu.error} />
          {menu.cargando ? (
            <Cargando />
          ) : (
            grupos.map((g) => (
              <div key={g.c} className="carta-grupo">
                <h3>{CATEGORIAS[g.c]}</h3>
                {g.items.map((p) => (
                  <div key={p.id} className="carta-fila">
                    <div>
                      <strong>{p.nombre}</strong>
                      {p.descripcion && <small>{p.descripcion}</small>}
                    </div>
                    <span className="precio">{dinero(p.precio)}</span>
                    <button className="btn btn-sm btn-primario" onClick={() => agregar(p)} aria-label={`Agregar ${p.nombre}`}>
                      + Agregar
                    </button>
                  </div>
                ))}
              </div>
            ))
          )}
        </section>

        <aside className="panel carrito">
          <h2>Tu pedido</h2>
          {!destino && (
            <label>
              Mesa
              {esMesero ? (
                <select value={idMesa} onChange={(e) => setIdMesa(e.target.value)}>
                  <option value="">Selecciona una mesa…</option>
                  {(mesas.data || []).map((m) => (
                    <option key={m.id} value={m.id}>
                      Mesa {m.numero} · {m.capacidad} pers. {m.cuentaAbierta ? '· cuenta abierta' : '· sin cuenta'}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="number"
                  min="1"
                  placeholder="Número de tu mesa"
                  value={idMesa}
                  onChange={(e) => setIdMesa(e.target.value)}
                />
              )}
            </label>
          )}

          {carrito.length === 0 ? (
            <Vacio>Agrega platos desde la carta.</Vacio>
          ) : (
            <ul className="carrito-lista">
              {carrito.map((i) => (
                <li key={i.key}>
                  <div className="carrito-cab">
                    <strong>{i.nombre}</strong>
                    <span>{dinero(i.precio * i.cantidad)}</span>
                    <button className="btn-x" onClick={() => quitar(i.key)} aria-label="Quitar">×</button>
                  </div>
                  <div className="carrito-campos">
                    <label>
                      Cant.
                      <input type="number" min="1" max="20" value={i.cantidad} onChange={(e) => cambiar(i.key, 'cantidad', e.target.value)} />
                    </label>
                    {i.categoria === 'CORTE' && (
                      <label>
                        Término
                        <select value={i.terminoCoccion} onChange={(e) => cambiar(i.key, 'terminoCoccion', e.target.value)}>
                          {Object.entries(TERMINOS).map(([k, v]) => (
                            <option key={k} value={k}>{v}</option>
                          ))}
                        </select>
                      </label>
                    )}
                  </div>
                  <input
                    className="obs"
                    placeholder="Observaciones (opcional)"
                    maxLength={200}
                    value={i.observaciones}
                    onChange={(e) => cambiar(i.key, 'observaciones', e.target.value)}
                  />
                </li>
              ))}
            </ul>
          )}

          <div className="carrito-total">
            <span>Total estimado</span>
            <strong>{dinero(total)}</strong>
          </div>
          <ErrorApi error={accion.error} onClose={() => accion.setError(null)} />
          <Aviso tipo="exito" onClose={() => accion.setExito(null)}>{accion.exito}</Aviso>
          <button
            className="btn btn-primario btn-block"
            disabled={accion.ocupado || carrito.length === 0 || (!destino && !idMesa)}
            onClick={confirmar}
          >
            {accion.ocupado ? 'Enviando…' : destino ? 'Agregar al pedido' : 'Confirmar pedido'}
          </button>
          <small className="sub">El precio queda congelado al confirmar.</small>
        </aside>
      </div>

      {seguimiento.length > 0 && (
        <section className="panel">
          <div className="panel-cab">
            <h2>Seguimiento de mis pedidos</h2>
            <button className="btn btn-ghost btn-sm" onClick={refrescarSeguimiento}>Actualizar</button>
          </div>
          <table className="tabla">
            <thead>
              <tr>
                <th>Pedido</th>
                <th>Mesa</th>
                <th>Hora</th>
                <th>Platos</th>
                <th>Total</th>
                <th>Estado</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {seguimiento
                .filter((id) => pedidos[id])
                .map((id) => {
                  const p = pedidos[id];
                  return (
                    <tr key={id}>
                      <td>#{p.id}</td>
                      <td>{p.idMesa}</td>
                      <td>{hora(p.timestamp)}</td>
                      <td>{p.items.map((i) => `${i.cantidad}× ${i.nombrePlato}`).join(', ')}</td>
                      <td>{dinero(p.total)}</td>
                      <td><EstadoPedido estado={p.estado} /></td>
                      <td>
                        {p.estado === 'RECIBIDO' && (
                          <button className="btn btn-ghost btn-sm" onClick={() => { setDestino(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                            Agregar platos
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
