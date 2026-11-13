import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { XCircle } from 'lucide-react';

interface MyOrder {
  id: string;
  delivery_info: string;
  status: 'pending' | 'delivered' | 'cancelled';
  created_at: string;
  order_items: {
    id: number;
    product_name: string;
    quantity: number;
    unit_price: number;
    currency: string;
  }[];
}

export function MyOrders() {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<MyOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchMyOrders();
  }, [user]);

  async function fetchMyOrders() {
    setLoading(true);
    const { data } = await supabase
      .from('orders')
      .select(`
        id, delivery_info, status, created_at,
        order_items (id, product_name, quantity, unit_price, currency)
      `)
      .eq('profile_id', user!.id)
      .order('created_at', { ascending: false });

    if (data) setOrders(data as unknown as MyOrder[]);
    setLoading(false);
  }

  async function handleCancel(orderId: string) {
    if (!confirm('Deseja cancelar esta encomenda?')) return;
    const { error } = await supabase.rpc('cancel_order', { p_order_id: orderId });
    if (error) alert(error.message);
    fetchMyOrders();
  }

  if (authLoading) return null;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <main className="max-w-[900px] mx-auto p-[18px] space-y-4">
      <h2 className="font-ancestral text-2xl font-bold text-[#f0d99e]">
        Minhas Encomendas
      </h2>

      {loading ? (
        <div className="text-center py-12 text-[#b8b3a5]">Carregando histórico...</div>
      ) : orders.length === 0 ? (
        <div className="ancestral-card p-8 text-center text-[#b8b3a5]">
          Você ainda não fez nenhuma encomenda.
        </div>
      ) : (
        orders.map((o) => (
          <div key={o.id} className="ancestral-card p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#3a392f] pb-3">
              <div>
                <span className="text-xs text-[#b8b3a5]">
                  Pedido em {new Date(o.created_at).toLocaleDateString('pt-BR')}
                </span>
                <p className="text-sm text-[#f0d99e] font-medium">
                  Entrega (TP / Mapa): <strong>{o.delivery_info}</strong>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-bold uppercase px-2.5 py-1 rounded border ${
                    o.status === 'pending'
                      ? 'bg-[#282419] text-[#f0d99e] border-[#665637]'
                      : o.status === 'delivered'
                      ? 'bg-[#1d2e20] text-[#78bd83] border-[#78bd83]/40'
                      : 'bg-red-950/50 text-red-300 border-red-800/40'
                  }`}
                >
                  {o.status === 'pending'
                    ? 'Aguardando Entrega'
                    : o.status === 'delivered'
                    ? 'Entregue In-Game'
                    : 'Cancelado'}
                </span>

                {o.status === 'pending' && (
                  <button
                    onClick={() => handleCancel(o.id)}
                    className="btn-secondary !py-1 !px-2.5 text-xs flex items-center gap-1 text-red-300"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Cancelar
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-1 text-sm">
              {o.order_items.map((item) => (
                <div key={item.id} className="flex justify-between text-[#f6f0e2]">
                  <span>
                    {item.quantity} × <strong>{item.product_name}</strong>
                  </span>
                  <span className="text-[#d5b36b] font-bold">
                    {(item.quantity * item.unit_price).toLocaleString('pt-BR')} {item.currency}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </main>
  );
}