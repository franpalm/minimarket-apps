import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

const LoginPage = ({ onLogin, activarModoPrueba }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email && password) {
      console.log('Login simulado:', { email, password });
      onLogin();
    } else {
      alert('Por favor completa todos los campos');
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
              <label htmlFor="email" className="form-label">Correo electrónico</label>
              <input
                type="email"
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
            <button type="submit" className="btn w-100" style={{ backgroundColor: '#4DA3FF', color: 'white' }}>
              Ingresar
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
