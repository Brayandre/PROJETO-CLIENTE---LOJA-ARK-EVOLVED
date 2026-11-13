import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut } from 'lucide-react';

export function Navbar() {
  const { user, profile, isAdmin, signOut } = useAuth();
  const location = useLocation();

  const btnClass = (path: string) =>
    location.pathname === path ? 'btn-gold' : 'btn-secondary';

  return (
    <>
      <header className="px-[18px] pt-[24px] pb-[18px] text-center border-b border-[#3a392f] bg-[#151610ef]">
        <Link to="/" className="no-underline">
          <div className="font-ancestral text-[#d5b36b] text-[clamp(28px,6vw,46px)] tracking-[3px] font-bold">
            LOJA ANCESTRAIS
          </div>
        </Link>
        <div className="text-[#d8c9a6] tracking-[3px] text-[11px] mt-1.5">
          O PODER DOS ANCESTRAIS
        </div>
        <div className="flex justify-center gap-2 flex-wrap mt-[15px]">
          <span className="border border-[#655738] rounded-[30px] px-[11px] py-[6px] text-[#f0d99e] text-xs">
            ARK: SURVIVAL EVOLVED
          </span>
          <span className="border border-[#655738] rounded-[30px] px-[11px] py-[6px] text-[#f0d99e] text-xs">
            SERVIDOR PVE
          </span>
          <span className="border border-[#655738] rounded-[30px] px-[11px] py-[6px] text-[#f0d99e] text-xs">
            PAGAMENTO EM ELEMENTOS
          </span>
          <span className="border border-[#655738] rounded-[30px] px-[11px] py-[6px] text-[#f0d99e] text-xs">
            NÍVEL 300+
          </span>
        </div>
      </header>

      <nav className="flex justify-center items-center gap-2.5 flex-wrap p-3.5">
        <Link to="/" className={btnClass('/')}>
          Loja
        </Link>

        {user && (
          <Link to="/orders" className={btnClass('/orders')}>
            Meus pedidos
          </Link>
        )}

        {isAdmin && (
          <Link to="/admin" className={btnClass('/admin')}>
            Área administrativa
          </Link>
        )}

        {user ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#d8c9a6] px-2">
              Olá, <strong className="text-[#f0d99e]">{profile?.survivor_name}</strong>
            </span>
            <button
              onClick={signOut}
              title="Sair da conta"
              className="btn-secondary flex items-center gap-1.5 !py-2.5 !px-3"
            >
              <LogOut className="w-4 h-4 text-[#d5b36b]" />
              <span className="text-xs">Sair</span>
            </button>
          </div>
        ) : (
          <Link to="/login" className={btnClass('/login')}>
            Entrar / Cadastrar
          </Link>
        )}
      </nav>
    </>
  );
}