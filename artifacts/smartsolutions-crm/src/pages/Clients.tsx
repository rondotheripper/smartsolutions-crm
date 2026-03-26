import React, { useState } from "react";
import { useListClients, useCreateClient, useDeleteClient } from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button, Input, Select, Badge, Modal } from "@/components/ui/core";
import { Plus, Search, Trash2, Edit, Phone, Mail, Building } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

export default function Clients() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const { data: clients, isLoading } = useListClients({ search: search || undefined });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const createMutation = useCreateClient({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
        setIsModalOpen(false);
      }
    }
  });

  const deleteMutation = useDeleteClient({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/clients"] })
    }
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createMutation.mutate({
      data: {
        fullName: fd.get("fullName") as string,
        companyName: fd.get("companyName") as string,
        email: fd.get("email") as string,
        phone: fd.get("phone") as string,
        segment: fd.get("segment") as string,
        leadSource: fd.get("leadSource") as string,
        interestedProduct: fd.get("interestedProduct") as string,
        pipelineStatus: "chamada_efectuada",
        ownerName: "João Diretor"
      }
    });
  };

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Clientes</h1>
            <p className="text-muted-foreground mt-1">Gestão de base de dados e contactos</p>
          </div>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Cliente
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 bg-card p-4 rounded-2xl border border-border shadow-lg">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Pesquisar por nome, empresa ou email..." 
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select className="w-full sm:w-48">
            <option value="">Todos os Segmentos</option>
            <option value="corporate">Corporate</option>
            <option value="sme">SME</option>
            <option value="soho">SoHo</option>
          </Select>
          <Select className="w-full sm:w-48">
            <option value="">Todos os Estados</option>
            <option value="chamada_efectuada">Chamada Efectuada</option>
            <option value="cliente_interessado">Interessado</option>
          </Select>
        </div>

        <div className="bg-card rounded-2xl border border-border shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-secondary/50 border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-semibold">Cliente / Empresa</th>
                  <th className="px-6 py-4 font-semibold">Contactos</th>
                  <th className="px-6 py-4 font-semibold">Produto</th>
                  <th className="px-6 py-4 font-semibold">Estado Pipeline</th>
                  <th className="px-6 py-4 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">A carregar...</td></tr>
                ) : clients?.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Nenhum cliente encontrado.</td></tr>
                ) : (
                  clients?.map((client) => (
                    <tr key={client.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-foreground">{client.fullName}</p>
                        <p className="text-xs text-muted-foreground flex items-center mt-1"><Building className="w-3 h-3 mr-1" /> {client.companyName}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="flex items-center text-xs"><Phone className="w-3 h-3 mr-1.5 text-muted-foreground" /> {client.phone}</p>
                        <p className="flex items-center text-xs mt-1"><Mail className="w-3 h-3 mr-1.5 text-muted-foreground" /> {client.email}</p>
                      </td>
                      <td className="px-6 py-4 font-medium text-primary">
                        {client.interestedProduct}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={client.pipelineStatus === 'cliente_interessado' ? 'success' : client.pipelineStatus === 'cliente_nao_interessado' ? 'danger' : 'default'}>
                          {client.pipelineStatus.replace(/_/g, ' ').toUpperCase()}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="icon" variant="ghost" className="h-8 w-8"><Edit className="w-4 h-4" /></Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => {
                            if(confirm("Tem a certeza que deseja apagar?")) deleteMutation.mutate({ id: client.id });
                          }}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Adicionar Novo Cliente">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-muted-foreground">Nome Completo</label>
              <Input name="fullName" required />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-muted-foreground">Empresa</label>
              <Input name="companyName" required />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-muted-foreground">Email</label>
              <Input name="email" type="email" required />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-muted-foreground">Telefone</label>
              <Input name="phone" required />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-muted-foreground">Segmento</label>
              <Select name="segment" required>
                <option value="SME">SME</option>
                <option value="Corporate">Corporate</option>
                <option value="SoHo">SoHo</option>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-muted-foreground">Origem do Lead</label>
              <Select name="leadSource" required>
                <option value="Inbound">Inbound</option>
                <option value="Outbound">Outbound</option>
                <option value="Parceria">Parceria</option>
              </Select>
            </div>
            <div className="col-span-2 space-y-1">
              <label className="text-sm font-medium text-muted-foreground">Produto de Interesse</label>
              <Select name="interestedProduct" required>
                <option value="Cibersegurança Avançada">Cibersegurança Avançada</option>
                <option value="Microsoft 365 Business">Microsoft 365 Business</option>
                <option value="SD-WAN">SD-WAN</option>
              </Select>
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-3 border-t border-border">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button type="submit" isLoading={createMutation.isPending}>Guardar Cliente</Button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}
