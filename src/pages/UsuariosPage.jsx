import { useState } from 'react';
import { usuarioService } from '../api/services.js';
import { Aviso, Cargando, Chip, Encabezado, ErrorApi, useAccion, useApi } from '../components/ui.jsx';
import { ROLES } from '../utils/format.js';

const VACIO = { nombre: '', email: '', password: '', rol: 'MESERO' };
const TONO = { ADMIN: 'fuego', MESERO: 'ok', PARRILLERO: 'aviso', CLIENTE: 'neutro' };

/** Admin: listar usuarios y crear usuarios con rol (POST /api/v1/usuarios). */
export default function UsuariosPage() {
  const usuarios = useApi(() => usuarioService.listar(), []);
  const accion = useAccion();
  const [form, setForm] = useState(VACIO);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const crear = async (e) => {
    e.preventDefault();
    const r = await accion.ejecutar(
      () => usuarioService.crear({ ...form, email: form.email.trim() }),
      (u) => `Usuario ${u.email} creado como ${ROLES[u.rol]}.`
    );
    if (r) {
      setForm(VACIO);
      usuarios.recargar();
    }
  };

  return (
    <div className="pagina">
      <Encabezado titulo="Usuarios" subtitulo="Solo el administrador crea meseros, parrilleros y otros administradores." />
      <div className="dos-columnas angosta">
        <form className="panel" onSubmit={crear}>
          <h2>Nuevo usuario</h2>
          <label>Nombre<input value={form.nombre} onChange={set('nombre')} required maxLength={100} /></label>
          <label>Email<input type="email" value={form.email} onChange={set('email')} required maxLength={150} /></label>
          <label>
            Contraseña
            <input type="password" value={form.password} onChange={set('password')} required minLength={8} maxLength={72} />
            <small className="sub">Mayúscula, minúscula y número.</small>
          </label>
          <label>
            Rol
            <select value={form.rol} onChange={set('rol')}>
              {Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
          <ErrorApi error={accion.error} onClose={() => accion.setError(null)} />
          <Aviso tipo="exito" onClose={() => accion.setExito(null)}>{accion.exito}</Aviso>
          <button className="btn btn-primario btn-block" disabled={accion.ocupado}>Crear usuario</button>
        </form>
        <section className="panel">
          <h2>Usuarios registrados</h2>
          <ErrorApi error={usuarios.error} />
          {usuarios.cargando ? <Cargando /> : (
            <table className="tabla">
              <thead><tr><th>#</th><th>Nombre</th><th>Email</th><th>Rol</th></tr></thead>
              <tbody>
                {(usuarios.data || []).map((u) => (
                  <tr key={u.id}>
                    <td>{u.id}</td><td>{u.nombre}</td><td>{u.email}</td>
                    <td><Chip tono={TONO[u.rol]}>{ROLES[u.rol]}</Chip></td>
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
