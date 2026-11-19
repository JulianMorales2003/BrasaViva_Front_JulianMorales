import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../api/services.js';
import { ErrorApi } from '../components/ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const PASS_OK = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,72}$/;

/** POST /api/v1/auth/register: siempre crea un CLIENTE. Luego inicia sesion. */
export default function RegistroPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ nombre: '', email: '', password: '' });
  const [error, setError] = useState(null);
  const [ocupado, setOcupado] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const enviar = async (e) => {
    e.preventDefault();
    setOcupado(true);
    setError(null);
    try {
      await authService.registrar({ ...form, email: form.email.trim() });
      await login(form.email.trim(), form.password);
      navigate('/pedido');
    } catch (err) {
      setError(err);
    } finally {
      setOcupado(false);
    }
  };

  const passValida = PASS_OK.test(form.password);

  return (
    <div className="pagina auth">
      <form className="panel auth-panel" onSubmit={enviar}>
        <h1>Crear cuenta</h1>
        <p className="sub">Regístrate como cliente para pedir y reservar.</p>
        <ErrorApi error={error} onClose={() => setError(null)} />
        <label>
          Nombre
          <input value={form.nombre} onChange={set('nombre')} required maxLength={100} autoFocus />
        </label>
        <label>
          Email
          <input type="email" value={form.email} onChange={set('email')} required maxLength={150} />
        </label>
        <label>
          Contraseña
          <input type="password" value={form.password} onChange={set('password')} required minLength={8} maxLength={72} />
          <small className={form.password && !passValida ? 'texto-error' : 'sub'}>
            Mínimo 8 caracteres, con mayúscula, minúscula y número.
          </small>
        </label>
        <button className="btn btn-primario btn-block" disabled={ocupado || !passValida}>
          {ocupado ? 'Creando…' : 'Crear cuenta'}
        </button>
        <p className="centro sub">
          ¿Ya tienes cuenta? <Link to="/login">Ingresa</Link>
        </p>
      </form>
    </div>
  );
}
