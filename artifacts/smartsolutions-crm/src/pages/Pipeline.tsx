import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { useGetPipeline, useUpdatePipelineStatus, useDeleteClient } from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Phone, Calendar, Building2, Trash2, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";

const COLUMNS = [
  { id: "chamada_efectuada", title: "Chamada Efectuada", color: "border-blue-500/50", headerColor: "text-blue-400" },
  { id: "cliente_nao_interessado", title: "Não Interessado", color: "border-border", headerColor: "text-muted-foreground" },
  { id: "cliente_interessado", title: "Interessado", color: "border-emerald-500/50", headerColor: "text-emerald-400" },
  { id: "chamada_followup", title: "Follow-up", color: "border-primary/50", headerColor: "text-primary" },
];

type PipelineCard = {
  id: number;
  fullName: string;
  companyName: string;
  phone: string;
  email: string;
  interestedProduct: string;
  pipelineStatus: string;
  nextFollowupDate?: string | null;
  notes?: string | null;
};

type LocalPipeline = {
  chamada_efectuada: PipelineCard[];
  cliente_nao_interessado: PipelineCard[];
  cliente_interessado: PipelineCard[];
  chamada_followup: PipelineCard[];
};

export default function Pipeline() {
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const { data: pipelineData, isLoading } = useGetPipeline();

  // Local state is the source of truth for the board — enables instant drag
  const [columns, setColumns] = useState<LocalPipeline>({
    chamada_efectuada: [],
    cliente_nao_interessado: [],
    cliente_interessado: [],
    chamada_followup: [],
  });

  // Sync from server data only on initial load or after a delete
  useEffect(() => {
    if (!pipelineData) return;
    setColumns({
      chamada_efectuada: (pipelineData.chamadaEfectuada as PipelineCard[]) ?? [],
      cliente_nao_interessado: (pipelineData.clienteNaoInteressado as PipelineCard[]) ?? [],
      cliente_interessado: (pipelineData.clienteInteressado as PipelineCard[]) ?? [],
      chamada_followup: (pipelineData.chamadaFollowup as PipelineCard[]) ?? [],
    });
  }, [pipelineData]);

  const updateStatusMutation = useUpdatePipelineStatus({
    mutation: {
      onError: () => {
        // Revert on failure by refetching
        queryClient.invalidateQueries({ queryKey: ["/api/pipeline"] });
      },
      onSuccess: () => {
        // Sync dashboard counts silently in background
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      },
    },
  });

  const deleteMutation = useDeleteClient({
    mutation: {
      onSuccess: (_, variables) => {
        // Remove card from local state immediately
        setColumns((prev) => {
          const next = { ...prev };
          for (const colId of Object.keys(next) as (keyof LocalPipeline)[]) {
            next[colId] = next[colId].filter((c) => c.id !== variables.id);
          }
          return next;
        });
        queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      },
    },
  });

  const onDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const srcCol = source.droppableId as keyof LocalPipeline;
    const dstCol = destination.droppableId as keyof LocalPipeline;
    const clientId = parseInt(draggableId, 10);

    // Optimistic update — move card instantly in local state
    setColumns((prev) => {
      const srcItems = [...prev[srcCol]];
      const dstItems = srcCol === dstCol ? srcItems : [...prev[dstCol]];

      const [moved] = srcItems.splice(source.index, 1);
      const updatedCard = { ...moved, pipelineStatus: dstCol };

      if (srcCol === dstCol) {
        srcItems.splice(destination.index, 0, updatedCard);
        return { ...prev, [srcCol]: srcItems };
      }

      dstItems.splice(destination.index, 0, updatedCard);
      return { ...prev, [srcCol]: srcItems, [dstCol]: dstItems };
    });

    // Fire API in background (no invalidation so UI stays smooth)
    if (srcCol !== dstCol) {
      updateStatusMutation.mutate({
        clientId,
        data: { pipelineStatus: dstCol },
      });
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="p-8 h-full flex items-center justify-center">
          <div className="animate-pulse w-full flex gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex-1 h-96 bg-secondary/30 rounded-2xl p-4" />
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="h-full flex flex-col max-w-[1600px] mx-auto">
        <div className="p-6 md:px-8 border-b border-border/50 shrink-0">
          <h1 className="text-3xl font-display font-bold text-foreground">Pipeline Comercial</h1>
          <p className="text-muted-foreground mt-1">Arraste os cartões para atualizar o estado do cliente.</p>
        </div>

        <div className="flex-1 overflow-x-auto p-6 md:p-8">
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex gap-6 min-w-max items-start">
              {COLUMNS.map((col) => {
                const items = columns[col.id as keyof LocalPipeline];
                return (
                  <div
                    key={col.id}
                    className="w-80 flex flex-col bg-secondary/20 rounded-2xl border border-border/50 overflow-hidden"
                  >
                    <div className={`p-4 border-b-2 ${col.color} bg-secondary/50 flex justify-between items-center`}>
                      <h3 className={`font-semibold ${col.headerColor}`}>{col.title}</h3>
                      <span className="bg-background px-2.5 py-0.5 rounded-full text-xs font-bold text-muted-foreground">
                        {items.length}
                      </span>
                    </div>

                    <Droppable droppableId={col.id}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`min-h-[200px] p-4 space-y-3 transition-colors duration-150 ${
                            snapshot.isDraggingOver ? "bg-primary/5" : ""
                          }`}
                        >
                          {items.map((item, index) => (
                            <Draggable key={item.id.toString()} draggableId={item.id.toString()} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  style={provided.draggableProps.style}
                                  className={`bg-card rounded-xl border shadow-lg select-none transition-shadow ${
                                    snapshot.isDragging
                                      ? "shadow-2xl shadow-primary/30 ring-2 ring-primary border-primary/50 opacity-95"
                                      : "border-border hover:border-primary/40 hover:shadow-primary/10"
                                  }`}
                                >
                                  <div className="p-4">
                                    <div className="flex justify-between items-start mb-3">
                                      <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-sm text-foreground truncate">{item.fullName}</h4>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                          <Building2 className="w-3 h-3 text-muted-foreground shrink-0" />
                                          <span className="text-xs text-muted-foreground truncate">{item.companyName}</span>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-1 ml-2 shrink-0">
                                        <button
                                          className="p-1 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                                          onMouseDown={(e) => e.stopPropagation()}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/clientes?view=${item.id}`);
                                          }}
                                          title="Ver ficha do cliente"
                                        >
                                          <ExternalLink className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                          onMouseDown={(e) => e.stopPropagation()}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (confirm(`Apagar "${item.fullName}"? Esta ação é irreversível.`)) {
                                              deleteMutation.mutate({ id: item.id });
                                            }
                                          }}
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </div>

                                    <div className="space-y-1.5 text-xs text-muted-foreground">
                                      <div className="flex items-center gap-2">
                                        <Phone className="w-3 h-3 shrink-0" />
                                        <span>{item.phone}</span>
                                      </div>
                                      <div className="mt-2">
                                        <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-md uppercase tracking-wide text-[10px] font-semibold">
                                          {item.interestedProduct}
                                        </span>
                                      </div>
                                      {col.id === "chamada_followup" && item.nextFollowupDate && (
                                        <div className="flex items-center gap-2 text-amber-400 font-medium pt-2 mt-1 border-t border-border/50">
                                          <Calendar className="w-3 h-3 shrink-0" />
                                          <span>{format(new Date(item.nextFollowupDate), "d MMM, HH:mm", { locale: pt })}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                          {items.length === 0 && !snapshot.isDraggingOver && (
                            <div className="h-20 flex items-center justify-center border-2 border-dashed border-border/30 rounded-xl">
                              <p className="text-xs text-muted-foreground/50">Arraste um cartão aqui</p>
                            </div>
                          )}
                        </div>
                      )}
                    </Droppable>
                  </div>
                );
              })}
            </div>
          </DragDropContext>
        </div>
      </div>
    </AppLayout>
  );
}
