import React from "react";
import { useListProducts } from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, Badge, Button } from "@/components/ui/core";
import { formatCurrency } from "@/lib/utils";
import { ShieldCheck, Cloud, Server, Plus } from "lucide-react";

export default function Catalog() {
  const { data: products, isLoading } = useListProducts();

  const getCategoryIcon = (category: string) => {
    if (category.toLowerCase().includes('cibersegurança')) return ShieldCheck;
    if (category.toLowerCase().includes('microsoft')) return Cloud;
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

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <div key={i} className="h-80 bg-muted animate-pulse rounded-2xl"></div>)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {products?.map((product) => {
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
                    
                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <Button variant="secondary" className="w-full">Detalhes</Button>
                      <Button variant="outline" className="w-full">Criar Proposta</Button>
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
