import React, { useState, useEffect } from "react";
import { useListClients, useCreateClient, useDeleteClient } from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button, Input, Select, Badge, Modal } from "@/components/ui/core";
import { Plus, Search, Trash2, Phone, Mail, Building2, X, Building, Tag, Calendar } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useSearch, useLocation } from "wouter";
import { useAuth } from "@workspace/replit-auth-web";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

const PIPELINE_LABELS: Record<string, string> = {
  chamada_efectuada: "Chamada Efectuada",
  cliente_nao_interessado: "Não Interessado",
  cliente_interessado: "Interessado",
  chamada_followup: "Follow-up",
};

export default function Clients() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [, navigate] = useLocation();
  const searchStr = useSearch();

  const { data: clients, isLoading } = useListClients({ search: search || undefined });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewClient, setViewClient] = useState<number | null>(null);

  // Open client detail from URL param (e.g. from Pipeline click)
  useEffect(() => {
    const params = new URLSearchParams(searchStr);
    const viewId = params.get("view");
    if (viewId) {
      setViewClient(parseInt(viewId));
      // Clean URL after reading param
      navigate("/clientes", { replace: true });
    }
  }, [searchStr]);

  const selectedClient = clients?.find((c) => c.id === viewClient) ?? null;

  const createMutation = useCreateClient({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
        setIsModalOpen(false);
      },
    },
  });

  const deleteMutation = useDeleteClient({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/clients"] }),
    },
  });

  const ownerName = user
    ? [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email || "Comercial"
    : "Comercial";

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
        ownerName,
      },
    });
  };

  const pipelineBadgeVariant = (status: string) => {
    if (status === "cliente_interessado") return "success";
    if (status === "cliente_nao_interessado") return "danger";
    return "default";
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

        {/* Search only */}
        <div className="flex bg-card p-4 rounded-2xl border border-border shadow-lg">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar por nome, empresa ou email..."
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
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
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">A carregar...</td>
                  </tr>
                ) : clients?.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">Nenhum cliente encontrado.</td>
                  </tr>
                ) : (
                  clients?.map((client) => (
                    <tr
                      key={client.id}
                      className="border-b border-border/50 hover:bg-secondary/30 transition-colors cursor-pointer"
                      onClick={() => setViewClient(client.id)}
                    >
                      <td className="px-6 py-4">
                        <p className="font-semibold text-foreground hover:text-primary transition-colors">{client.fullName}</p>
                        <p className="text-xs text-muted-foreground flex items-center mt-1">
                          <Building className="w-3 h-3 mr-1" /> {client.companyName}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="flex items-center text-xs">
                          <Phone className="w-3 h-3 mr-1.5 text-muted-foreground" /> {client.phone}
                        </p>
                        <p className="flex items-center text-xs mt-1">
                          <Mail className="w-3 h-3 mr-1.5 text-muted-foreground" /> {client.email}
                        </p>
                      </td>
                      <td className="px-6 py-4 font-medium text-primary">{client.interestedProduct}</td>
                      <td className="px-6 py-4">
                        <Badge variant={pipelineBadgeVariant(client.pipelineStatus)}>
                          {PIPELINE_LABELS[client.pipelineStatus] ?? client.pipelineStatus}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm("Tem a certeza que deseja apagar este cliente?"))
                              deleteMutation.mutate({ id: client.id });
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Client Detail Modal */}
      <Modal isOpen={!!viewClient && !!selectedClient} onClose={() => setViewClient(null)} title="Ficha de Cliente">
        {selectedClient && (
          <div className="space-y-5">
            <div className="flex items-center gap-4 pb-4 border-b border-border">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <span className="text-xl font-bold text-primary">
                  {selectedClient.fullName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">{selectedClient.fullName}</h3>
                <p className="text-muted-foreground text-sm flex items-center gap-1.5 mt-0.5">
                  <Building2 className="w-3.5 h-3.5" /> {selectedClient.companyName}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Telefone</p>
                <p className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-primary" /> {selectedClient.phone}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email</p>
                <p className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-primary" /> {selectedClient.email}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Segmento</p>
                <p className="flex items-center gap-2 text-sm">
                  <Tag className="w-4 h-4 text-primary" /> {selectedClient.segment || "—"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Origem</p>
                <p className="text-sm">{selectedClient.leadSource || "—"}</p>
              </div>
              <div className="col-span-2 space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Produto de Interesse</p>
                <p className="text-sm font-medium text-primary">{selectedClient.interestedProduct}</p>
              </div>
              <div className="col-span-2 space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Estado Pipeline</p>
                <Badge variant={pipelineBadgeVariant(selectedClient.pipelineStatus)}>
                  {PIPELINE_LABELS[selectedClient.pipelineStatus] ?? selectedClient.pipelineStatus}
                </Badge>
              </div>
              {selectedClient.nextFollowupDate && (
                <div className="col-span-2 space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Próximo Follow-up</p>
                  <p className="flex items-center gap-2 text-sm text-amber-400 font-medium">
                    <Calendar className="w-4 h-4" />
                    {format(new Date(selectedClient.nextFollowupDate), "d 'de' MMMM 'às' HH:mm", { locale: pt })}
                  </p>
                </div>
              )}
              {selectedClient.notes && (
                <div className="col-span-2 space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Notas</p>
                  <p className="text-sm text-muted-foreground bg-secondary/50 rounded-xl p-3 border border-border">{selectedClient.notes}</p>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-border">
              <Button
                variant="ghost"
                className="text-destructive hover:bg-destructive/10"
                onClick={() => {
                  if (confirm(`Apagar "${selectedClient.fullName}"?`)) {
                    deleteMutation.mutate({ id: selectedClient.id });
                    setViewClient(null);
                  }
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" /> Apagar Cliente
              </Button>
              <Button variant="secondary" onClick={() => setViewClient(null)}>Fechar</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Create Client Modal */}
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
                <optgroup label="Cibersegurança">
                  <option value="Vodafone Lookout">Vodafone Lookout</option>
                  <option value="Vodafone Trend-Micro">Vodafone Trend-Micro</option>
                  <option value="Vodafone CybSafe">Vodafone CybSafe</option>
                </optgroup>
                <optgroup label="Microsoft 365">
                  <option value="Microsoft 365 Business Basic Sem Teams">M365 Business Basic Sem Teams</option>
                  <option value="Microsoft 365 Business Basic Com Teams">M365 Business Basic Com Teams</option>
                  <option value="Microsoft 365 Business Standard Sem Teams">M365 Business Standard Sem Teams</option>
                  <option value="Microsoft 365 Business Standard Com Teams">M365 Business Standard Com Teams</option>
                  <option value="Microsoft 365 Business Premium Sem Teams">M365 Business Premium Sem Teams</option>
                  <option value="Microsoft 365 Business Premium Com Teams">M365 Business Premium Com Teams</option>
                </optgroup>
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
