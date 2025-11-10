import React, { useState } from 'react';
import { NotificationProvider } from './components/Notification';
import './App.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import InventoryPage from './pages/InventoryPage';
import SalesPage from './pages/SalesPage';
import ReportsPage from './pages/ReportsPage';
import ExpensesPage from './pages/ExpensesPage';
import Sidebar from './components/Sidebar';
import LoginPage from './pages/LoginPage';

function App() {
  const [currentPage, setCurrentPage] = useState('sales');
  const [loggedIn, setLoggedIn] = useState(false);
  const [modoPrueba, setModoPrueba] = useState(false);

  const handleNavigate = (page) => {
    setCurrentPage(page);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'inventory':
        return <InventoryPage />;
      case 'sales':
        return <SalesPage />;
      case 'expenses':
        return <ExpensesPage />;
      case 'reports':
        return <ReportsPage />;
      case 'settings':
        return <div><h1 className="text-xl font-bold">Página de Configuración (Próximamente)</h1></div>;
      default:
        return <SalesPage />;
    }
  };

  return (
    <NotificationProvider>
      {!loggedIn ? ( 
        <LoginPage
          onLogin={() => setLoggedIn(true)}
          activarModoPrueba={() => setModoPrueba(true)}
        />
      ) : (
        <div className="min-h-screen flex bg-gray-100">
          <Sidebar
            currentPage={currentPage}
            onNavigate={handleNavigate}
            modoPrueba={modoPrueba}
          />

          <main className="flex-grow p-4 ml-[250px]">
            {renderPage()}
          </main>
        </div>
      )}
    </NotificationProvider>
  );
}

export default App;