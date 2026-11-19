import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { ROLES } from '../utils/format.js';

/** Enlaces visibles segun el rol (misma matriz que SecurityConfig del backend). */
export const NAV = [
  { to: '/', label: 'Menú', roles: null, end: true },
  { to: '/pedido', label: 'Hacer pedido', roles: ['CLIENTE', 'MESERO'] },
  { to: '/reservas', label: 'Reservas', roles: ['CLIENTE', 'MESERO', 'ADMIN'] },
  { to: '/salon', label: 'Salón y cuentas', roles: ['MESERO', 'ADMIN'] },
  { to: '/pedidos', label: 'Pedidos', roles: ['MESERO', 'ADMIN'] },
  { to: '/cocina', label: 'Cocina', roles: ['PARRILLERO', 'ADMIN'] },
  { to: '/carta', label: 'Carta', roles: ['MESERO', 'PARRILLERO', 'ADMIN'] },
  { to: '/parqueadero', label: 'Parqueadero', roles: ['MESERO', 'ADMIN'] },
  { to: '/reportes', label: 'Reportes', roles: ['ADMIN'] },
  { to: '/usuarios', label: 'Usuarios', roles: ['ADMIN'] },
];

export const INICIO_POR_ROL = { CLIENTE: '/pedido', MESERO: '/salon', PARRILLERO: '/cocina', ADMIN: '/reportes' };

export default function Layout({ children }) {
  const { usuario, logout, expirada, setExpirada } = useAuth();
  const navigate = useNavigate();
  const enlaces = NAV.filter((n) => !n.roles || (usuario && n.roles.includes(usuario.rol)));

  return (
    <div className="app">
      <header className="topbar">
        <Link to="/" className="marca">
          <img src="/favicon.svg" alt="" width="34" height="34" />
          <span>
            La Brasa <em>Viva</em>
          </span>
        </Link>
        <nav className="nav">
          {enlaces.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end}>
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="sesion">
          {usuario ? (
            <>
              <div className="sesion-info">
                <strong>{usuario.nombre}</strong>
                <span>{ROLES[usuario.rol]}</span>
              </div>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
              >
                Salir
              </button>
            </>
          ) : (
            <>
              <Link className="btn btn-ghost btn-sm" to="/registro">
                Registrarse
              </Link>
              <Link className="btn btn-primario btn-sm" to="/login">
                Ingresar
              </Link>
            </>
          )}
        </div>
      </header>
      {expirada && (
        <div className="banda">
          Tu sesión expiró. <Link to="/login" onClick={() => setExpirada(false)}>Vuelve a ingresar</Link>
        </div>
      )}
      <main>{children}</main>
      <footer className="pie">La Brasa Viva · Parrilla y cortes a la brasa · DOSW 2026-2 · Julian Morales</footer>
    </div>
  );
}
