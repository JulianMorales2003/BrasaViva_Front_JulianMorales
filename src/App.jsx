import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import MenuPage from './pages/MenuPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegistroPage from './pages/RegistroPage.jsx';
import PedidoPage from './pages/PedidoPage.jsx';
import ReservasPage from './pages/ReservasPage.jsx';
import SalonPage from './pages/SalonPage.jsx';
import PedidosPage from './pages/PedidosPage.jsx';
import CocinaPage from './pages/CocinaPage.jsx';
import CartaPage from './pages/CartaPage.jsx';
import ParqueaderoPage from './pages/ParqueaderoPage.jsx';
import ReportesPage from './pages/ReportesPage.jsx';
import UsuariosPage from './pages/UsuariosPage.jsx';

const p = (roles, el) => <ProtectedRoute roles={roles}>{el}</ProtectedRoute>;

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<MenuPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/registro" element={<RegistroPage />} />
        <Route path="/pedido" element={p(['CLIENTE', 'MESERO'], <PedidoPage />)} />
        <Route path="/reservas" element={p(['CLIENTE', 'MESERO', 'ADMIN'], <ReservasPage />)} />
        <Route path="/salon" element={p(['MESERO', 'ADMIN'], <SalonPage />)} />
        <Route path="/pedidos" element={p(['MESERO', 'ADMIN'], <PedidosPage />)} />
        <Route path="/cocina" element={p(['PARRILLERO', 'ADMIN'], <CocinaPage />)} />
        <Route path="/carta" element={p(['MESERO', 'PARRILLERO', 'ADMIN'], <CartaPage />)} />
        <Route path="/parqueadero" element={p(['MESERO', 'ADMIN'], <ParqueaderoPage />)} />
        <Route path="/reportes" element={p(['ADMIN'], <ReportesPage />)} />
        <Route path="/usuarios" element={p(['ADMIN'], <UsuariosPage />)} />
        <Route
          path="*"
          element={
            <div className="pagina">
              <div className="panel centro">
                <h2>404 · Página no encontrada</h2>
              </div>
            </div>
          }
        />
      </Routes>
    </Layout>
  );
}
