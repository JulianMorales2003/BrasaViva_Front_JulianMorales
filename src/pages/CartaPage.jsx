import { useState } from 'react';
import { platoService } from '../api/services.js';
import { Aviso, Cargando, Chip, Encabezado, ErrorApi, useAccion, useApi } from '../components/ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { CATEGORIAS, dinero } from '../utils/format.js';

const VACIO = { nombre: '', precio: '', categoria: 'CORTE', descripcion: '', tiempoPreparacionMin: 15 };

/**
 * Carta interna (GET /platos, incluye agotados).
 * Parrillero/Admin: marcar disponible/agotado. Admin: crear, editar y eliminar platos.
 */
export default function CartaPage() {
  const { usuario } = useAuth();
  const esAdmin = usuario.rol === 'ADMIN';
  const puedeAgotar = ['PARRILLERO', 'ADMIN'].includes(usuario.rol);
  const platos = useApi(() => platoService.listar(), []);
  const accion = useAccion();
  const [form, setForm] = useState(VACIO);
  const [editando, setEditando] = useState(null);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const toggle = async (p) => {
    await accion.ejecutar(
      () => platoService.cambiarDisponibilidad(p.id, !p.disponible),
      `${p.nombre} ahora está ${p.disponible ? 'AGOTADO' : 'DISPONIBLE'}.`
    );
    platos.recargar();
  };

  const guardar = async (e) => {
    e.preventDefault();
    const dto = {
      nombre: form.nombre.trim(),
      precio: Number(form.precio),
      categoria: form.categoria,
      descripcion: form.descripcion.trim() || null,
      tiempoPreparacionMin: Number(form.tiempoPreparacionMin),
    };
    const r = await accion.ejecutar(
      () => (editando ? platoService.actualizar(editando, dto) : platoService.crear(dto)),
      (x) => `Plato "${x.nombre}" ${editando ? 'actualizado' : 'creado'}.`
    );
    if (r) {
      setForm(VACIO);
      setEditando(null);
      platos.recargar();
    }
  };

  const eliminar = async (p) => {
    if (!window.confirm(`¿Eliminar "${p.nombre}" de la carta?`)) return;
    await accion.ejecutar(() => platoService.eliminar(p.id), `"${p.nombre}" eliminado.`);
    platos.recargar();
  };

  const editar = (p) => {
    setEditando(p.id);
    setForm({
      nombre: p.nombre,
      precio: p.precio,
      categoria: p.categoria,
      descripcion: p.descripcion || '',
      tiempoPreparacionMin: p.tiempoPreparacionMin,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="pagina">
      <Encabezado titulo="Carta" subtitulo="Un plato agotado desaparece del menú del cliente y no se puede pedir." />
      <ErrorApi error={accion.error || platos.error} onClose={() => accion.setError(null)} />
      <Aviso tipo="exito" onClose={() => accion.setExito(null)}>{accion.exito}</Aviso>

      {esAdmin && (
        <form className="panel" onSubmit={guardar}>
          <h2>{editando ? `Editar plato #${editando}` : 'Nuevo plato'}</h2>
          <div className="grid-form">
            <label>
              Nombre
              <input value={form.nombre} onChange={set('nombre')} required minLength={2} maxLength={80} />
            </label>
            <label>
              Precio (COP)
              <input type="number" min="0.01" step="any" value={form.precio} onChange={set('precio')} required />
            </label>
            <label>
              Categoría
              <select value={form.categoria} onChange={set('categoria')}>
                {Object.entries(CATEGORIAS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </label>
            <label>
              Tiempo prep. (min)
              <input type="number" min="1" max="120" value={form.tiempoPreparacionMin} onChange={set('tiempoPreparacionMin')} required />
            </label>
            <label className="ancho">
              Descripción
              <input value={form.descripcion} onChange={set('descripcion')} maxLength={500} />
            </label>
          </div>
          <div className="fila-botones">
            <button className="btn btn-primario" disabled={accion.ocupado}>{editando ? 'Guardar' : 'Crear plato'}</button>
            {editando && (
              <button type="button" className="btn btn-ghost" onClick={() => { setEditando(null); setForm(VACIO); }}>
                Cancelar
              </button>
            )}
          </div>
        </form>
      )}

      <section className="panel">
        {platos.cargando && !platos.data ? (
          <Cargando />
        ) : (
          <table className="tabla">
            <thead>
              <tr><th>Plato</th><th>Categoría</th><th>Precio</th><th>Prep.</th><th>Estado</th><th /></tr>
            </thead>
            <tbody>
              {(platos.data || []).map((p) => (
                <tr key={p.id} className={!p.disponible ? 'fila-apagada' : ''}>
                  <td>
                    <strong>{p.nombre}</strong>
                    {p.descripcion && <small className="bloque">{p.descripcion}</small>}
                  </td>
                  <td>{CATEGORIAS[p.categoria]}</td>
                  <td>{dinero(p.precio)}</td>
                  <td>{p.tiempoPreparacionMin} min</td>
                  <td><Chip tono={p.disponible ? 'ok' : 'mal'}>{p.disponible ? 'Disponible' : 'Agotado'}</Chip></td>
                  <td className="acciones">
                    {puedeAgotar && (
                      <button className="btn btn-ghost btn-sm" onClick={() => toggle(p)}>
                        {p.disponible ? 'Marcar agotado' : 'Reactivar'}
                      </button>
                    )}
                    {esAdmin && (
                      <>
                        <button className="btn btn-ghost btn-sm" onClick={() => editar(p)}>Editar</button>
                        <button className="btn btn-peligro btn-sm" onClick={() => eliminar(p)}>Eliminar</button>
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
  );
}
