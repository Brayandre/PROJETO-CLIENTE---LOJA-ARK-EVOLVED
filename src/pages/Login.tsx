import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { LogIn, UserPlus, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

export function Login() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [survivorName, setSurvivorName] = useState('');
  const [tribeName, setTribeName] = useState('');
  const [discord, setDiscord] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (isRegistering && password !== confirmPassword) {
      setError('As senhas digitadas não coincidem.');
      return;
    }

    setLoading(true);

    try {
      if (isRegistering) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              survivor_name: survivorName,
              tribe_name: tribeName || null,
              discord: discord,
            },
          },
        });
        if (signUpError) throw signUpError;
        setSuccessMsg('Conta criada com sucesso! Entrando...');
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        setSuccessMsg('Login confirmado! Redirecionando...');
      }

      setTimeout(() => {
        navigate('/');
      }, 900);
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro na autenticação.');
      setLoading(false);
    }
  }

  return (
    <main className="max-w-md mx-auto p-4 my-6">
      <div className="ancestral-card p-6 shadow-xl">
        <div className="text-center mb-6">
          <h1 className="font-ancestral text-2xl font-bold text-[#f0d99e]">
            {isRegistering ? 'Cadastro de Sobrevivente' : 'Acesso à Loja Ancestrais'}
          </h1>
          <p className="text-xs text-[#b8b3a5] mt-1">
            {isRegistering
              ? 'Preencha seus dados do jogo para fazer encomendas'
              : 'Entre com sua conta para reservar criaturas e itens'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-950/60 border border-red-700/50 text-red-300 text-sm">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-lg bg-[#1d2e20] border border-[#78bd83]/40 text-[#78bd83] text-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {isRegistering && (
            <>
              <div>
                <label className="block text-[13px] font-semibold text-[#e3d6b8] mb-1">
                  Nome do personagem (In-Game) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Bob Praiano"
                  value={survivorName}
                  onChange={(e) => setSurvivorName(e.target.value)}
                  className="ancestral-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13px] font-semibold text-[#e3d6b8] mb-1">
                    Seu Discord *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="carlao1234"
                    value={discord}
                    onChange={(e) => setDiscord(e.target.value)}
                    className="ancestral-input"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-[#e3d6b8] mb-1">
                    Nome da Tribo
                  </label>
                  <input
                    type="text"
                    placeholder="Opcional"
                    value={tribeName}
                    onChange={(e) => setTribeName(e.target.value)}
                    className="ancestral-input"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-[13px] font-semibold text-[#e3d6b8] mb-1">
              E-mail *
            </label>
            <input
              type="email"
              required
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="ancestral-input"
            />
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-[#e3d6b8] mb-1">
              Senha *
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="ancestral-input !pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#b8b3a5] hover:text-[#f0d99e] cursor-pointer"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {isRegistering && (
            <div>
              <label className="block text-[13px] font-semibold text-[#e3d6b8] mb-1">
                Confirmar Senha *
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  placeholder="Repita a senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="ancestral-input !pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#b8b3a5] hover:text-[#f0d99e] cursor-pointer"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-gold w-full flex items-center justify-center gap-2 mt-2"
          >
            {isRegistering ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
            {loading ? 'Aguarde...' : isRegistering ? 'Criar Conta' : 'Entrar'}
          </button>
        </form>

        <div className="mt-5 text-center">
          <button
            type="button"
            onClick={() => {
              setIsRegistering(!isRegistering);
              setError('');
              setSuccessMsg('');
            }}
            className="text-sm text-[#d5b36b] hover:underline cursor-pointer"
          >
            {isRegistering ? 'Já tem conta? Faça login' : 'Não tem conta? Cadastre-se'}
          </button>
        </div>
      </div>
    </main>
  );
}