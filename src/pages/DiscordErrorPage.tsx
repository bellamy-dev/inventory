import { useSearchParams, Link } from "react-router-dom";
import { ShieldAlert } from "lucide-react";

const REASONS: Record<string, { title: string; message: string }> = {
  no_role: {
    title: "Rôle Discord requis",
    message:
      "Tu n'as pas le rôle requis sur le serveur Discord pour accéder à cette application. Contacte un administrateur si tu penses que c'est une erreur.",
  },
  denied: {
    title: "Autorisation refusée",
    message:
      "Tu as refusé l'autorisation Discord. Pour te connecter, tu dois accepter le partage de ton identité Discord.",
  },
  invalid_state: {
    title: "Session expirée",
    message:
      "La session de connexion a expiré ou est invalide. Réessaie en cliquant sur le bouton de connexion.",
  },
  callback_error: {
    title: "Erreur de connexion",
    message:
      "Une erreur est survenue lors de la connexion avec Discord. Réessaie plus tard.",
  },
  not_member: {
    title: "Membre du serveur requis",
    message:
      "Tu dois être membre du serveur Discord associé pour accéder à cette application.",
  },
};

export function DiscordErrorPage() {
  const [searchParams] = useSearchParams();
  const reason = searchParams.get("reason") || "callback_error";
  const { title, message } = REASONS[reason] || REASONS.callback_error;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gta-bg">
      <div className="w-full max-w-sm mx-4 text-center">
        <div className="gta-card space-y-6">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gta-danger/15">
              <ShieldAlert className="h-8 w-8 text-gta-danger" />
            </div>
          </div>

          <div>
            <h1 className="text-xl font-bold mb-2">{title}</h1>
            <p className="text-sm text-gta-text-dim">{message}</p>
          </div>

          <Link
            to="/login"
            className="gta-btn-primary inline-block w-full text-center"
          >
            Retour à la connexion
          </Link>
        </div>
      </div>
    </div>
  );
}
