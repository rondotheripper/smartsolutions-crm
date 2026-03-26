import React, { useState } from "react";
import { useListProposals, useCreateProposal, useSendProposal, useDeleteProposal, useListClients } from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, Button, Input, Select, Badge, Modal } from "@/components/ui/core";
import { Plus, Search, FileText, Send, Trash2, Calendar } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { useQueryClient } from "@tanstack/react-query";

export default function Proposals() {
  const queryClient = useQueryClient();
  const { data: proposals, isLoading } = useListProposals();
  const { data: clients } = useListClients();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<number | null>(null);

  const createMutation = useCreateProposal({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/proposals"] });
        setIsCreateModalOpen(false);
      }
    }
  });

  const sendMutation = useSendProposal({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/proposals"] });
        setIsSendModalOpen(false);
      }
    }
  });

  const deleteMutation = useDeleteProposal({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/proposals"] })
    }
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createMutation.mutate({
      data: {
        clientId: parseInt(fd.get("clientId") as string),
        clientEmail: "cliente@exemplo.pt", // In a real app, fetched from selected client
        amount: fd.get("amount") as string,
        status: "em_preparacao",
        ownerName: "João Diretor"
      }
    });
  };

  const handleSend = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if(!selectedProposal) return;
    const fd = new FormData(e.currentTarget);
    sendMutation.mutate({
      id: selectedProposal,
      data: {
        subject: fd.get("subject") as string,
        message: fd.get("message") as string
      }
    });
  };

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Propostas</h1>
            <p className="text-muted-foreground mt-1">Gestão de propostas comerciais enviadas</p>
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
                  <th className="px-6 py-4 font-semibold">Valor</th>
                  <th className="px-6 py-4 font-semibold">Estado</th>
                  <th className="px-6 py-4 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">A carregar...</td></tr>
                ) : proposals?.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Nenhuma proposta encontrada.</td></tr>
                ) : (
                  proposals?.map((proposal) => (
                    <tr key={proposal.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-foreground flex items-center"><FileText className="w-3.5 h-3.5 mr-1.5 text-primary"/> {proposal.proposalNumber}</p>
                        <p className="text-xs text-muted-foreground mt-1">{format(new Date(proposal.createdAt), "d MMM yyyy", { locale: pt })}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium">{proposal.clientName || 'Cliente Removido'}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{proposal.clientEmail}</p>
                      </td>
                      <td className="px-6 py-4 font-bold">
                        {formatCurrency(proposal.amount)}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={
                          proposal.status === 'aceite' ? 'success' : 
                          proposal.status === 'recusada' ? 'danger' : 
                          proposal.status === 'enviada' ? 'warning' : 'default'
                        }>
                          {proposal.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {proposal.status !== 'aceite' && proposal.status !== 'recusada' && (
                            <Button size="sm" variant="secondary" onClick={() => {
                              setSelectedProposal(proposal.id);
                              setIsSendModalOpen(true);
                            }}>
                              <Send className="w-3.5 h-3.5 mr-1.5" /> Enviar
                            </Button>
                          )}
                          <Button size="icon" variant="ghost" className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => {
                            if (confirm("Tem a certeza que deseja apagar esta proposta?")) deleteMutation.mutate({ id: proposal.id });
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

      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Nova Proposta">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-muted-foreground">Cliente</label>
            <Select name="clientId" required>
              <option value="">Selecione um cliente...</option>
              {clients?.map(c => <option key={c.id} value={c.id}>{c.fullName} - {c.companyName}</option>)}
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-muted-foreground">Valor (€)</label>
            <Input name="amount" type="number" step="0.01" required />
          </div>
          <div className="pt-4 flex justify-end gap-3 border-t border-border">
            <Button type="button" variant="ghost" onClick={() => setIsCreateModalOpen(false)}>Cancelar</Button>
            <Button type="submit" isLoading={createMutation.isPending}>Criar Rascunho</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isSendModalOpen} onClose={() => setIsSendModalOpen(false)} title="Enviar Proposta por Email">
        <form onSubmit={handleSend} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-muted-foreground">Assunto</label>
            <Input name="subject" defaultValue="Proposta Comercial - Vodafone Smart Solutions" required />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-muted-foreground">Mensagem</label>
            <textarea 
              name="message" 
              className="flex w-full rounded-xl border border-border bg-secondary/50 px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary h-32 resize-none"
              defaultValue={`Caro(a) Cliente,\n\nJunto enviamos a proposta comercial solicitada.\n\nCom os melhores cumprimentos,\nEquipa Comercial`}
              required
            />
          </div>
          <div className="pt-4 flex justify-end gap-3 border-t border-border">
            <Button type="button" variant="ghost" onClick={() => setIsSendModalOpen(false)}>Cancelar</Button>
            <Button type="submit" isLoading={sendMutation.isPending}><Send className="w-4 h-4 mr-2" /> Enviar Email</Button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}
