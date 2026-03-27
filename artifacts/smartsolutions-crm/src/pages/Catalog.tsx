import React, { useState } from "react";
import { useListProducts } from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, Badge, Button } from "@/components/ui/core";
import { formatCurrency } from "@/lib/utils";
import { ShieldCheck, Cloud, Server, Plus } from "lucide-react";

const CATEGORIES = [
  { key: "Cibersegurança", label: "Cibersegurança", icon: ShieldCheck },
  { key: "Microsoft 365", label: "Microsoft 365", icon: Cloud },
];

export default function Catalog() {
  const { data: products, isLoading } = useListProducts();
  const [activeTab, setActiveTab] = useState("Cibersegurança");

  const filtered = products?.filter(p => p.category === activeTab) ?? [];

  const getCategoryIcon = (category: string) => {
    if (category.toLowerCase().includes("cibersegurança")) return ShieldCheck;
    if (category.toLowerCase().includes("microsoft")) return Cloud;
    return Server;
  };

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Catálogo de Produtos</h1>
            <p className="text-muted-foreground mt-1">Soluções Smart Solutions Vodafone</p>
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Produto
          </Button>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-1 bg-card border border-border rounded-xl p-1 w-fit">
          {CATEGORIES.map(({ key, label, icon: Icon }) => {
            const count = products?.filter(p => p.category === key).length ?? 0;
            const isActive = activeTab === key;
            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? "bg-primary text-white shadow"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
                <span className={`ml-1 text-xs rounded-full px-2 py-0.5 font-bold ${
                  isActive ? "bg-white/20 text-white" : "bg-secondary text-muted-foreground"
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Section header */}
        <div className="flex items-center gap-3">
          {(() => {
            const cat = CATEGORIES.find(c => c.key === activeTab);
            const Icon = cat?.icon ?? Server;
            return (
              <>
                <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">{activeTab}</h2>
                  <p className="text-xs text-muted-foreground">{filtered.length} produto{filtered.length !== 1 ? "s" : ""} disponíve{filtered.length !== 1 ? "is" : "l"}</p>
                </div>
              </>
            );
          })()}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <div key={i} className="h-80 bg-muted animate-pulse rounded-2xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-2xl border border-border">
            <p className="text-muted-foreground">Nenhum produto nesta categoria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filtered.map((product) => {
              const Icon = getCategoryIcon(product.category);
              return (
                <Card key={product.id} className="flex flex-col group glass-panel-hover">
                  <div className="p-6 pb-0 flex justify-between items-start">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center border border-primary/20 group-hover:scale-110 transition-transform duration-300">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <Badge variant={product.active ? "success" : "outline"}>
                      {product.active ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>

                  <CardHeader>
                    <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">{product.category}</p>
                    <CardTitle className="line-clamp-2">{product.name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{product.shortDescription}</p>
                  </CardHeader>

                  <CardContent className="flex-1 flex flex-col justify-end">
                    <div className="bg-secondary/50 rounded-xl p-4 mt-4 border border-border/50">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground uppercase font-semibold">Preço Base</span>
                        <span className="text-lg font-bold text-foreground">{formatCurrency(product.price)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground text-right mt-1">Modelo: {product.pricingType}</p>
                    </div>

                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
