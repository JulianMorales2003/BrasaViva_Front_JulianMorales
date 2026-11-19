import { useState } from 'react';
import { Link } from 'react-router-dom';
import { menuService } from '../api/services.js';
import { Cargando, ErrorApi, Vacio, useApi } from '../components/ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { CATEGORIAS, dinero } from '../utils/format.js';

/** GET /api/v1/menu (publico): solo platos disponibles, filtrable por categoria. */
export default function MenuPage() {
  const [categoria, setCategoria] = useState('');
  const { usuario } = useAuth();
  const { data: menu, error, cargando } = useApi(() => menuService.listar(categoria || undefined), [categoria]);

  const grupos = Object.keys(CATEGORIAS)
    .map((c) => ({ c, items: (menu || []).filter((p) => p.categoria === c) }))
    .filter((g) => g.items.length > 0);

  return (
    <>
      <section className="hero">
        <div className="hero-texto">
          <p className="eyebrow">Parrilla · Cortes · Brasa de leña</p>
          <h1>
            Fuego lento,
            <br />
            sabor <em>vivo</em>.
          </h1>
          <p>Cortes seleccionados a la brasa, con el término que tú elijas. Reserva tu mesa o pide desde ella.</p>
          <div className="hero-acciones">
            {usuario ? (
              usuario.rol === 'CLIENTE' && (
                <>
                  <Link className="btn btn-primario" to="/pedido">Hacer un pedido</Link>
                  <Link className="btn btn-ghost" to="/reservas">Reservar mesa</Link>
                </>
              )
            ) : (
              <>
                <Link className="btn btn-primario" to="/registro">Crear cuenta</Link>
                <Link className="btn btn-ghost" to="/login">Ya tengo cuenta</Link>
              </>
            )}
          </div>
        </div>
        <div className="hero-brasa" aria-hidden="true">
          <span /><span /><span /><span /><span />
        </div>
      </section>

      <div className="pagina">
        <div className="filtros">
          <button className={`filtro ${categoria === '' ? 'activo' : ''}`} onClick={() => setCategoria('')}>
            Todo
          </button>
          {Object.entries(CATEGORIAS).map(([k, v]) => (
            <button key={k} className={`filtro ${categoria === k ? 'activo' : ''}`} onClick={() => setCategoria(k)}>
              {v}
            </button>
          ))}
        </div>

        <ErrorApi error={error} />
        {cargando && !menu ? (
          <Cargando texto="Encendiendo la parrilla…" />
        ) : grupos.length === 0 ? (
          <Vacio>No hay platos disponibles en esta categoría.</Vacio>
        ) : (
          grupos.map((g) => (
            <section key={g.c} className="menu-grupo">
              <h2 className="menu-titulo">{CATEGORIAS[g.c]}</h2>
              <div className="menu-lista">
                {g.items.map((p) => (
                  <article key={p.id} className="menu-item">
                    <div className="menu-linea">
                      <h3>{p.nombre}</h3>
                      <span className="puntos" />
                      <span className="precio">{dinero(p.precio)}</span>
                    </div>
                    {p.descripcion && <p>{p.descripcion}</p>}
                    {p.categoria === 'CORTE' && <small className="nota">Se pide con término de cocción</small>}
                  </article>
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </>
  );
}
