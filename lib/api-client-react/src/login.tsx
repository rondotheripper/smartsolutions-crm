import React, { useState } from "react";
import { motion } from "framer-motion";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const login = async () => {
    if (!email || !password) {
      setError("Preenche o email e a password");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("token", data.token);
        window.location.href = "/"; // redireciona para dashboard
      } else {
        setError(data.error || "Email ou password incorretos");
      }
    } catch (err) {
      setError("Erro ao ligar ao servidor. Tenta novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-2xl p-8 w-full max-w-sm"
      >
        <h1 className="text-3xl font-bold text-center mb-8">Login</h1>

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
            onClick={login}
            disabled={isLoading}
            className="w-full py-3 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl disabled:opacity-50"
          >
            {isLoading ? "A entrar..." : "Entrar"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
