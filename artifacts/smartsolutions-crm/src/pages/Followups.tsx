import React, { useState } from "react";
import { useListFollowups, useCompleteFollowup, useDeleteFollowup, useListClients, useCreateFollowup } from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button, Card, Badge, Modal, Select, Input } from "@/components/ui/core";
import { Check, Calendar, Plus, Clock, AlertCircle, Trash2 } from "lucide-react";
import { format, isPast, isToday } from "date-fns";
import { pt } from "date-fns/locale";
import { useQueryClient } from "@tanstack/react-query";

export default function Followups() {
  const queryClient = useQueryClient();
  const { data: followups, isLoading } = useListFollowups({ status: "pendente" });
  const { data: clients } = useListClients();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const completeMutation = useCompleteFollowup({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/followups"] })
    }
  });

  const deleteMutation = useDeleteFollowup({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/followups"] })
    }
  });

  const createMutation = useCreateFollowup({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/followups"] });
        setIsModalOpen(false);
      }
    }
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createMutation.mutate({
      data: {
        clientId: parseInt(fd.get("clientId") as string),
        scheduledAt: new Date(`${fd.get("date")}T${fd.get("time")}`).toISOString(),
        reason: fd.get("reason") as string,
        priority: fd.get("priority") as string,
        sendEmailAlert: true
      }
    });
  };

  const getPriorityColor = (p: string) => {
    if (p === 'alta') return 'text-destructive bg-destructive/10 border-destructive/20';
    if (p === 'media') return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
    return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
  };

  const renderFollowupGroup = (title: string, icon: any, color: string, filterFn: (f: any) => boolean) => {
    const filtered = followups?.filter(filterFn) || [];
    if (filtered.length === 0) return null;

    const Icon = icon;
    return (
      <div className="space-y-4 mb-8">
        <h2 className={`text-xl font-display font-semibold flex items-center gap-2 ${color}`}>
          <Icon className="w-5 h-5" /> {title} <Badge variant="outline" className="ml-2 bg-background">{filtered.length}</Badge>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(f => {
            const date = new Date(f.scheduledAt);
            return (
              <Card key={f.id} className="glass-panel-hover flex flex-col relative overflow-hidden group">
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${f.priority === 'alta' ? 'bg-destructive' : f.priority === 'media' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                <div className="p-5 flex-1 pl-6">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-bold text-foreground">{f.clientName}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">{f.companyName}</p>
                    </div>
                    <span className={`px-2 py-1 rounded border text-[10px] uppercase font-bold tracking-wider ${getPriorityColor(f.priority)}`}>
                      {f.priority}
                    </span>
                  </div>
                  <p className="text-sm mb-4 line-clamp-2 text-muted-foreground">{f.reason}</p>
                  
                  <div className="flex items-center gap-2 text-xs font-semibold bg-secondary/50 w-fit px-3 py-1.5 rounded-lg border border-border">
                    <Calendar className="w-3.5 h-3.5" />
                    {format(date, "d MMM, HH:mm", { locale: pt })}
                  </div>
                </div>
                <div className="p-4 border-t border-border/50 bg-secondary/20 flex justify-end gap-2">
                  <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => {
                    if (confirm("Tem a certeza que deseja apagar este follow-up?")) deleteMutation.mutate({ id: f.id });
                  }}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="secondary" className="flex-1">Reagendar</Button>
                  <Button size="sm" variant="outline" className="flex-1 hover:bg-emerald-500/10 hover:text-emerald-500 hover:border-emerald-500" onClick={() => completeMutation.mutate({ id: f.id })}>
                    <Check className="w-4 h-4 mr-1.5" /> Concluir
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    );
  };

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Follow-ups</h1>
            <p className="text-muted-foreground mt-1">Gestão de tarefas e ações pendentes</p>
          </div>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Agendar Follow-up
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground animate-pulse">A carregar tarefas...</div>
        ) : followups?.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-2xl border border-border">
            <Check className="w-16 h-16 text-emerald-500 mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">Tudo em dia!</h3>
            <p className="text-muted-foreground">Não tem follow-ups pendentes neste momento.</p>
          </div>
        ) : (
          <>
            {renderFollowupGroup("Em Atraso", AlertCircle, "text-destructive", f => isPast(new Date(f.scheduledAt)) && !isToday(new Date(f.scheduledAt)))}
            {renderFollowupGroup("Hoje", Clock, "text-primary", f => isToday(new Date(f.scheduledAt)))}
            {renderFollowupGroup("Próximos Dias", Calendar, "text-foreground", f => !isPast(new Date(f.scheduledAt)) && !isToday(new Date(f.scheduledAt)))}
          </>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Agendar Follow-up">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-muted-foreground">Cliente</label>
            <Select name="clientId" required>
              <option value="">Selecione um cliente...</option>
              {clients?.map(c => <option key={c.id} value={c.id}>{c.fullName}</option>)}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-muted-foreground">Data</label>
              <Input name="date" type="date" required />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-muted-foreground">Hora</label>
              <Input name="time" type="time" required />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-muted-foreground">Motivo / Assunto</label>
            <Input name="reason" required />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-muted-foreground">Prioridade</label>
            <Select name="priority" required>
              <option value="alta">Alta</option>
              <option value="media">Média</option>
              <option value="baixa">Baixa</option>
            </Select>
          </div>
          <div className="pt-4 flex justify-end gap-3 border-t border-border">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button type="submit" isLoading={createMutation.isPending}>Agendar</Button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}
