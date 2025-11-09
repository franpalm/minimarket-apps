import React, { useState } from 'react';

function Sidebar({ currentPage, onNavigate }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const navItems = [
    { key: 'inventory', label: 'Inventario', icon: 'bi-box-seam' },
    { key: 'sales', label: 'Ventas', icon: 'bi-cart' },
    { key: 'expenses', label: 'Gastos', icon: 'bi-cash' },
    { key: 'reports', label: 'Reportes', icon: 'bi-graph-up' },
    { key: 'settings', label: 'Configuración', icon: 'bi-gear' },
  ];

  return (
    <aside className="sidebar-custom fixed top-0 left-0 h-screen w-[250px] bg-gray-900 text-white flex flex-col z-50">
      <a href="/" className="flex items-center mb-6 px-6 py-4 font-bold text-lg text-white">
        <i className="bi bi-shop text-2xl mr-2"></i>
        Minimarket App
      </a>
      <nav className="flex-1">
        <ul className="flex flex-col gap-1 px-2">
          {navItems.map((item) => (
            <li key={item.key}>
              <button
                type="button"
                className={`w-full flex items-center gap-2 px-4 py-2 rounded transition text-left ${
                  currentPage === item.key
                    ? 'bg-blue-600 text-white'
                    : 'hover:bg-gray-700'
                }`}
                onClick={() => onNavigate(item.key)}
              >
                <i className={`bi ${item.icon}`}></i>
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <div className="mt-auto px-6 py-4 relative">
        <button
          className="flex items-center gap-2 w-full text-white focus:outline-none"
          onClick={() => setDropdownOpen((open) => !open)}
        >
          <img
            src="https://github.com/twbs.png"
            alt=""
            width="32"
            height="32"
            className="rounded-full"
          />
          <span className="font-semibold">Usuario Actual</span>
          <svg className="w-4 h-4 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {dropdownOpen && (
          <ul className="absolute left-6 right-6 mt-2 bg-gray-800 rounded shadow-lg py-2 z-50">
            <li>
              <a className="block px-4 py-2 text-gray-100 hover:bg-blue-600 rounded" href="#">Mi Perfil</a>
            </li>
            <li>
              <hr className="my-1 border-gray-700" />
            </li>
            <li>
              <a className="block px-4 py-2 text-gray-100 hover:bg-blue-600 rounded" href="#">Cerrar Sesión</a>
            </li>
          </ul>
        )}
      </div>
    </aside>
  );
}

export default Sidebar;