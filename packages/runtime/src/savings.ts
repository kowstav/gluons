import type { WorkspaceState } from './types';
export function savings(state: WorkspaceState, businessId: string, since?: string) {
  const business = state.businesses.find((b) => b.id === businessId)!;
  const tasks = state.tasks.filter(
    (t) => t.businessId === businessId && (!since || t.createdAt >= since),
  );
  const taskIds = new Set(tasks.map((t) => t.id));
  const actions = state.actions.filter((a) => taskIds.has(a.taskId));
  const completed = actions.filter((a) => ['executed', 'simulated'].includes(a.status));
  const reviewed = actions.filter((a) => a.status !== 'pending');
  const approved = reviewed.filter((a) => a.status !== 'rejected');
  const grossMinutes = completed.reduce(
    (sum, a) => sum + (tasks.find((t) => t.id === a.taskId)?.humanMinutes ?? 0),
    0,
  );
  const reviewMinutes = reviewed.length * business.baseline.reviewMinutesPerTask;
  const hours = Math.max(0, grossMinutes - reviewMinutes) / 60;
  const hourlyRate = business.baseline.monthlyStaffCost / business.baseline.monthlyStaffHours;
  const cost = tasks.reduce((sum, t) => sum + t.costUsd, 0);
  return {
    hours,
    grossHours: grossMinutes / 60,
    reviewHours: reviewMinutes / 60,
    equivalentStaffCost: hours * hourlyRate,
    aiCost: cost,
    netSavings: hours * hourlyRate - cost,
    completed: completed.length,
    simulated: completed.filter((a) => a.status === 'simulated').length,
    executed: completed.filter((a) => a.status === 'executed').length,
    total: tasks.length,
    approvalRate: reviewed.length ? (approved.length / reviewed.length) * 100 : 0,
    pending: actions.filter((a) => a.status === 'pending').length,
    hourlyRate,
    estimated: true,
  };
}
