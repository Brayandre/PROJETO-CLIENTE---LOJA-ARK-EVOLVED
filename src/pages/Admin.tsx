import { useEffect, useState } from 'react';
import { supabase, uploadProductImage } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import {
  Plus,
  Package,
  ClipboardList,
  PlusCircle,
  MinusCircle,
  Trash2,
  CheckCircle,
  XCircle,
  Image as ImageIcon,
} from 'lucide-react';

export interface Product {
  id: number;
  name: string;
  category: string;
  description: string;
  image_url: string | null;
  price: number;
  currency: string;
  stock: number;
  active: boolean;
}

interface OrderAdmin {
  id: string;
  delivery_info: string;
  total: number;
  status: 'pending' | 'delivered' | 'cancelled';
  created_at: string;
  profiles: {
    survivor_name: string;
    discord: string;
    tribe_name: string | null;
  };
  order_items: {
    id: number;
    product_name: string;
    quantity: number;
    unit_price: number;
    currency: string;
  }[];
}

export function Admin() {
  const { isAdmin, loading: authLoading } = useAuth();
  const [tab, setTab] = useState<'products' | 'orders'>('products');

  // Estados de Produtos
  const [products, setProducts] = useState<Product[]>([]);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Dinos');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('Polímero');
  const [stock, setStock] = useState('1');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Estados de Pedidos
  const [orders, setOrders] = useState<OrderAdmin[]>([]);

  useEffect(() => {
    if (isAdmin) {
      fetchProducts();
      fetchOrders();
    }
  }, [isAdmin]);

  async function fetchProducts() {
    const { data } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setProducts(data);
  }

  async function fetchOrders() {
    const { data } = await supabase
      .from('orders')
      .select(`
        id, delivery_info, total, status, created_at,
        profiles (survivor_name, discord, tribe_name),
        order_items (id, product_name, quantity, unit_price, currency)
      `)
      .order('created_at', { ascending: false });

    if (data) setOrders(data as unknown as OrderAdmin[]);
  }

  async function handleCreateProduct(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      let imageUrl = null;
      if (imageFile) {
        imageUrl = await uploadProductImage(imageFile);
      }

      const { error } = await supabase.from('products').insert({
        name,
        category,
        description,
        price: Number(price),
        currency,
        stock: Number(stock),
        image_url: imageUrl,
        active: true,
      });

      if (error) throw error;

      setName('');
      setDescription('');
      setPrice('');
      setStock('1');
      setImageFile(null);
      fetchProducts();
    } catch (err: any) {
      alert('Erro ao cadastrar produto: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function updateStock(productId: number, newStock: number) {
    if (newStock < 0) return;
    await supabase.from('products').update({ stock: newStock }).eq('id', productId);
    fetchProducts();
  }

  async function toggleActive(productId: number, currentActive: boolean) {
    await supabase.from('products').update({ active: !currentActive }).eq('id', productId);
    fetchProducts();
  }

  async function deleteProduct(productId: number) {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;
    const { error } = await supabase.from('products').delete().eq('id', productId);
    if (error) {
      alert('Não é possível excluir um produto que já possui pedidos. Desative-o em vez disso.');
    } else {
      fetchProducts();
    }
  }

  async function markOrderDelivered(orderId: string) {
    await supabase.from('orders').update({ status: 'delivered' }).eq('id', orderId);
    fetchOrders();
  }

  async function handleCancelOrder(orderId: string) {
    if (!confirm('Cancelar pedido e devolver itens ao estoque?')) return;
    const { error } = await supabase.rpc('cancel_order', { p_order_id: orderId });
    if (error) alert(error.message);
    fetchOrders();
    fetchProducts();
  }

  if (authLoading) return null;
  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      {/* Seletor de Abas */}
      <div className="flex gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setTab('products')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer transition ${
            tab === 'products'
              ? 'bg-cyan-500 text-slate-950'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <Package className="w-4 h-4" />
          Estoque & Produtos ({products.length})
        </button>

        <button
          onClick={() => setTab('orders')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer transition ${
            tab === 'orders'
              ? 'bg-cyan-500 text-slate-950'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          Pedidos ({orders.filter((o) => o.status === 'pending').length} pendentes)
        </button>
      </div>

      {tab === 'products' ? (
        <div className="grid md:grid-cols-3 gap-6">
          {/* Formulário de Novo Produto */}
          <form
            onSubmit={handleCreateProduct}
            className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 h-fit"
          >
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-cyan-400" />
              Cadastrar Item
            </h2>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Nome do Dino / Item *</label>
              <input
                type="text"
                required
                placeholder="Ex: Rex Boss (35k HP / 1200% M)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Categoria *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white"
                >
                  <option value="Dinos">Dinos</option>
                  <option value="Blueprints">Blueprints / Selas</option>
                  <option value="Recursos">Recursos</option>
                  <option value="Estruturas">Estruturas / Tek</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Estoque Inicial *</label>
                <input
                  type="number"
                  min={0}
                  required
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Preço (Valor) *</label>
                <input
                  type="number"
                  min={0}
                  step="any"
                  required
                  placeholder="Ex: 500"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Moeda In-Game *</label>
                <input
                  type="text"
                  required
                  placeholder="Polímero, Lingotes..."
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Descrição / Stats</label>
              <textarea
                rows={3}
                placeholder="Detalhes de status, mutações, nível base..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Imagem do Produto</label>
              <label className="flex items-center justify-center gap-2 w-full bg-slate-950 border border-dashed border-slate-700 hover:border-cyan-500 rounded-lg p-3 text-xs text-slate-400 cursor-pointer">
                <ImageIcon className="w-4 h-4 text-cyan-400" />
                <span className="truncate">
                  {imageFile ? imageFile.name : 'Escolher print / foto...'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold py-2.5 rounded-lg transition cursor-pointer"
            >
              {submitting ? 'Salvando...' : 'Adicionar à Loja'}
            </button>
          </form>

          {/* Lista de Produtos Cadastrados */}
          <div className="md:col-span-2 space-y-3">
            {products.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400">
                Nenhum produto cadastrado ainda. Use o formulário ao lado!
              </div>
            ) : (
              products.map((p) => (
                <div
                  key={p.id}
                  className={`bg-slate-900 border rounded-xl p-4 flex items-center justify-between gap-4 ${
                    p.active ? 'border-slate-800' : 'border-red-900/40 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {p.image_url ? (
                      <img
                        src={p.image_url}
                        alt={p.name}
                        className="w-14 h-14 rounded-lg object-cover bg-slate-950 shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-slate-950 flex items-center justify-center text-slate-600 shrink-0">
                        <Package className="w-6 h-6" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-cyan-400">
                        {p.category}
                      </span>
                      <h3 className="font-bold text-white truncate mt-1">{p.name}</h3>
                      <p className="text-xs text-amber-400 font-semibold">
                        {p.price} {p.currency}
                      </p>
                    </div>
                  </div>

                  {/* Controles de Estoque e Status */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-lg">
                      <button
                        onClick={() => updateStock(p.id, p.stock - 1)}
                        className="text-slate-400 hover:text-white cursor-pointer"
                      >
                        <MinusCircle className="w-4 h-4" />
                      </button>
                      <span className="text-sm font-bold w-6 text-center text-white">
                        {p.stock}
                      </span>
                      <button
                        onClick={() => updateStock(p.id, p.stock + 1)}
                        className="text-slate-400 hover:text-white cursor-pointer"
                      >
                        <PlusCircle className="w-4 h-4" />
                      </button>
                    </div>

                    <button
                      onClick={() => toggleActive(p.id, p.active)}
                      className={`text-xs px-2.5 py-1.5 rounded-lg border cursor-pointer ${
                        p.active
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                          : 'border-slate-700 bg-slate-800 text-slate-400'
                      }`}
                    >
                      {p.active ? 'Ativo' : 'Oculto'}
                    </button>

                    <button
                      onClick={() => deleteProduct(p.id)}
                      className="text-slate-500 hover:text-red-400 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        /* Aba de Pedidos */
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400">
              Nenhum pedido recebido até o momento.
            </div>
          ) : (
            orders.map((o) => (
              <div
                key={o.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-sm font-bold text-white">
                      Sobrevivente: {o.profiles?.survivor_name}
                    </span>
                    <span className="ml-3 text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded">
                      Discord: {o.profiles?.discord}
                    </span>
                    {o.profiles?.tribe_name && (
                      <span className="ml-2 text-xs text-slate-400">
                        (Tribo: {o.profiles.tribe_name})
                      </span>
                    )}
                    <p className="text-xs text-cyan-400 mt-1">
                      Entrega / Mapa: <strong>{o.delivery_info}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-bold uppercase px-2.5 py-1 rounded ${
                        o.status === 'pending'
                          ? 'bg-amber-500/20 text-amber-300'
                          : o.status === 'delivered'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-red-500/20 text-red-300'
                      }`}
                    >
                      {o.status === 'pending'
                        ? 'Pendente'
                        : o.status === 'delivered'
                        ? 'Entregue'
                        : 'Cancelado'}
                    </span>

                    {o.status === 'pending' && (
                      <>
                        <button
                          onClick={() => markOrderDelivered(o.id)}
                          className="flex items-center gap-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> Entregue
                        </button>
                        <button
                          onClick={() => handleCancelOrder(o.id)}
                          className="flex items-center gap-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-semibold px-3 py-1.5 rounded-lg cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Cancelar
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-1 text-sm">
                  {o.order_items.map((item) => (
                    <div key={item.id} className="flex justify-between text-slate-300">
                      <span>
                        {item.quantity}x <strong>{item.product_name}</strong>
                      </span>
                      <span className="text-amber-400">
                        {item.quantity * item.unit_price} {item.currency}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}