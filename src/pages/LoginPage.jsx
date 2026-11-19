import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ErrorApi } from '../components/ui.jsx';
import { INICIO_POR_ROL } from '../components/Layout.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const DEMO = [
  ['ADMIN', 'admin@brasaviva.com'],
  ['MESERO', 'mesero@brasaviva.com'],
  ['PARRILLERO', 'parrillero@brasaviva.com'],
  ['CLIENTE', 'cliente@brasaviva.com'],
];

/** POST /api/v1/auth/login -> JWT guardado en sessionStorage. */
export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [ocupado, setOcupado] = useState(false);

  const enviar = async (e) => {
    e.preventDefault();
    setOcupado(true);
    setError(null);
    try {
      const u = await login(email.trim(), password);
      navigate(location.state?.desde || INICIO_POR_ROL[u.rol] || '/');
    } catch (err) {
      setError(err);
    } finally {
      setOcupado(false);
    }
  };

  return (
    <div className="pagina auth">
      <form className="panel auth-panel" onSubmit={enviar}>
        <h1>Ingresar</h1>
        <p className="sub">Accede con tu cuenta de La Brasa Viva.</p>
        <ErrorApi error={error} onClose={() => setError(null)} />
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={150} autoFocus />
        </label>
        <label>
          Contraseña
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required maxLength={72} />
        </label>
        <button className="btn btn-primario btn-block" disabled={ocupado}>
          {ocupado ? 'Ingresando…' : 'Ingresar'}
        </button>
        <p className="centro sub">
          ¿No tienes cuenta? <Link to="/registro">Regístrate como cliente</Link>
        </p>
        <div className="demo">
          <p>Usuarios de ejemplo (contraseña <code>Brasa2026</code>):</p>
          <div className="demo-botones">
            {DEMO.map(([rol, mail]) => (
              <button
                type="button"
                key={rol}
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setEmail(mail);
                  setPassword('Brasa2026');
                }}
              >
                {rol}
              </button>
            ))}
          </div>
        </div>
      </form>
    </div>
  );
}
