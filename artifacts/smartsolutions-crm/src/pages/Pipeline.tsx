import React, { useState } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { useGetPipeline, useUpdatePipelineStatus, useListClients } from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Phone, Mail, Calendar, Building, Building2, MoreHorizontal } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { useQueryClient } from "@tanstack/react-query";

const COLUMNS = [
  { id: "chamada_efectuada", title: "Chamada Efectuada", color: "border-blue-500/50" },
  { id: "cliente_nao_interessado", title: "Não Interessado", color: "border-muted" },
  { id: "cliente_interessado", title: "Interessado", color: "border-emerald-500/50" },
  { id: "chamada_followup", title: "Follow-up", color: "border-primary/50" },
];

export default function Pipeline() {
  const queryClient = useQueryClient();
  const { data: pipelineData, isLoading } = useGetPipeline();
  const updateStatusMutation = useUpdatePipelineStatus({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/pipeline"] });
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      }
    }
  });

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const { source, destination, draggableId } = result;
    
    if (source.droppableId === destination.droppableId) return;

    const clientId = parseInt(draggableId, 10);
    const newStatus = destination.droppableId;
    
    // Optistic update could go here
    updateStatusMutation.mutate({
      clientId,
      data: { pipelineStatus: newStatus }
    });
  };

  if (isLoading || !pipelineData) {
    return (
      <AppLayout>
        <div className="p-8 h-full flex items-center justify-center">
          <div className="animate-pulse w-full h-full flex gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex-1 bg-secondary/30 rounded-2xl p-4"></div>
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  const getColumnData = (columnId: string) => {
    switch (columnId) {
      case "chamada_efectuada": return pipelineData.chamadaEfectuada;
      case "cliente_nao_interessado": return pipelineData.clienteNaoInteressado;
      case "cliente_interessado": return pipelineData.clienteInteressado;
      case "chamada_followup": return pipelineData.chamadaFollowup;
      default: return [];
    }
  };

  return (
    <AppLayout>
      <div className="h-full flex flex-col max-w-[1600px] mx-auto">
        <div className="p-6 md:px-8 border-b border-border/50 shrink-0">
          <h1 className="text-3xl font-display font-bold text-foreground">Pipeline Comercial</h1>
          <p className="text-muted-foreground mt-1">Arraste os cartões para atualizar o estado do cliente.</p>
        </div>

        <div className="flex-1 overflow-x-auto p-6 md:p-8">
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex gap-6 h-full min-w-max items-start">
              {COLUMNS.map((col) => {
                const items = getColumnData(col.id);
                return (
                  <div key={col.id} className="w-80 flex flex-col h-full bg-secondary/20 rounded-2xl border border-border/50 overflow-hidden">
                    <div className={`p-4 border-b-2 ${col.color} bg-secondary/50 flex justify-between items-center`}>
                      <h3 className="font-semibold">{col.title}</h3>
                      <span className="bg-background px-2.5 py-0.5 rounded-full text-xs font-bold text-muted-foreground">
                        {items.length}
                      </span>
                    </div>
                    
                    <Droppable droppableId={col.id}>
                      {(provided, snapshot) => (
                        <div 
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`flex-1 p-4 overflow-y-auto space-y-4 transition-colors ${snapshot.isDraggingOver ? 'bg-primary/5' : ''}`}
                        >
                          {items.map((item, index) => (
                            <Draggable key={item.id.toString()} draggableId={item.id.toString()} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`bg-card p-4 rounded-xl border border-border shadow-lg ${snapshot.isDragging ? 'shadow-xl shadow-primary/20 ring-2 ring-primary scale-105' : 'hover:border-primary/50'}`}
                                >
                                  <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-sm leading-tight text-foreground">{item.fullName}</h4>
                                    <button className="text-muted-foreground hover:text-foreground shrink-0 ml-2">
                                      <MoreHorizontal className="w-4 h-4" />
                                    </button>
                                  </div>
                                  
                                  <div className="space-y-2 text-xs text-muted-foreground mt-3">
                                    <div className="flex items-center gap-2">
                                      <Building2 className="w-3.5 h-3.5" />
                                      <span className="truncate">{item.companyName}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Phone className="w-3.5 h-3.5" />
                                      <span>{item.phone}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-primary font-medium">
                                      <span className="px-1.5 py-0.5 bg-primary/10 rounded uppercase tracking-wider text-[10px]">{item.interestedProduct}</span>
                                    </div>
                                    {col.id === 'chamada_followup' && item.nextFollowupDate && (
                                      <div className="flex items-center gap-2 text-amber-500 font-medium mt-2 pt-2 border-t border-border">
                                        <Calendar className="w-3.5 h-3.5" />
                                        <span>{format(new Date(item.nextFollowupDate), "d MMM, HH:mm", { locale: pt })}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </div>
                )
              })}
            </div>
          </DragDropContext>
        </div>
      </div>
    </AppLayout>
  );
}
