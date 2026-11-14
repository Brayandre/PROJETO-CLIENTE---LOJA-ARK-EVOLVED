import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import type { Product } from './Admin';
import {
  ShoppingCart,
  Search,
  Package,
  Plus,
  Minus,
  Trash2,
  X,
  CheckCircle2,
  MapPin,
  MessageCircle,
} from 'lucide-react';

interface CartItem {
  product: Product;
  quantity: number;
}

const STORE_WHATSAPP = '5512981862927';

const CATEGORIES = ['Todos', 'Dinos', 'Blueprints', 'Recursos', 'Estruturas'];

export function Store() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [search, setSearch] = useState('');

  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [deliveryInfo, setDeliveryInfo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [lastWhatsappUrl, setLastWhatsappUrl] = useState('');

  useEffect(() => {
    fetchActiveProducts();
  }, []);

  async function fetchActiveProducts() {
    setLoading(true);
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false });

    if (data) setProducts(data);
    setLoading(false);
  }

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev;
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  }

  function updateCartQty(productId: number, delta: number) {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id !== productId) return item;
          const nextQty = item.quantity + delta;
          if (nextQty > item.product.stock) return item;
          return { ...item, quantity: nextQty };
        })
        .filter((item) => item.quantity > 0)
    );
  }

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    if (cart.length === 0) return;

    setSubmitting(true);
    try {
      const payload = cart.map((item) => ({
        product_id: item.product.id,
        quantity: item.quantity,
      }));

      const { error } = await supabase.rpc('create_order', {
        p_delivery_info: deliveryInfo,
        p_items: payload,
      });

      if (error) throw error;

      // Monta a mensagem formatada para o WhatsApp
      const itemsList = cart
        .map(
          (i) =>
            `• ${i.quantity}x ${i.product.name} — ${(
              i.product.price * i.quantity
            ).toLocaleString('pt-BR')} ${i.product.currency}`
        )
        .join('\n');

      const survivor = profile?.survivor_name || user.email || 'Sobrevivente';
      const tribe = profile?.tribe_name || 'Sem tribo';
      const discord = profile?.discord || 'Não informado';

      const fullMessage =
        `🦖 *LOJA ANCESTRAIS — NOVO PEDIDO*\n\n` +
        `*Itens:*\n${itemsList}\n\n` +
        `*DADOS PARA ENTREGA*\n` +
        `👤 Personagem: ${survivor}\n` +
        `🏰 Tribo: ${tribe}\n` +
        `💬 Discord: ${discord}\n` +
        `📍 TP / Local: ${deliveryInfo}\n\n` +
        `Aguardo confirmação para entrega!`;

      const waUrl = `https://wa.me/${STORE_WHATSAPP}?text=${encodeURIComponent(fullMessage)}`;
      setLastWhatsappUrl(waUrl);

      setCart([]);
      setDeliveryInfo('');
      setOrderSuccess(true);
      fetchActiveProducts();

      // Abre o WhatsApp automaticamente igual ao HTML original
      window.open(waUrl, '_blank');
    } catch (err: any) {
      alert(err.message || 'Erro ao fechar pedido.');
    } finally {
      setSubmitting(false);
    }
  }

  const filteredProducts = products.filter((p) => {
    const matchesCategory =
      selectedCategory === 'Todos' || p.category === selectedCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(search.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const totalItemsInCart = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <main className="max-w-[1100px] mx-auto p-[18px] pb-24">
      <div className="ancestral-hero py-[26px] px-[18px] text-center mb-6">
        <h1 className="font-ancestral text-[#f0d99e] text-[clamp(24px,5vw,38px)] font-bold m-0 mb-2">
          Escolha sua próxima criatura
        </h1>
        <p className="text-[#b8b3a5] m-0 text-sm sm:text-base">
          Escolha o Dino, equipamento ou recurso e faça sua encomenda diretamente pelo painel.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center mb-6">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#b8b3a5] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar criatura, blueprint, recurso..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ancestral-input !pl-10"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={
                selectedCategory === cat
                  ? 'btn-gold !py-2 !px-3.5 text-xs whitespace-nowrap'
                  : 'btn-secondary !py-2 !px-3.5 text-xs whitespace-nowrap'
              }
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <h2 className="font-ancestral text-[#f0d99e] text-2xl font-bold mt-6 mb-3.5">
        Catálogo de criaturas & itens
      </h2>

      {loading ? (
        <div className="text-center py-16 text-[#b8b3a5]">Carregando catálogo...</div>
      ) : filteredProducts.length === 0 ? (
        <div className="ancestral-card p-12 text-center text-[#b8b3a5]">
          Nenhum item encontrado nesta categoria.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
          {filteredProducts.map((product) => {
            const inCart = cart.find((i) => i.product.id === product.id)?.quantity || 0;
            const outOfStock = product.stock === 0;

            return (
              <article
                key={product.id}
                className="ancestral-card p-[15px] flex flex-col justify-between"
              >
                <div>
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-[145px] object-cover rounded-[9px] mb-[11px] bg-[#11130f] border border-[#3a392f]"
                    />
                  ) : (
                    <div className="w-full h-[145px] rounded-[9px] mb-[11px] bg-[#11130f] border border-[#3a392f] flex items-center justify-center">
                      <Package className="w-10 h-10 text-[#514b39]" />
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[11px] uppercase tracking-wider text-[#f0d99e] border border-[#655738] px-2 py-0.5 rounded-full">
                      {product.category}
                    </span>
                    <span
                      className={`text-xs font-semibold ${
                        outOfStock ? 'text-red-400' : 'text-[#78bd83]'
                      }`}
                    >
                      {outOfStock ? 'Esgotado' : `Estoque: ${product.stock}`}
                    </span>
                  </div>

                  <h3 className="font-bold text-lg text-[#f6f0e2] m-0 mb-1">
                    {product.name}
                  </h3>

                  <div className="text-[#d5b36b] text-[21px] font-extrabold">
                    {product.price.toLocaleString('pt-BR')} {product.currency}
                  </div>

                  {product.description && (
                    <div className="text-[#b8b3a5] text-xs mt-1 line-clamp-2">
                      {product.description}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => addToCart(product)}
                  disabled={outOfStock || inCart >= product.stock}
                  className="btn-gold w-full mt-3.5 flex items-center justify-center gap-1.5 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  {inCart > 0 ? `No pedido (${inCart})` : 'Adicionar ao pedido'}
                </button>
              </article>
            );
          })}
        </div>
      )}

      {totalItemsInCart > 0 && (
        <button
          onClick={() => setIsCartOpen(true)}
          className="fixed bottom-5 right-5 z-40 btn-gold !px-5 !py-3.5 shadow-2xl flex items-center gap-2.5"
        >
          <ShoppingCart className="w-5 h-5" />
          <span>Meu pedido ({totalItemsInCart})</span>
        </button>
      )}

      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex justify-end">
          <div className="bg-[#1c1d18] border-l border-[#3a392f] w-full max-w-md h-full flex flex-col justify-between p-5">
            <div className="flex items-center justify-between border-b border-[#3a392f] pb-4">
              <h2 className="font-ancestral text-xl font-bold text-[#f0d99e] m-0 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-[#d5b36b]" />
                Finalizar pedido
              </h2>
              <button
                onClick={() => {
                  setIsCartOpen(false);
                  setOrderSuccess(false);
                }}
                className="text-[#b8b3a5] hover:text-white p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {orderSuccess ? (
              <div className="my-auto text-center space-y-4 p-4">
                <CheckCircle2 className="w-14 h-14 text-[#78bd83] mx-auto" />
                <h3 className="font-ancestral text-2xl font-bold text-[#f0d99e]">
                  Pedido Registrado!
                </h3>
                <p className="text-sm text-[#b8b3a5]">
                  Seu pedido foi salvo no sistema e o WhatsApp foi aberto para você enviar a confirmação. Caso a janela não tenha aberto sozinha, toque no botão abaixo:
                </p>

                <a
                  href={lastWhatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-gold w-full flex items-center justify-center gap-2 no-underline"
                >
                  <MessageCircle className="w-5 h-5" />
                  Abrir WhatsApp e Enviar Pedido
                </a>

                <button
                  onClick={() => {
                    setOrderSuccess(false);
                    setIsCartOpen(false);
                    navigate('/orders');
                  }}
                  className="btn-secondary w-full text-sm"
                >
                  Ver em Meus Pedidos
                </button>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto py-4 space-y-2">
                  {cart.map(({ product, quantity }) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between gap-3 border-b border-[#3a392f] py-2.5 text-sm"
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-[#f6f0e2] truncate">
                          {quantity} × {product.name}
                        </div>
                        <div className="text-xs text-[#d5b36b] font-bold">
                          {(product.price * quantity).toLocaleString('pt-BR')}{' '}
                          {product.currency}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => updateCartQty(product.id, -1)}
                          className="btn-secondary !p-1.5"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-sm font-bold w-5 text-center">
                          {quantity}
                        </span>
                        <button
                          onClick={() => updateCartQty(product.id, 1)}
                          className="btn-secondary !p-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => updateCartQty(product.id, -quantity)}
                          className="text-[#b8b3a5] hover:text-red-400 p-1 ml-1 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleCheckout} className="border-t border-[#3a392f] pt-4 space-y-3">
                  <div>
                    <label className="block text-[13px] font-semibold text-[#e3d6b8] mb-1.5 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#d5b36b]" />
                      Dados para entrega no ARK (Nome do TP / Mapa) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: TP Base Principal - Ragnarok"
                      value={deliveryInfo}
                      onChange={(e) => setDeliveryInfo(e.target.value)}
                      className="ancestral-input"
                    />
                  </div>

                  <div className="ancestral-notice">
                    O pagamento é feito in-game. Ao confirmar, o estoque será reservado e o WhatsApp abrirá com o resumo do pedido.
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-gold w-full"
                  >
                    {submitting
                      ? 'Reservando Estoque...'
                      : user
                      ? 'Enviar pedido pelo WhatsApp'
                      : 'Fazer Login para Encomendar'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}