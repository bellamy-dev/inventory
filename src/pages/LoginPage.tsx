import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }
    setLoading(true);
    try {
      await login(username, password);
      toast.success("Connexion réussie !");
      navigate("/inventaire");
    } catch (err) {
      toast.error((err as any)?.response?.data?.error || "Identifiants incorrects");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gta-bg">
      <div className="w-full max-w-sm mx-4">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gta-accent text-white font-bold text-2xl">
              DC
            </div>
          </div>
          <h1 className="text-2xl font-bold">Diamond City RP</h1>
          <p className="text-gta-text-dim text-sm mt-1">Gestion de Stock</p>
        </div>

        <form onSubmit={handleSubmit} className="gta-card space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gta-text-dim">Pseudo</label>
            <input
              type="text"
              className="gta-input"
              placeholder="Entrez votre pseudo"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gta-text-dim">Mot de passe</label>
            <input
              type="password"
              className="gta-input"
              placeholder="Entrez votre mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="gta-btn-primary w-full"
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>
      </div>
    </div>
  );
}
