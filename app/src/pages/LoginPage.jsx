import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

const LoginPage = ({ onLogin, activarModoPrueba }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (email && password) {
      setLoading(true);
      try {
        const response = await fetch('http://localhost:8000/api/token/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: email, password })
        });
        const data = await response.json();
        if (response.ok && data.access) {
          sessionStorage.setItem('access_token', data.access);
          sessionStorage.setItem('refresh_token', data.refresh);
          onLogin();
        } else {
          setError(data.detail || 'Credenciales incorrectas');
        }
      } catch (err) {
        setError('Error de conexión con el servidor');
      } finally {
        setLoading(false);
      }
    } else {
      setError('Por favor completa todos los campos');
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100" style={{ backgroundColor: '#1E2A38' }}>
      <div className="card shadow-lg" style={{ width: '400px' }}>
        <div className="card-header text-white text-center" style={{ backgroundColor: '#111827' }}>
          <h4 className="mb-0">MiniMarket Pro</h4>
          <small>Ingreso al sistema</small>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="email" className="form-label">Usuario</label>
              <input
                type="text"
                className="form-control"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="mb-3">
              <label htmlFor="password" className="form-label">Contraseña</label>
              <input
                type="password"
                className="form-control"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <div className="alert alert-danger py-2">{error}</div>}
            <button type="submit" className="btn w-100" style={{ backgroundColor: '#4DA3FF', color: 'white' }} disabled={loading}>
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>
          <hr />
          <button
            type="button"
            className="btn w-100"
            style={{ backgroundColor: '#4DA3FF', color: 'white' }}
            onClick={() => {
              onLogin();
              activarModoPrueba();
            }}
          >
            Modo Prueba
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
