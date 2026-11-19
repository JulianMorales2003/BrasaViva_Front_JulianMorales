import { pedidoService } from '../api/services.js';
import { Aviso, Encabezado, ErrorApi, useAccion, useApi } from '../components/ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { TERMINOS, hora, minutosDesde } from '../utils/format.js';

const COLUMNAS = [
  { estado: 'RECIBIDO', titulo: 'Por preparar', siguiente: 'EN_PREPARACION', boton: 'A la parrilla' },
  { estado: 'EN_PREPARACION', titulo: 'En la parrilla', siguiente: 'LISTO', boton: 'Marcar listo' },
  { estado: 'LISTO', titulo: 'Listos para servir', siguiente: null },
];

/**
 * Tablero de cocina: GET /pedidos/cocina (RECIBIDO + EN_PREPARACION en orden de llegada)
 * y GET /pedidos?estado=LISTO. Solo el parrillero mueve los pedidos (PermisosPedido).
 */
export default function CocinaPage() {
  const { usuario } = useAuth();
  const esParrillero = usuario.rol === 'PARRILLERO';
  const tablero = useApi(
    async () => {
      const [cocina, listos] = await Promise.all([pedidoService.cocina(), pedidoService.listar('LISTO')]);
      return [...cocina, ...listos];
    },
    [],
    { intervalo: 8000 }
  );
  const accion = useAccion();

  const mover = async (p, estado) => {
    await accion.ejecutar(() => pedidoService.cambiarEstado(p.id, estado));
    tablero.recargar();
  };

  return (
    <div className="pagina">
      <Encabezado titulo="Cocina" subtitulo="Orden de llegada. La parrilla tiene un máximo de cortes simultáneos; si está llena la API rechaza el cambio.">
        <button className="btn btn-ghost" onClick={tablero.recargar}>Actualizar</button>
      </Encabezado>
      <ErrorApi error={accion.error || tablero.error} onClose={() => accion.setError(null)} />
      <Aviso tipo="exito">{accion.exito}</Aviso>

      <div className="kanban">
        {COLUMNAS.map((col) => {
          const pedidos = (tablero.data || []).filter((p) => p.estado === col.estado);
          return (
            <section key={col.estado} className={`kanban-col col-${col.estado.toLowerCase()}`}>
              <h2>
                {col.titulo} <span className="contador">{pedidos.length}</span>
              </h2>
              {pedidos.length === 0 && <p className="vacio">—</p>}
              {pedidos.map((p) => {
                const min = minutosDesde(p.timestamp);
                return (
                  <article key={p.id} className="ticket">
                    <header>
                      <strong>Mesa {p.idMesa}</strong>
                      <span>#{p.id} · {hora(p.timestamp)}</span>
                    </header>
                    <ul>
                      {p.items.map((i) => (
                        <li key={i.id}>
                          <b>{i.cantidad}×</b> {i.nombrePlato}
                          {i.terminoCoccion && <span className="termino">{TERMINOS[i.terminoCoccion]}</span>}
                          {i.observaciones && <small>“{i.observaciones}”</small>}
                        </li>
                      ))}
                    </ul>
                    <footer>
                      <span className={min >= 25 ? 'tarde' : ''}>{min} min</span>
                      {esParrillero && col.siguiente && (
                        <button className="btn btn-primario btn-sm" disabled={accion.ocupado} onClick={() => mover(p, col.siguiente)}>
                          {col.boton}
                        </button>
                      )}
                    </footer>
                  </article>
                );
              })}
            </section>
          );
        })}
      </div>
    </div>
  );
}
