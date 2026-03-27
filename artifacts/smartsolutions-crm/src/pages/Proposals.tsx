import React, { useState } from "react";
import { useListProposals, useCreateProposal, useSendProposal, useDeleteProposal, useListClients, useListProducts } from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, Button, Input, Select, Badge, Modal } from "@/components/ui/core";
import { Plus, Search, FileText, Send, Trash2, Calendar, ChevronRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@workspace/replit-auth-web";

const STATUS_LABELS: Record<string, string> = {
  em_preparacao: "Em Preparação",
  pronta: "Pronta",
  enviada: "Enviada",
  aguardando: "Aguardando",
  aceite: "Aceite",
  recusada: "Recusada",
};

export default function Proposals() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: proposals, isLoading } = useListProposals();
  const { data: clients } = useListClients();
  const { data: products } = useListProducts();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<number | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string>("");

  const ownerName = user
    ? [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email || "Comercial"
    : "Comercial";

  const createMutation = useCreateProposal({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/proposals"] });
        setIsCreateModalOpen(false);
        setSelectedClientId("");
      },
    },
  });

  const sendMutation = useSendProposal({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/proposals"] });
        setIsSendModalOpen(false);
      },
    },
  });

  const deleteMutation = useDeleteProposal({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/proposals"] }),
    },
  });

  const selectedClientObj = clients?.find((c) => c.id === parseInt(selectedClientId));

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const clientId = parseInt(fd.get("clientId") as string);
    const client = clients?.find((c) => c.id === clientId);
    createMutation.mutate({
      data: {
        clientId,
        clientEmail: client?.email ?? "—",
        productId: fd.get("productId") ? parseInt(fd.get("productId") as string) : undefined,
        amount: fd.get("amount") as string,
        validUntil: fd.get("validUntil") as string || undefined,
        notes: fd.get("notes") as string || undefined,
        status: "em_preparacao",
        ownerName,
      },
    });
  };

  const handleSend = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedProposal) return;
    const fd = new FormData(e.currentTarget);
    sendMutation.mutate({
      id: selectedProposal,
      data: {
        subject: fd.get("subject") as string,
        message: fd.get("message") as string,
      },
    });
  };

  const statusBadgeVariant = (status: string) => {
    if (status === "aceite") return "success";
    if (status === "recusada") return "danger";
    if (status === "enviada") return "warning";
    return "default";
  };

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Propostas</h1>
            <p className="text-muted-foreground mt-1">Gestão de propostas comerciais</p>
          </div>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Criar Proposta
          </Button>
        </div>

        <div className="bg-card rounded-2xl border border-border shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-secondary/50 border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-semibold">Número / Data</th>
                  <th className="px-6 py-4 font-semibold">Cliente</th>
                  <th className="px-6 py-4 font-semibold">Produto</th>
                  <th className="px-6 py-4 font-semibold">Valor</th>
                  <th className="px-6 py-4 font-semibold">Válida até</th>
                  <th className="px-6 py-4 font-semibold">Estado</th>
                  <th className="px-6 py-4 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">A carregar...</td></tr>
                ) : proposals?.length === 0 ? (
                  <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Nenhuma proposta encontrada.</td></tr>
                ) : (
                  proposals?.map((proposal) => (
                    <tr key={proposal.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-foreground flex items-center">
                          <FileText className="w-3.5 h-3.5 mr-1.5 text-primary" />
                          {proposal.proposalNumber}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(proposal.createdAt), "d MMM yyyy", { locale: pt })}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium">{proposal.clientName || "Cliente Removido"}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{proposal.clientEmail}</p>
                      </td>
                      <td className="px-6 py-4 text-xs text-muted-foreground">
                        {(proposal as any).productName || "—"}
                      </td>
                      <td className="px-6 py-4 font-bold">
                        {proposal.amount ? formatCurrency(proposal.amount) : "—"}
                      </td>
                      <td className="px-6 py-4 text-xs text-muted-foreground">
                        {proposal.validUntil
                          ? format(new Date(proposal.validUntil), "d MMM yyyy", { locale: pt })
                          : "—"}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={statusBadgeVariant(proposal.status)}>
                          {STATUS_LABELS[proposal.status] ?? proposal.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {proposal.status !== "aceite" && proposal.status !== "recusada" && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => {
                                setSelectedProposal(proposal.id);
                                setIsSendModalOpen(true);
                              }}
                            >
                              <Send className="w-3.5 h-3.5 mr-1.5" /> Enviar
                            </Button>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => {
                              if (confirm("Tem a certeza que deseja apagar esta proposta?"))
                                deleteMutation.mutate({ id: proposal.id });
                            }}
                          >
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

      {/* Create Proposal Modal */}
      <Modal isOpen={isCreateModalOpen} onClose={() => { setIsCreateModalOpen(false); setSelectedClientId(""); }} title="Nova Proposta Comercial">
        <form onSubmit={handleCreate} className="space-y-5">
          {/* Section: Client */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground border-b border-border pb-2">Cliente</h4>
            <div className="space-y-1">
              <label className="text-sm font-medium text-muted-foreground">Cliente *</label>
              <Select name="clientId" required value={selectedClientId} onChange={(e) => setSelectedClientId(e.target.value)}>
                <option value="">Selecione um cliente...</option>
                {clients?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName} — {c.companyName}
                  </option>
                ))}
              </Select>
            </div>
            {selectedClientObj && (
              <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl border border-border text-xs">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">
                  {selectedClientObj.fullName.charAt(0)}
                </div>
                <div>
                  <p className="font-medium">{selectedClientObj.companyName}</p>
                  <p className="text-muted-foreground">{selectedClientObj.email}</p>
                </div>
              </div>
            )}
          </div>

          {/* Section: Product & Value */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground border-b border-border pb-2">Produto e Valor</h4>
            <div className="space-y-1">
              <label className="text-sm font-medium text-muted-foreground">Produto</label>
              <Select name="productId">
                <option value="">Sem produto associado</option>
                <optgroup label="Cibersegurança">
                  {products?.filter(p => p.category === "Cibersegurança").map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </optgroup>
                <optgroup label="Microsoft 365">
                  {products?.filter(p => p.category === "Microsoft 365").map((p) => (
                    <option key={p.id} value={p.id}>{p.name} — {p.price ? `${p.price}€/mês` : "Sob consulta"}</option>
                  ))}
                </optgroup>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground">Valor Total (€)</label>
                <Input name="amount" type="number" step="0.01" min="0" placeholder="0.00" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground">Válida até</label>
                <Input name="validUntil" type="date" />
              </div>
            </div>
          </div>

          {/* Section: Notes */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground border-b border-border pb-2">Notas internas</h4>
            <textarea
              name="notes"
              rows={3}
              placeholder="Condições especiais, observações, contexto da venda..."
              className="flex w-full rounded-xl border border-border bg-secondary/50 px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary resize-none placeholder:text-muted-foreground/50"
            />
          </div>

          <div className="pt-2 flex justify-end gap-3 border-t border-border">
            <Button type="button" variant="ghost" onClick={() => { setIsCreateModalOpen(false); setSelectedClientId(""); }}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={createMutation.isPending}>
              <FileText className="w-4 h-4 mr-2" /> Criar Proposta
            </Button>
          </div>
        </form>
      </Modal>

      {/* Send Modal */}
      <Modal isOpen={isSendModalOpen} onClose={() => setIsSendModalOpen(false)} title="Enviar Proposta por Email">
        <form onSubmit={handleSend} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-muted-foreground">Assunto</label>
            <Input name="subject" defaultValue="Proposta Comercial — Vodafone Smart Solutions" required />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-muted-foreground">Mensagem</label>
            <textarea
              name="message"
              className="flex w-full rounded-xl border border-border bg-secondary/50 px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary h-36 resize-none"
              defaultValue={`Caro(a) Cliente,\n\nJunto enviamos a proposta comercial solicitada, com as condições acordadas.\n\nFica disponível para qualquer esclarecimento adicional.\n\nCom os melhores cumprimentos,\nEquipa Comercial — Vodafone Smart Solutions`}
              required
            />
          </div>
          <div className="pt-4 flex justify-end gap-3 border-t border-border">
            <Button type="button" variant="ghost" onClick={() => setIsSendModalOpen(false)}>Cancelar</Button>
            <Button type="submit" isLoading={sendMutation.isPending}>
              <Send className="w-4 h-4 mr-2" /> Enviar Email
            </Button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}
