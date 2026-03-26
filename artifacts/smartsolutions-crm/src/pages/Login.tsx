import React from "react";
import { useAuth } from "@workspace/replit-auth-web";
import { motion } from "framer-motion";
import { Users, GitBranch, FileText, Bell } from "lucide-react";

export default function Login() {
  const { login } = useAuth();

  const features = [
    { icon: Users, label: "Gestão de Clientes" },
    { icon: GitBranch, label: "Pipeline Comercial" },
    { icon: FileText, label: "Propostas" },
    { icon: Bell, label: "Follow-ups" },
  ];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-card border border-border rounded-2xl p-8 shadow-2xl shadow-black/40"
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl font-display font-bold text-gradient">SmartSolutions</h1>
            <p className="text-xs font-medium text-muted-foreground tracking-widest uppercase mt-1">CRM Comercial</p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-8">
            {features.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 p-3 bg-secondary/50 rounded-xl border border-border/50">
                <Icon className="w-4 h-4 text-primary shrink-0" />
                <span className="text-xs text-muted-foreground font-medium">{label}</span>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <button
              onClick={login}
              className="w-full py-3 px-4 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:scale-[1.02] active:scale-[0.98]"
            >
              Entrar na conta
            </button>
            <button
              onClick={login}
              className="w-full py-3 px-4 bg-secondary hover:bg-secondary/80 text-foreground font-semibold rounded-xl border border-border transition-all duration-200 hover:border-primary/40"
            >
              Criar conta
            </button>
          </div>

          <p className="text-xs text-muted-foreground text-center mt-6">
            Plataforma de gestão comercial Vodafone Smart Solutions
          </p>
        </motion.div>
      </div>
    </div>
  );
}
