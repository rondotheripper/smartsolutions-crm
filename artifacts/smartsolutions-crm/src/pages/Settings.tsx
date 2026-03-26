import React from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, Input, Button } from "@/components/ui/core";
import { Building, Mail, Users, Settings2, ShieldCheck } from "lucide-react";

export default function Settings() {
  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-[1000px] mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Definições</h1>
          <p className="text-muted-foreground mt-1">Configure o seu CRM e preferências</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Settings Sidebar */}
          <div className="space-y-2">
            {[
              { icon: Building, label: "Empresa", active: true },
              { icon: Mail, label: "Email & SMTP", active: false },
              { icon: Users, label: "Utilizadores", active: false },
              { icon: ShieldCheck, label: "Segurança", active: false },
              { icon: Settings2, label: "Preferências", active: false },
            ].map((item, i) => (
              <button 
                key={i}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${item.active ? 'bg-primary/10 text-primary border border-primary/20' : 'text-muted-foreground hover:bg-secondary hover:text-foreground border border-transparent'}`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            ))}
          </div>

          {/* Settings Content */}
          <div className="md:col-span-3 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Dados da Empresa</CardTitle>
                <p className="text-sm text-muted-foreground">Informações usadas na emissão de propostas e emails.</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Nome da Empresa</label>
                    <Input defaultValue="Vodafone Smart Solutions" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">NIF</label>
                    <Input defaultValue="500000000" />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <label className="text-sm font-medium">Morada</label>
                    <Input defaultValue="Parque das Nações, Lisboa" />
                  </div>
                </div>
                <Button>Guardar Alterações</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Assinatura de Email</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <textarea 
                    className="flex w-full rounded-xl border border-border bg-secondary/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary h-32 resize-none font-mono"
                    defaultValue={`João Diretor\nGestor Comercial | Smart Solutions\nVodafone Portugal\nTel: +351 910 000 000`}
                  />
                </div>
                <Button>Atualizar Assinatura</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
