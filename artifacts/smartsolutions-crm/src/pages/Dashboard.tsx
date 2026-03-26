import React from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useGetDashboardStats } from "@workspace/api-client-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { 
  Users, UserCheck, UserX, Bell, FileText, CheckCircle, XCircle, DollarSign,
  Phone, Plus, Calendar
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from "@/components/ui/core";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

export default function Dashboard() {
  const { data: stats, isLoading } = useGetDashboardStats();

  if (isLoading) {
    return (
      <AppLayout>
        <div className="p-8 flex items-center justify-center h-full">
          <div className="animate-pulse space-y-8 w-full max-w-7xl mx-auto">
            <div className="h-8 bg-muted rounded w-64"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => <div key={i} className="h-32 bg-muted rounded-2xl"></div>)}
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!stats) return null;

  const statCards = [
    { title: "Total Clientes", value: stats.totalClients, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
    { title: "Interessados", value: stats.interestedClients, icon: UserCheck, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { title: "Não Interessados", value: stats.notInterestedClients, icon: UserX, color: "text-muted-foreground", bg: "bg-muted" },
    { title: "Follow-ups Pendentes", value: stats.pendingFollowups, icon: Bell, color: "text-amber-500", bg: "bg-amber-500/10" },
    { title: "Propostas Enviadas", value: stats.proposalsSent, icon: FileText, color: "text-primary", bg: "bg-primary/10" },
    { title: "Propostas Aceites", value: stats.proposalsAccepted, icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { title: "Propostas Recusadas", value: stats.proposalsRejected, icon: XCircle, color: "text-destructive", bg: "bg-destructive/10" },
    { title: "Valor Potencial", value: formatCurrency(stats.totalPotentialValue), icon: DollarSign, color: "text-violet-500", bg: "bg-violet-500/10" },
  ];

  const pipelineData = [
    { name: "Chamada", value: stats.pipelineSummary.chamadaEfectuada, color: "#3b82f6" },
    { name: "Não Int.", value: stats.pipelineSummary.clienteNaoInteressado, color: "#6b7280" },
    { name: "Interessado", value: stats.pipelineSummary.clienteInteressado, color: "#10b981" },
    { name: "Follow-up", value: stats.pipelineSummary.chamadaFollowup, color: "#e60000" },
  ];

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Resumo da sua atividade comercial</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/clientes">
              <Button size="sm" variant="secondary"><Plus className="w-4 h-4 mr-2" /> Novo Cliente</Button>
            </Link>
            <Link href="/propostas">
              <Button size="sm" variant="secondary"><FileText className="w-4 h-4 mr-2" /> Nova Proposta</Button>
            </Link>
            <Link href="/followups">
              <Button size="sm"><Bell className="w-4 h-4 mr-2" /> Marcar Follow-up</Button>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, index) => (
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: index * 0.05 }}
              key={index}
            >
              <Card className="glass-panel-hover">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className={`p-4 rounded-2xl ${stat.bg}`}>
                    <stat.icon className={`w-8 h-8 ${stat.color}`} strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <h3 className="text-2xl font-display font-bold mt-1">{stat.value}</h3>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pipeline Chart */}
          <Card className="lg:col-span-2 flex flex-col">
            <CardHeader>
              <CardTitle>Pipeline Resumo</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pipelineData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                  <Tooltip 
                    cursor={{fill: 'rgba(255,255,255,0.05)'}}
                    contentStyle={{ backgroundColor: '#1C1C1C', borderColor: '#2A2A2A', borderRadius: '12px' }}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {pipelineData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Today's Follow-ups */}
          <Card className="flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Follow-ups Hoje</CardTitle>
              <Badge variant="danger">{stats.todayFollowups}</Badge>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto">
              {stats.upcomingFollowups.filter(f => new Date(f.scheduledAt).toDateString() === new Date().toDateString()).length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-6 text-center">
                  <CheckCircle className="w-12 h-12 mb-3 opacity-20" />
                  <p>Não tem follow-ups agendados para hoje.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {stats.upcomingFollowups
                    .filter(f => new Date(f.scheduledAt).toDateString() === new Date().toDateString())
                    .map(followup => (
                    <div key={followup.id} className="p-4 rounded-xl bg-secondary/50 border border-border flex flex-col gap-2 relative overflow-hidden group">
                      <div className={`absolute left-0 top-0 bottom-0 w-1 ${followup.priority === 'alta' ? 'bg-destructive' : followup.priority === 'media' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                      <div className="flex justify-between items-start pl-2">
                        <div>
                          <h4 className="font-semibold text-sm">{followup.clientName}</h4>
                          <p className="text-xs text-muted-foreground">{followup.companyName}</p>
                        </div>
                        <span className="text-xs font-medium text-foreground bg-background px-2 py-1 rounded-md">
                          {format(new Date(followup.scheduledAt), 'HH:mm')}
                        </span>
                      </div>
                      <p className="text-sm pl-2 line-clamp-1">{followup.reason}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Atividade Recente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {stats.recentActivities.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">Sem atividade recente.</p>
                ) : (
                  stats.recentActivities.map((activity, i) => (
                    <div key={activity.id} className="flex gap-4 relative">
                      {i !== stats.recentActivities.length - 1 && (
                        <div className="absolute left-[11px] top-8 bottom-[-24px] w-[2px] bg-border" />
                      )}
                      <div className="w-6 h-6 rounded-full bg-secondary border-2 border-border flex items-center justify-center shrink-0 mt-0.5 z-10">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {activity.description}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(activity.createdAt), "d MMM yyyy 'às' HH:mm", { locale: pt })} • por {activity.createdBy}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Proposals */}
          <Card>
            <CardHeader>
              <CardTitle>Propostas Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.recentProposals.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">Sem propostas recentes.</p>
                ) : (
                  stats.recentProposals.map((proposal) => (
                    <div key={proposal.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-secondary/50 transition-colors border border-transparent hover:border-border">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 text-primary rounded-lg">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{proposal.clientName}</p>
                          <p className="text-xs text-muted-foreground">{proposal.proposalNumber} • {formatCurrency(proposal.amount)}</p>
                        </div>
                      </div>
                      <Badge variant={
                        proposal.status === 'aceite' ? 'success' : 
                        proposal.status === 'recusada' ? 'danger' : 
                        proposal.status === 'enviada' ? 'warning' : 'outline'
                      }>
                        {proposal.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
