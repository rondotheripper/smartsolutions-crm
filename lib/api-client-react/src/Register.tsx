import React, { useState } from "react";
import { motion } from "framer-motion";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const criarConta = async () => {
    if (!email || !password) {
      setError("Preenche o email e a password");
      return;
    }
    if (!email.endsWith("@cmobile.pt")) {
      setError("Só são permitidos emails @cmobile.pt");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        localStorage.setItem("token", data.token);
        setTimeout(() => {
          window.location.href = "/";
        }, 1500);
      } else {
        setError(data.error || "Erro ao criar conta");
      }
    } catch (err) {
      setError("Erro ao ligar ao servidor. Tenta novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <h2 className="text-2xl font-bold text-green-500">Conta criada com sucesso! ✅</h2>
          <p className="mt-4">A redirecionar...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-2xl p-8 w-full max-w-sm"
      >
        <h1 className="text-3xl font-bold text-center mb-8">Criar Conta</h1>

        <div className="space-y-4">
          <input
            type="email"
            placeholder="teuemail@cmobile.pt"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 bg-secondary border border-border rounded-xl focus:outline-none focus:border-primary"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 bg-secondary border border-border rounded-xl focus:outline-none focus:border-primary"
          />

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <button
            onClick={criarConta}
            disabled={isLoading}
            className="w-full py-3 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl disabled:opacity-50"
          >
            {isLoading ? "A criar conta..." : "Criar conta"}
          </button>

          <button
            onClick={() => window.location.reload()}
            className="w-full py-3 bg-secondary text-foreground font-semibold rounded-xl border border-border"
          >
            Voltar ao Login
          </button>
        </div>
      </motion.div>
    </div>
  );
}