import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

/** Protege una ruta por rol, igual que la matriz de permisos del backend. */
export default function ProtectedRoute({ roles, children }) {
  const { usuario } = useAuth();
  const location = useLocation();
  if (!usuario) return <Navigate to="/login" replace state={{ desde: location.pathname }} />;
  if (roles && !roles.includes(usuario.rol)) {
    return (
      <div className="pagina">
        <div className="panel centro">
          <h2>403 · Sin permiso</h2>
          <p>Tu rol ({usuario.rol}) no puede ver esta sección.</p>
        </div>
      </div>
    );
  }
  return children;
}
