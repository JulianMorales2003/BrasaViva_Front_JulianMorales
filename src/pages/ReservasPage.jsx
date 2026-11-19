import { useState } from 'react';
import { reservaService } from '../api/services.js';
import { Aviso, Cargando, Chip, Encabezado, ErrorApi, Vacio, useAccion, useApi } from '../components/ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { aLocalDateTime, deLocalDateTime, fechaHora } from '../utils/format.js';

const TONO = { ACTIVA: 'ok', CANCELADA: 'mal', COMPLETADA: 'neutro' };

/** CRUD de reservas: crear, listar (filtro por cliente), reprogramar (PUT) y cancelar (DELETE). */
export default function ReservasPage() {
  const { usuario } = useAuth();
  const esCliente = usuario.rol === 'CLIENTE';
  const vacio = { idMesa: '', cliente: esCliente ? usuario.nombre : '', fechaHora: '', comensales: 2 };
  const [form, setForm] = useState(vacio);
  const [editando, setEditando] = useState(null);
  const [filtro, setFiltro] = useState(esCliente ? usuario.nombre : '');
  const lista = useApi(() => reservaService.listar(filtro || undefined), [filtro]);
  const accion = useAccion();
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const guardar = async (e) => {
    e.preventDefault();
    const dto = {
      idMesa: Number(form.idMesa),
      cliente: form.cliente.trim(),
      fechaHora: aLocalDateTime(form.fechaHora),
      comensales: Number(form.comensales),
    };
    const r = await accion.ejecutar(
      () => (editando ? reservaService.actualizar(editando, dto) : reservaService.crear(dto)),
      (x) => (editando ? `Reserva #${x.id} reprogramada.` : `Reserva #${x.id} creada para el ${fechaHora(x.fechaHora)}.`)
    );
    if (r) {
      setForm(vacio);
      setEditando(null);
      lista.recargar();
    }
  };

  const editar = (r) => {
    setEditando(r.id);
    setForm({ idMesa: r.idMesa, cliente: r.cliente, fechaHora: deLocalDateTime(r.fechaHora), comensales: r.comensales });
  };

  const cancelar = async (r) => {
    if (!window.confirm(`¿Cancelar la reserva #${r.id} de ${r.cliente}?`)) return;
    await accion.ejecutar(() => reservaService.cancelar(r.id), `Reserva #${r.id} cancelada.`);
    lista.recargar();
  };

  return (
    <div className="pagina">
      <Encabezado titulo="Reservas" subtitulo="Cada reserva bloquea la mesa por 2 horas. Los comensales no pueden superar la capacidad de la mesa." />
      <div className="dos-columnas angosta">
        <form className="panel" onSubmit={guardar}>
          <h2>{editando ? `Reprogramar reserva #${editando}` : 'Nueva reserva'}</h2>
          <label>
            Mesa
            <input type="number" min="1" value={form.idMesa} onChange={set('idMesa')} required />
          </label>
          <label>
            Nombre del cliente
            <input value={form.cliente} onChange={set('cliente')} required minLength={2} maxLength={80} />
          </label>
          <label>
            Fecha y hora
            <input type="datetime-local" value={form.fechaHora} onChange={set('fechaHora')} required />
          </label>
          <label>
            Comensales
            <input type="number" min="1" max="20" value={form.comensales} onChange={set('comensales')} required />
          </label>
          <ErrorApi error={accion.error} onClose={() => accion.setError(null)} />
          <Aviso tipo="exito" onClose={() => accion.setExito(null)}>{accion.exito}</Aviso>
          <div className="fila-botones">
            <button className="btn btn-primario" disabled={accion.ocupado}>
              {editando ? 'Guardar cambios' : 'Reservar'}
            </button>
            {editando && (
              <button type="button" className="btn btn-ghost" onClick={() => { setEditando(null); setForm(vacio); }}>
                Cancelar edición
              </button>
            )}
          </div>
        </form>

        <section className="panel">
          <div className="panel-cab">
            <h2>{esCliente ? 'Mis reservas' : 'Reservas'}</h2>
            <input className="buscar" placeholder="Filtrar por cliente…" value={filtro} onChange={(e) => setFiltro(e.target.value)} />
          </div>
          <ErrorApi error={lista.error} />
          {lista.cargando ? (
            <Cargando />
          ) : !lista.data?.length ? (
            <Vacio>No hay reservas.</Vacio>
          ) : (
            <table className="tabla">
              <thead>
                <tr><th>#</th><th>Cliente</th><th>Mesa</th><th>Fecha</th><th>Pers.</th><th>Estado</th><th /></tr>
              </thead>
              <tbody>
                {lista.data.map((r) => (
                  <tr key={r.id}>
                    <td>{r.id}</td>
                    <td>{r.cliente}</td>
                    <td>{r.idMesa}</td>
                    <td>{fechaHora(r.fechaHora)}</td>
                    <td>{r.comensales}</td>
                    <td><Chip tono={TONO[r.estado]}>{r.estado}</Chip></td>
                    <td className="acciones">
                      {r.estado === 'ACTIVA' && (
                        <>
                          <button className="btn btn-ghost btn-sm" onClick={() => editar(r)}>Editar</button>
                          <button className="btn btn-peligro btn-sm" onClick={() => cancelar(r)}>Cancelar</button>
                        </>
                      )}
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
