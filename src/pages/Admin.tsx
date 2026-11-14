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
  Pencil,
  X,
  Share2,
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

  // Estados de Produtos (Criação e Edição)
  const [products, setProducts] = useState<Product[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Dinos');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('Elementos');
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

  function startEditing(product: Product) {
    setEditingProduct(product);
    setName(product.name);
    setCategory(product.category);
    setDescription(product.description || '');
    setPrice(String(product.price));
    setCurrency(product.currency);
    setStock(String(product.stock));
    setImageFile(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancelEditing() {
    setEditingProduct(null);
    setName('');
    setCategory('Dinos');
    setDescription('');
    setPrice('');
    setCurrency('Elementos');
    setStock('1');
    setImageFile(null);
  }

  async function handleSaveProduct(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      let imageUrl = editingProduct ? editingProduct.image_url : null;
      if (imageFile) {
        imageUrl = await uploadProductImage(imageFile);
      }

      if (editingProduct) {
        // Atualizar produto existente
        const { error } = await supabase
          .from('products')
          .update({
            name,
            category,
            description,
            price: Number(price),
            currency,
            stock: Number(stock),
            image_url: imageUrl,
          })
          .eq('id', editingProduct.id);

        if (error) throw error;
      } else {
        // Criar novo produto
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
      }

      cancelEditing();
      fetchProducts();
    } catch (err: any) {
      alert('Erro ao salvar produto: ' + err.message);
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
      alert('Não é possível excluir um produto que já possui pedidos. Oculte-o em vez disso.');
    } else {
      if (editingProduct?.id === productId) cancelEditing();
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

  // >>> FUNÇÃO ADICIONADA AQUI <<<
  function shareOrderToWhatsAppGroup(order: OrderAdmin) {
    const itemsText = order.order_items
      .map(
        (i) =>
          `• ${i.quantity}x ${i.product_name} (${(
            i.quantity * i.unit_price
          ).toLocaleString('pt-BR')} ${i.currency})`
      )
      .join('\n');

    const msg =
      `🦖 *ENTREGA PENDENTE — LOJA ANCESTRAIS*\n\n` +
      `👤 *Cliente:* ${order.profiles?.survivor_name}\n` +
      `🏰 *Tribo:* ${order.profiles?.tribe_name || 'Sem tribo'}\n` +
      `💬 *Discord:* ${order.profiles?.discord}\n` +
      `📍 *TP / Local:* ${order.delivery_info}\n\n` +
      `*Itens:*\n${itemsText}`;

    // Sem parâmetro "phone", o WhatsApp abre a lista para escolher direto o Grupo da Tribo!
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
  }

  if (authLoading) return null;
  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <main className="max-w-[1100px] mx-auto p-[18px] space-y-6">
      {/* Abas */}
      <div className="flex gap-2.5 border-b border-[#3a392f] pb-3.5">
        <button
          onClick={() => setTab('products')}
          className={`flex items-center gap-2 text-sm ${
            tab === 'products' ? 'btn-gold' : 'btn-secondary'
          }`}
        >
          <Package className="w-4 h-4" />
          Estoque & Produtos ({products.length})
        </button>

        <button
          onClick={() => setTab('orders')}
          className={`flex items-center gap-2 text-sm ${
            tab === 'orders' ? 'btn-gold' : 'btn-secondary'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          Pedidos ({orders.filter((o) => o.status === 'pending').length} pendentes)
        </button>
      </div>

      {tab === 'products' ? (
        <div className="grid md:grid-cols-3 gap-6">
          {/* Formulário de Cadastro / Edição */}
          <form
            onSubmit={handleSaveProduct}
            className="ancestral-card p-5 space-y-3.5 h-fit"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-ancestral text-lg font-bold text-[#f0d99e] m-0 flex items-center gap-2">
                {editingProduct ? (
                  <>
                    <Pencil className="w-4 h-4 text-[#d5b36b]" />
                    Editar Item
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5 text-[#d5b36b]" />
                    Cadastrar Item
                  </>
                )}
              </h2>

              {editingProduct && (
                <button
                  type="button"
                  onClick={cancelEditing}
                  className="text-xs text-[#b8b3a5] hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  <X className="w-4 h-4" /> Cancelar
                </button>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#e3d6b8] mb-1">
                Nome do Dino / Item *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Shadowmane (Nível 300+)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="ancestral-input text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#e3d6b8] mb-1">
                  Categoria *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="ancestral-input text-sm"
                >
                  <option value="Dinos">Dinos</option>
                  <option value="Blueprints">Blueprints</option>
                  <option value="Recursos">Recursos</option>
                  <option value="Estruturas">Estruturas</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#e3d6b8] mb-1">
                  Estoque *
                </label>
                <input
                  type="number"
                  min={0}
                  required
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  className="ancestral-input text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#e3d6b8] mb-1">
                  Preço (Valor) *
                </label>
                <input
                  type="number"
                  min={0}
                  step="any"
                  required
                  placeholder="Ex: 3500"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="ancestral-input text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#e3d6b8] mb-1">
                  Moeda In-Game *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Elementos, Polímero..."
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="ancestral-input text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#e3d6b8] mb-1">
                Descrição / Status
              </label>
              <textarea
                rows={3}
                placeholder="Detalhes de status, mutações, nível..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="ancestral-input text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#e3d6b8] mb-1">
                {editingProduct ? 'Trocar Imagem (Opcional)' : 'Imagem do Produto'}
              </label>
              <label className="flex items-center justify-center gap-2 w-full bg-[#11130f] border border-dashed border-[#514b39] hover:border-[#d5b36b] rounded-lg p-3 text-xs text-[#b8b3a5] cursor-pointer">
                <ImageIcon className="w-4 h-4 text-[#d5b36b]" />
                <span className="truncate">
                  {imageFile
                    ? imageFile.name
                    : editingProduct?.image_url
                    ? 'Manter imagem atual ou escolher outra...'
                    : 'Escolher print / foto...'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </label>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={submitting}
                className="btn-gold w-full text-sm"
              >
                {submitting
                  ? 'Salvando...'
                  : editingProduct
                  ? 'Salvar Alterações'
                  : 'Adicionar à Loja'}
              </button>
            </div>
          </form>

          {/* Lista de Produtos */}
          <div className="md:col-span-2 space-y-3">
            {products.length === 0 ? (
              <div className="ancestral-card p-8 text-center text-[#b8b3a5]">
                Nenhum produto cadastrado ainda.
              </div>
            ) : (
              products.map((p) => (
                <div
                  key={p.id}
                  className={`ancestral-card p-4 flex flex-wrap sm:flex-nowrap items-center justify-between gap-4 ${
                    editingProduct?.id === p.id
                      ? '!border-[#d5b36b] ring-1 ring-[#d5b36b]'
                      : !p.active
                      ? 'opacity-60'
                      : ''
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {p.image_url ? (
                      <img
                        src={p.image_url}
                        alt={p.name}
                        className="w-14 h-14 rounded-lg object-cover bg-[#11130f] border border-[#3a392f] shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-[#11130f] border border-[#3a392f] flex items-center justify-center text-[#514b39] shrink-0">
                        <Package className="w-6 h-6" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border border-[#655738] text-[#f0d99e]">
                        {p.category}
                      </span>
                      <h3 className="font-bold text-[#f6f0e2] truncate mt-1">
                        {p.name}
                      </h3>
                      <p className="text-xs text-[#d5b36b] font-bold">
                        {p.price.toLocaleString('pt-BR')} {p.currency}
                      </p>
                    </div>
                  </div>

                  {/* Ações: Estoque, Editar, Ativar/Ocultar e Excluir */}
                  <div className="flex items-center gap-2 shrink-0 ml-auto">
                    <div className="flex items-center gap-2 bg-[#11130f] border border-[#3a392f] px-2.5 py-1 rounded-lg">
                      <button
                        onClick={() => updateStock(p.id, p.stock - 1)}
                        className="text-[#b8b3a5] hover:text-white cursor-pointer"
                        title="Diminuir estoque"
                      >
                        <MinusCircle className="w-4 h-4" />
                      </button>
                      <span className="text-sm font-bold w-6 text-center text-[#f6f0e2]">
                        {p.stock}
                      </span>
                      <button
                        onClick={() => updateStock(p.id, p.stock + 1)}
                        className="text-[#b8b3a5] hover:text-white cursor-pointer"
                        title="Aumentar estoque"
                      >
                        <PlusCircle className="w-4 h-4" />
                      </button>
                    </div>

                    <button
                      onClick={() => startEditing(p)}
                      title="Editar item"
                      className="btn-secondary !p-2 text-[#f0d99e]"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => toggleActive(p.id, p.active)}
                      className={`text-xs px-2.5 py-1.5 rounded-lg border font-semibold cursor-pointer ${
                        p.active
                          ? 'border-[#78bd83]/40 bg-[#1d2e20] text-[#78bd83]'
                          : 'border-[#3a392f] bg-[#11130f] text-[#b8b3a5]'
                      }`}
                    >
                      {p.active ? 'Ativo' : 'Oculto'}
                    </button>

                    <button
                      onClick={() => deleteProduct(p.id)}
                      title="Excluir item"
                      className="text-[#b8b3a5] hover:text-red-400 p-1.5 cursor-pointer"
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
            <div className="ancestral-card p-8 text-center text-[#b8b3a5]">
              Nenhum pedido recebido até o momento.
            </div>
          ) : (
            orders.map((o) => (
              <div key={o.id} className="ancestral-card p-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#3a392f] pb-3">
                  <div>
                    <span className="text-sm font-bold text-[#f6f0e2]">
                      Sobrevivente: {o.profiles?.survivor_name}
                    </span>
                    <span className="ml-3 text-xs bg-[#282419] text-[#f0d99e] border border-[#655738] px-2.5 py-0.5 rounded-full">
                      Discord: {o.profiles?.discord}
                    </span>
                    {o.profiles?.tribe_name && (
                      <span className="ml-2 text-xs text-[#b8b3a5]">
                        (Tribo: {o.profiles.tribe_name})
                      </span>
                    )}
                    <p className="text-xs text-[#d5b36b] mt-1">
                      Entrega / TP: <strong>{o.delivery_info}</strong>
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
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
                        ? 'Pendente'
                        : o.status === 'delivered'
                        ? 'Entregue'
                        : 'Cancelado'}
                    </span>

                    {/* >>> BOTÃO MANDAR NO GRUPO ADICIONADO AQUI <<< */}
                    <button
                      onClick={() => shareOrderToWhatsAppGroup(o)}
                      className="btn-secondary !py-1.5 !px-3 text-xs flex items-center gap-1"
                      title="Escolher grupo da tribo no WhatsApp"
                    >
                      <Share2 className="w-3.5 h-3.5 text-[#d5b36b]" /> Mandar no Grupo
                    </button>

                    {o.status === 'pending' && (
                      <>
                        <button
                          onClick={() => markOrderDelivered(o.id)}
                          className="btn-gold !py-1.5 !px-3 text-xs flex items-center gap-1"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> Entregue
                        </button>
                        <button
                          onClick={() => handleCancelOrder(o.id)}
                          className="btn-secondary !py-1.5 !px-3 text-xs flex items-center gap-1 text-red-300"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Cancelar
                        </button>
                      </>
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
                        {(item.quantity * item.unit_price).toLocaleString('pt-BR')}{' '}
                        {item.currency}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </main>
  );
}