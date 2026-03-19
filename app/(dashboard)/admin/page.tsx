"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminGuard } from "@/components/AdminGuard";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useAuth } from "@/hooks/useAuth";
import type { ApiError } from "@/lib/api";
import {
  listAdminEvents,
  listAdminUsers,
  updateAdminUserPlan,
  updateAdminUserSuspension,
} from "@/services/admin";
import type { UserPlan } from "@/types/account";
import type {
  AdminSystemEventItem,
  AdminUserListItem,
  SystemEventSeverity,
  SystemEventType,
} from "@/types/admin";

type PlanFilter = "ALL" | UserPlan;
type StatusFilter = "ALL" | "ACTIVE" | "SUSPENDED";
type AdminTab = "users" | "events";
type EventTypeFilter = "ALL" | SystemEventType;
type EventSeverityFilter = "ALL" | SystemEventSeverity;

type ActionModalState =
  | {
      type: "plan";
      user: AdminUserListItem;
      targetPlan: UserPlan;
    }
  | {
      type: "suspension";
      user: AdminUserListItem;
      targetSuspended: boolean;
    };

type FeedbackState = {
  tone: "success" | "error";
  message: string;
} | null;

const PAGE_SIZE = 12;

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => window.clearTimeout(timeoutId);
  }, [value, delay]);

  return debouncedValue;
}

function formatDateTime(value: string | null): string {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (
    typeof error === "object" &&
    error !== null &&
    typeof (error as ApiError).message === "string"
  ) {
    return (error as ApiError).message;
  }

  return fallback;
}

function PlanBadge({ plan }: { plan: UserPlan }) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${
        plan === "PRO"
          ? "bg-emerald-100 text-emerald-800"
          : "bg-zinc-100 text-zinc-700"
      }`}
    >
      {plan}
    </span>
  );
}

function StatusBadge({ suspended }: { suspended: boolean }) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${
        suspended
          ? "bg-red-100 text-red-700"
          : "bg-cyan-100 text-cyan-800"
      }`}
    >
      {suspended ? "Suspenso" : "Ativo"}
    </span>
  );
}

function SummaryTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "slate" | "emerald" | "amber" | "rose";
}) {
  const toneClass =
    tone === "emerald"
      ? "from-emerald-500 to-green-600"
      : tone === "amber"
      ? "from-amber-500 to-orange-600"
      : tone === "rose"
      ? "from-rose-500 to-red-600"
      : "from-slate-700 to-slate-900";

  return (
    <div
      className={`flex items-center justify-between rounded-xl bg-gradient-to-br ${toneClass} px-5 text-white shadow-lg shadow-zinc-200/60`}
      style={{ height: "40px" }}
    >
      <p className="text-sm font-medium text-white/80">{label}</p>
      <p className="text-3xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}

export default function AdminPage() {
  const { accessToken, account } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>("users");
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState<PlanFilter>("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [reason, setReason] = useState("");
  const [actionModal, setActionModal] = useState<ActionModalState | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState>(null);

  const [events, setEvents] = useState<AdminSystemEventItem[]>([]);
  const [eventsTotal, setEventsTotal] = useState(0);
  const [eventsPage, setEventsPage] = useState(1);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventSearch, setEventSearch] = useState("");
  const [eventTypeFilter, setEventTypeFilter] = useState<EventTypeFilter>("ALL");
  const [eventSeverityFilter, setEventSeverityFilter] = useState<EventSeverityFilter>("ALL");

  const debouncedSearch = useDebouncedValue(search, 350);
  const debouncedEventSearch = useDebouncedValue(eventSearch, 350);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const eventsTotalPages = Math.max(1, Math.ceil(eventsTotal / PAGE_SIZE));

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  useEffect(() => {
    if (eventsPage > eventsTotalPages) {
      setEventsPage(eventsTotalPages);
    }
  }, [eventsPage, eventsTotalPages]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, planFilter, statusFilter]);

  useEffect(() => {
    setEventsPage(1);
  }, [debouncedEventSearch, eventTypeFilter, eventSeverityFilter]);

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    let cancelled = false;
    setLoading(true);

    const suspended =
      statusFilter === "ALL"
        ? undefined
        : statusFilter === "SUSPENDED";

    listAdminUsers(accessToken, {
      page,
      limit: PAGE_SIZE,
      search: debouncedSearch.trim() || undefined,
      plan: planFilter === "ALL" ? undefined : planFilter,
      suspended,
    })
      .then((response) => {
        if (cancelled) {
          return;
        }

        setUsers(response.data);
        setTotal(response.total);
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }

        setFeedback({
          tone: "error",
          message: getErrorMessage(error, "Não foi possível carregar os usuários."),
        });
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [accessToken, debouncedSearch, page, planFilter, statusFilter]);

  useEffect(() => {
    if (!accessToken || activeTab !== "events") {
      return;
    }

    let cancelled = false;
    setEventsLoading(true);

    listAdminEvents(accessToken, {
      page: eventsPage,
      limit: PAGE_SIZE,
      search: debouncedEventSearch.trim() || undefined,
      type: eventTypeFilter === "ALL" ? undefined : eventTypeFilter,
      severity: eventSeverityFilter === "ALL" ? undefined : eventSeverityFilter,
    })
      .then((response) => {
        if (cancelled) {
          return;
        }
        setEvents(response.data);
        setEventsTotal(response.total);
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }

        setFeedback({
          tone: "error",
          message: getErrorMessage(error, "Não foi possível carregar os eventos do sistema."),
        });
      })
      .finally(() => {
        if (!cancelled) {
          setEventsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    accessToken,
    activeTab,
    debouncedEventSearch,
    eventSeverityFilter,
    eventTypeFilter,
    eventsPage,
  ]);

  const stats = useMemo(() => {
    return users.reduce(
      (acc, user) => {
        if (user.plan === "PRO") {
          acc.pro += 1;
        } else {
          acc.free += 1;
        }

        if (user.suspended) {
          acc.suspended += 1;
        }

        return acc;
      },
      { pro: 0, free: 0, suspended: 0 }
    );
  }, [users]);

  const eventStats = useMemo(() => {
    return events.reduce(
      (acc, event) => {
        if (event.severity === "ERROR") {
          acc.error += 1;
        } else if (event.severity === "WARN") {
          acc.warn += 1;
        } else {
          acc.info += 1;
        }
        return acc;
      },
      { info: 0, warn: 0, error: 0 }
    );
  }, [events]);

  const openPlanModal = (user: AdminUserListItem, targetPlan: UserPlan) => {
    setReason("");
    setActionModal({ type: "plan", user, targetPlan });
  };

  const openSuspensionModal = (
    user: AdminUserListItem,
    targetSuspended: boolean
  ) => {
    setReason("");
    setActionModal({ type: "suspension", user, targetSuspended });
  };

  const closeModal = () => {
    if (actionLoading) {
      return;
    }

    setActionModal(null);
    setReason("");
  };

  const handleSubmitAction = async () => {
    if (!accessToken || !actionModal) {
      return;
    }

    setActionLoading(true);
    setFeedback(null);

    try {
      const updatedUser =
        actionModal.type === "plan"
          ? await updateAdminUserPlan(
              actionModal.user.id,
              actionModal.targetPlan,
              accessToken,
              reason.trim() || undefined
            )
          : await updateAdminUserSuspension(
              actionModal.user.id,
              actionModal.targetSuspended,
              accessToken,
              reason.trim() || undefined
            );

      setUsers((currentUsers) =>
        currentUsers.map((user) =>
          user.id === updatedUser.id ? updatedUser : user
        )
      );

      setFeedback({
        tone: "success",
        message:
          actionModal.type === "plan"
            ? `Plano de ${updatedUser.email} atualizado para ${updatedUser.plan}.`
            : updatedUser.suspended
              ? `${updatedUser.email} foi suspenso com sucesso.`
              : `${updatedUser.email} foi reativado com sucesso.`,
      });
      closeModal();
    } catch (error: unknown) {
      setFeedback({
        tone: "error",
        message: getErrorMessage(error, "Não foi possível concluir a ação administrativa."),
      });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <AdminGuard>
      <div className="flex h-full min-h-0 flex-1 flex-col gap-3 overflow-x-hidden overflow-y-auto py-2 pr-1">
        <h1 className="mt-2 text-center text-xl font-bold text-zinc-900 sm:mt-0 sm:text-left">
          Administração
        </h1>
        <div className="flex flex-col items-center gap-3 md:flex-row md:items-start md:gap-4">
          <div className="inline-flex w-fit rounded-2xl border border-zinc-200 bg-white p-1 shadow-sm">
            <button
              type="button"
              className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === "users" ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-100"
              }`}
              onClick={() => setActiveTab("users")}
            >
              Usuários
            </button>
            <button
              type="button"
              className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === "events" ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-100"
              }`}
              onClick={() => setActiveTab("events")}
            >
              Eventos
            </button>
          </div>

          <section className="grid w-full grid-cols-2 gap-3 md:flex-1 md:grid-cols-2 xl:grid-cols-4">
            {activeTab === "users" ? (
              <>
                <SummaryTile label="Usuarios" value={total} tone="slate" />
                <SummaryTile label="Suspenso" value={stats.suspended} tone="rose" />
                <SummaryTile label="Free" value={stats.free} tone="amber" />
                <SummaryTile label="Pro" value={stats.pro} tone="emerald" />
              </>
            ) : (
              <>
                <SummaryTile label="Eventos" value={eventsTotal} tone="slate" />
                <SummaryTile label="Info" value={eventStats.info} tone="emerald" />
                <SummaryTile label="Avisos" value={eventStats.warn} tone="amber" />
                <SummaryTile label="Erros" value={eventStats.error} tone="rose" />
              </>
            )}
          </section>
        </div>

        <Card className="rounded-[2rem] border-zinc-200 p-0 shadow-lg shadow-zinc-200/60">
          <CardHeader className="mb-0 border-b border-zinc-200 px-6 py-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <CardTitle>{activeTab === "users" ? "Usuários da plataforma" : "Eventos do sistema"}</CardTitle>
                <p className="mt-1 text-sm text-zinc-500">
                  {null}
                </p>
              </div>
              {activeTab === "users" ? (
                <div className="grid gap-3 md:grid-cols-3 xl:min-w-[720px]">
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Buscar por nome ou e-mail"
                  />
                  <select
                    value={planFilter}
                    onChange={(event) => setPlanFilter(event.target.value as PlanFilter)}
                    className="h-10 rounded-xl border border-zinc-200 bg-white px-4 text-sm text-zinc-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1"
                  >
                    <option value="ALL">Todos os planos</option>
                    <option value="FREE">Somente Free</option>
                    <option value="PRO">Somente Pro</option>
                  </select>
                  <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
                    className="h-10 rounded-xl border border-zinc-200 bg-white px-4 text-sm text-zinc-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1"
                  >
                    <option value="ALL">Todos os status</option>
                    <option value="ACTIVE">Somente ativos</option>
                    <option value="SUSPENDED">Somente suspensos</option>
                  </select>
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-3 xl:min-w-[720px]">
                  <Input
                    value={eventSearch}
                    onChange={(event) => setEventSearch(event.target.value)}
                    placeholder="Buscar por rota"
                  />
                  <select
                    value={eventTypeFilter}
                    onChange={(event) => setEventTypeFilter(event.target.value as EventTypeFilter)}
                    className="h-10 rounded-xl border border-zinc-200 bg-white px-4 text-sm text-zinc-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1"
                  >
                    <option value="ALL">Todos os tipos</option>
                    <option value="LOGIN_SUCCESS">Login</option>
                    <option value="LOGOUT_SUCCESS">Logout</option>
                    <option value="BUDGET_CREATED">Orçamento criado</option>
                    <option value="BUDGET_SIGNED">Orçamento assinado</option>
                    <option value="ADMIN_USER_PLAN_UPDATED">Plano alterado</option>
                    <option value="ADMIN_USER_SUSPENDED">Conta suspensa</option>
                    <option value="ADMIN_USER_UNSUSPENDED">Conta reativada</option>
                    <option value="SYSTEM_ERROR">Erro de sistema</option>
                  </select>
                  <select
                    value={eventSeverityFilter}
                    onChange={(event) => setEventSeverityFilter(event.target.value as EventSeverityFilter)}
                    className="h-10 rounded-xl border border-zinc-200 bg-white px-4 text-sm text-zinc-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1"
                  >
                    <option value="ALL">Todos os eventos</option>
                    <option value="INFO">Info</option>
                    <option value="WARN">Aviso</option>
                    <option value="ERROR">Erro</option>
                  </select>
                </div>
              )}
            </div>
          </CardHeader>

          <div className="px-6 py-5">
            {feedback && (
              <div
                className={`mb-5 rounded-2xl border px-4 py-3 text-sm ${
                  feedback.tone === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-red-200 bg-red-50 text-red-700"
                }`}
              >
                {feedback.message}
              </div>
            )}

            {activeTab === "users" ? (
              loading ? (
                <div className="flex min-h-[280px] items-center justify-center">
                  <div className="h-9 w-9 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
                </div>
              ) : users.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-zinc-200 bg-zinc-50 px-6 py-14 text-center text-sm text-zinc-500">
                  Nenhum usuário encontrado para os filtros atuais.
                </div>
              ) : (
                <div className="overflow-hidden rounded-3xl border border-zinc-200">
                  <div className="hidden grid-cols-[minmax(0,1.7fr)_130px_130px_120px_180px] gap-4 border-b border-zinc-200 bg-zinc-50 px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500 lg:grid">
                    <span>Usuário</span>
                    <span>Plano</span>
                    <span>Status</span>
                    <span>Orçamentos</span>
                    <span>Ações</span>
                  </div>

                  <ul className="divide-y divide-zinc-200">
                    {users.map((user) => {
                      const isSelf = user.id === account?.id;
                      const nextPlan: UserPlan = user.plan === "FREE" ? "PRO" : "FREE";

                      return (
                        <li key={user.id} className="px-5 py-4">
                          <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1.7fr)_130px_130px_120px_180px] lg:items-center">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="truncate text-sm font-semibold text-zinc-950">
                                  {user.name}
                                </p>
                                {user.isAdmin && (
                                  <span className="inline-flex rounded-full bg-violet-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-700">
                                    Admin
                                  </span>
                                )}
                                {isSelf && (
                                  <span className="inline-flex rounded-full bg-zinc-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-600">
                                    Você
                                  </span>
                                )}
                              </div>
                              <p className="mt-1 truncate text-sm text-zinc-600">{user.email}</p>
                              <p className="mt-2 text-xs text-zinc-500">
                                Criado em {formatDateTime(user.createdAt)}
                              </p>
                              {user.suspended && user.suspendedReason && (
                                <p className="mt-2 text-xs font-medium text-red-600">
                                  Motivo: {user.suspendedReason}
                                </p>
                              )}

                              {/* Mobile: plano + status + quantidade lado a lado */}
                              <div className="mt-3 flex items-center gap-2 lg:hidden">
                                <PlanBadge plan={user.plan} />
                                <StatusBadge suspended={user.suspended} />
                                <span className="inline-flex rounded-full bg-zinc-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-700">
                                  {user.budgetsCount}
                                </span>
                              </div>
                            </div>

                            <div className="hidden lg:flex lg:items-center lg:justify-start">
                              <PlanBadge plan={user.plan} />
                            </div>

                            <div className="hidden lg:flex lg:items-center lg:justify-start">
                              <StatusBadge suspended={user.suspended} />
                            </div>

                            <div className="hidden text-sm font-medium text-zinc-700 lg:block">
                              {user.budgetsCount}
                            </div>

                            <div className="flex flex-wrap gap-2">
                              <Button
                                variant="secondary"
                                size="sm"
                                disabled={isSelf}
                                onClick={() => openPlanModal(user, nextPlan)}
                              >
                                {user.plan === "FREE" ? "Tornar Pro" : "Tornar Free"}
                              </Button>
                              <Button
                                variant={user.suspended ? "secondary" : "danger"}
                                size="sm"
                                disabled={isSelf}
                                onClick={() => openSuspensionModal(user, !user.suspended)}
                              >
                                {user.suspended ? "Reativar" : "Suspender"}
                              </Button>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )
            ) : eventsLoading ? (
              <div className="flex min-h-[280px] items-center justify-center">
                <div className="h-9 w-9 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
              </div>
            ) : events.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-zinc-200 bg-zinc-50 px-6 py-14 text-center text-sm text-zinc-500">
                Nenhum evento encontrado para os filtros atuais.
              </div>
            ) : (
              <div className="overflow-hidden rounded-3xl border border-zinc-200">
                <div className="hidden grid-cols-[180px_140px_180px_220px_140px] gap-6 border-b border-zinc-200 bg-zinc-50 px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500 lg:grid">
                  <span>Data</span>
                  <span>Evento</span>
                  <span>Tipo</span>
                  <span>Usuário</span>
                  <span>Status</span>
                </div>
                <ul className="divide-y divide-zinc-200">
                  {events.map((event) => (
                    <li key={event.id} className="px-5 py-4">
                      <div className="flex flex-col gap-3 lg:grid lg:grid-cols-[180px_140px_180px_220px_140px] lg:items-start">
                        <p className="text-xs text-zinc-500">{formatDateTime(event.createdAt)}</p>
                        <div className="flex items-center gap-2 lg:hidden">
                          <span className={`inline-flex w-fit rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${event.severity === "ERROR" ? "bg-red-100 text-red-700" : event.severity === "WARN" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                            {event.severity}
                          </span>
                          <p className="text-xs font-semibold text-zinc-700">{event.type}</p>
                        </div>
                        <span className={`hidden lg:inline-flex w-fit rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${event.severity === "ERROR" ? "bg-red-100 text-red-700" : event.severity === "WARN" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                          {event.severity}
                        </span>
                        <p className="hidden lg:block text-xs font-semibold text-zinc-700">{event.type}</p>
                        <p className="text-xs text-zinc-600">{event.actor?.email ?? "Sistema"}</p>
                        <p className="text-xs text-zinc-500">{event.statusCode ?? "Status não disponível"}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-5 flex flex-col gap-3 border-t border-zinc-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-zinc-500">
                Página {activeTab === "users" ? page : eventsPage} de {activeTab === "users" ? totalPages : eventsTotalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    if (activeTab === "users") {
                      setPage((currentPage) => Math.max(1, currentPage - 1));
                      return;
                    }
                    setEventsPage((currentPage) => Math.max(1, currentPage - 1));
                  }}
                  disabled={activeTab === "users" ? page <= 1 || loading : eventsPage <= 1 || eventsLoading}
                >
                  Anterior
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    if (activeTab === "users") {
                      setPage((currentPage) => Math.min(totalPages, currentPage + 1));
                      return;
                    }
                    setEventsPage((currentPage) => Math.min(eventsTotalPages, currentPage + 1));
                  }}
                  disabled={
                    activeTab === "users"
                      ? page >= totalPages || loading
                      : eventsPage >= eventsTotalPages || eventsLoading
                  }
                >
                  Próxima
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Modal
        isOpen={actionModal !== null}
        onClose={closeModal}
        title={
          actionModal?.type === "plan"
            ? `Alterar plano de ${actionModal.user.name}`
            : actionModal?.type === "suspension" && actionModal.targetSuspended
              ? `Suspender ${actionModal.user.name}`
              : `Reativar ${actionModal?.user.name ?? "usuário"}`
        }
      >
        {actionModal && (
          <div className="space-y-4">
            <p className="text-sm leading-6 text-zinc-600">
              {actionModal.type === "plan"
                ? `Esta ação vai definir o plano de ${actionModal.user.email} como ${actionModal.targetPlan}.`
                : actionModal.targetSuspended
                  ? `A conta de ${actionModal.user.email} será bloqueada imediatamente nas áreas privadas.`
                  : `A conta de ${actionModal.user.email} voltará a acessar normalmente as áreas privadas.`}
            </p>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                Motivo da alteração
              </label>
              <textarea
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                rows={4}
                placeholder="Opcional, mas recomendado para auditoria e suporte"
                className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm transition-colors placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1"
              />
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="secondary" onClick={closeModal} disabled={actionLoading}>
                Cancelar
              </Button>
              <Button variant="primary" onClick={() => void handleSubmitAction()} isLoading={actionLoading}>
                Confirmar ação
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </AdminGuard>
  );
}
