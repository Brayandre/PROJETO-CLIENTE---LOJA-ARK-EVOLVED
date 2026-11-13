import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Store } from './pages/Store';
import { MyOrders } from './pages/MyOrders';
import { Login } from './pages/Login';
import { Admin } from './pages/Admin';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col justify-between">
          <div>
            <Navbar />
            <Routes>
              <Route path="/" element={<Store />} />
              <Route path="/orders" element={<MyOrders />} />
              <Route path="/login" element={<Login />} />
              <Route path="/admin" element={<Admin />} />
            </Routes>
          </div>

          <footer className="text-center text-[#8f8979] py-[30px] px-[15px] text-xs border-t border-[#3a392f]/40 mt-10">
            LOJA ANCESTRAIS • O PODER DOS ANCESTRAIS
            <br />
            Catálogo oficial de criaturas, itens e encomendas do servidor.
            <br/>
            by Brayan Costa - brayan0.costa@gmail.com
          </footer>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}