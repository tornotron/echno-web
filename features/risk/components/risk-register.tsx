'use client';

import { useState, useCallback } from 'react';
import {
  Shield,
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/shadcn/button';
import { Badge } from '@/components/shadcn/badge';
import { Input } from '@/components/shadcn/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shadcn/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/shadcn/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/shadcn/alert-dialog';
import { Label } from '@/components/shadcn/label';
import { Textarea } from '@/components/shadcn/textarea';
import { Separator } from '@/components/shadcn/separator';
import {
  Risk,
  RiskCategory,
  RiskStatus,
  RiskProbability,
  RiskImpact,
  RiskResponseType,
  PROBABILITY_LABELS,
  IMPACT_LABELS,
  RISK_CATEGORY_LABELS,
  RISK_STATUS_LABELS,
  RISK_RESPONSE_LABELS,
  calcRiskScore,
  getRiskScoreBadgeClass,
  getRiskScoreLabel,
} from '@/types/risk';

// ─── Storage helpers ──────────────────────────────────────────────────────────

function storageKey(projectId: number): string {
  return `echno-risks-${projectId}`;
}

export function loadRisks(projectId: number): Risk[] {
  if (globalThis.window === undefined) return [];
  try {
    const raw = localStorage.getItem(storageKey(projectId));
    return raw ? (JSON.parse(raw) as Risk[]) : [];
  } catch {
    return [];
  }
}

function saveRisks(projectId: number, risks: Risk[]): void {
  localStorage.setItem(storageKey(projectId), JSON.stringify(risks));
}

function nextRiskId(risks: Risk[]): string {
  let max = 0;
  for (const r of risks) {
    const num = Number(r.riskId.replace('R-', ''));
    if (!Number.isNaN(num) && num > max) max = num;
  }
  return `R-${String(max + 1).padStart(3, '0')}`;
}

// ─── Blank form ───────────────────────────────────────────────────────────────

type RiskFormData = Omit<
  Risk,
  'id' | 'projectId' | 'riskId' | 'riskScore' | 'residualScore'
>;

function blankForm(): RiskFormData {
  const today = new Date().toISOString().split('T')[0];
  return {
    title: '',
    description: '',
    category: 'schedule',
    status: 'identified',
    owner: '',
    probability: 'medium',
    impact: 'moderate',
    residualProbability: 'low',
    residualImpact: 'minor',
    responseType: 'mitigate',
    contingencyPlan: '',
    identifiedDate: today,
    reviewDate: today,
  };
}

// ─── Risk Form Dialog ─────────────────────────────────────────────────────────

interface RiskFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: RiskFormData) => void;
  initial?: RiskFormData;
  title: string;
}

function RiskFormDialog({
  open,
  onClose,
  onSave,
  initial,
  title,
}: RiskFormDialogProps) {
  const [form, setForm] = useState<RiskFormData>(initial ?? blankForm());

  const set = <K extends keyof RiskFormData>(key: K, value: RiskFormData[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const previewScore = calcRiskScore(form.probability, form.impact);
  const residualPreview = calcRiskScore(
    form.residualProbability,
    form.residualImpact
  );

  const handleSave = () => {
    if (!form.title.trim()) return;
    onSave(form);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-orange-500" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Title & Description */}
          <div className="space-y-2">
            <Label>Title *</Label>
            <Input
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="Brief risk title"
            />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Describe the risk in detail"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={form.category}
                onValueChange={(v) => set('category', v as RiskCategory)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(RISK_CATEGORY_LABELS) as RiskCategory[]).map(
                    (k) => (
                      <SelectItem key={k} value={k}>
                        {RISK_CATEGORY_LABELS[k]}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => set('status', v as RiskStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(RISK_STATUS_LABELS) as RiskStatus[]).map(
                    (k) => (
                      <SelectItem key={k} value={k}>
                        {RISK_STATUS_LABELS[k]}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Risk Owner</Label>
            <Input
              value={form.owner}
              onChange={(e) => set('owner', e.target.value)}
              placeholder="Name of responsible person"
            />
          </div>

          <Separator />

          {/* Probability × Impact */}
          <div>
            <p className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              Risk Assessment
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Probability</Label>
                <Select
                  value={form.probability}
                  onValueChange={(v) =>
                    set('probability', v as RiskProbability)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(PROBABILITY_LABELS) as RiskProbability[]).map(
                      (k) => (
                        <SelectItem key={k} value={k}>
                          {PROBABILITY_LABELS[k]}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Impact</Label>
                <Select
                  value={form.impact}
                  onValueChange={(v) => set('impact', v as RiskImpact)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(IMPACT_LABELS) as RiskImpact[]).map((k) => (
                      <SelectItem key={k} value={k}>
                        {IMPACT_LABELS[k]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-2 text-sm">
              <span className="text-zinc-500">Risk score:</span>
              <span
                className={`rounded px-2 py-0.5 text-xs font-bold ${getRiskScoreBadgeClass(previewScore)}`}
              >
                {previewScore} – {getRiskScoreLabel(previewScore)}
              </span>
            </div>
          </div>

          <Separator />

          {/* Residual risk */}
          <div>
            <p className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              Residual Risk (after response)
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Residual Probability</Label>
                <Select
                  value={form.residualProbability}
                  onValueChange={(v) =>
                    set('residualProbability', v as RiskProbability)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(PROBABILITY_LABELS) as RiskProbability[]).map(
                      (k) => (
                        <SelectItem key={k} value={k}>
                          {PROBABILITY_LABELS[k]}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Residual Impact</Label>
                <Select
                  value={form.residualImpact}
                  onValueChange={(v) => set('residualImpact', v as RiskImpact)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(IMPACT_LABELS) as RiskImpact[]).map((k) => (
                      <SelectItem key={k} value={k}>
                        {IMPACT_LABELS[k]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-2 text-sm">
              <span className="text-zinc-500">Residual score:</span>
              <span
                className={`rounded px-2 py-0.5 text-xs font-bold ${getRiskScoreBadgeClass(residualPreview)}`}
              >
                {residualPreview} – {getRiskScoreLabel(residualPreview)}
              </span>
            </div>
          </div>

          <Separator />

          {/* Response */}
          <div className="space-y-2">
            <Label>Response Type</Label>
            <Select
              value={form.responseType}
              onValueChange={(v) => set('responseType', v as RiskResponseType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(RISK_RESPONSE_LABELS) as RiskResponseType[]).map(
                  (k) => (
                    <SelectItem key={k} value={k}>
                      {RISK_RESPONSE_LABELS[k]}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Contingency Plan</Label>
            <Textarea
              value={form.contingencyPlan ?? ''}
              onChange={(e) => set('contingencyPlan', e.target.value)}
              placeholder="Describe the contingency plan if this risk occurs"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Identified Date</Label>
              <Input
                type="date"
                value={form.identifiedDate}
                onChange={(e) => set('identifiedDate', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Review Date</Label>
              <Input
                type="date"
                value={form.reviewDate}
                onChange={(e) => set('reviewDate', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Cost Impact (optional)</Label>
              <Input
                type="number"
                value={form.costImpact ?? ''}
                onChange={(e) =>
                  set(
                    'costImpact',
                    e.target.value ? Number(e.target.value) : undefined
                  )
                }
                placeholder="Estimated cost if occurs"
              />
            </div>
            <div className="space-y-2">
              <Label>Schedule Impact (days)</Label>
              <Input
                type="number"
                value={form.scheduleImpact ?? ''}
                onChange={(e) =>
                  set(
                    'scheduleImpact',
                    e.target.value ? Number(e.target.value) : undefined
                  )
                }
                placeholder="Potential delay in days"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!form.title.trim()}>
            Save Risk
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Risk Row ─────────────────────────────────────────────────────────────────

interface RiskRowProps {
  risk: Risk;
  onEdit: (risk: Risk) => void;
  onDelete: (id: string) => void;
}

function RiskRow({ risk, onEdit, onDelete }: RiskRowProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800">
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="shrink-0 text-zinc-400 hover:text-zinc-600"
        >
          {expanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>

        <span className="w-16 shrink-0 font-mono text-xs font-bold text-zinc-500">
          {risk.riskId}
        </span>

        <span className="flex-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">
          {risk.title}
        </span>

        <div className="flex shrink-0 items-center gap-2">
          <Badge
            variant="outline"
            className="hidden text-[10px] sm:inline-flex"
          >
            {RISK_CATEGORY_LABELS[risk.category]}
          </Badge>
          <span
            className={`rounded px-1.5 py-0.5 text-xs font-bold ${getRiskScoreBadgeClass(risk.riskScore)}`}
          >
            {risk.riskScore}
          </span>
          <Badge
            variant="outline"
            className={`text-[10px] ${
              risk.status === 'closed' || risk.status === 'mitigated'
                ? 'border-green-200 text-green-700 dark:border-green-800 dark:text-green-400'
                : risk.status === 'occurred'
                  ? 'border-red-200 text-red-700 dark:border-red-800 dark:text-red-400'
                  : 'border-zinc-200 text-zinc-600'
            }`}
          >
            {RISK_STATUS_LABELS[risk.status]}
          </Badge>

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onEdit(risk)}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-red-500 hover:text-red-700"
            onClick={() => onDelete(risk.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-zinc-100 px-4 py-3 dark:border-zinc-800">
          <div className="grid gap-4 text-sm sm:grid-cols-2">
            {risk.description && (
              <div className="sm:col-span-2">
                <span className="font-medium text-zinc-500">Description: </span>
                <span className="text-zinc-700 dark:text-zinc-300">
                  {risk.description}
                </span>
              </div>
            )}
            <div>
              <span className="font-medium text-zinc-500">Owner: </span>
              <span className="text-zinc-700 dark:text-zinc-300">
                {risk.owner || '—'}
              </span>
            </div>
            <div>
              <span className="font-medium text-zinc-500">Response: </span>
              <span className="text-zinc-700 dark:text-zinc-300">
                {RISK_RESPONSE_LABELS[risk.responseType]}
              </span>
            </div>
            <div>
              <span className="font-medium text-zinc-500">Probability: </span>
              <span className="text-zinc-700 dark:text-zinc-300">
                {PROBABILITY_LABELS[risk.probability]}
              </span>
            </div>
            <div>
              <span className="font-medium text-zinc-500">Impact: </span>
              <span className="text-zinc-700 dark:text-zinc-300">
                {IMPACT_LABELS[risk.impact]}
              </span>
            </div>
            <div>
              <span className="font-medium text-zinc-500">
                Residual Score:{' '}
              </span>
              <span
                className={`rounded px-1.5 py-0.5 text-xs font-bold ${getRiskScoreBadgeClass(risk.residualScore)}`}
              >
                {risk.residualScore} ({getRiskScoreLabel(risk.residualScore)})
              </span>
            </div>
            {risk.contingencyPlan && (
              <div className="sm:col-span-2">
                <span className="font-medium text-zinc-500">Contingency: </span>
                <span className="text-zinc-700 dark:text-zinc-300">
                  {risk.contingencyPlan}
                </span>
              </div>
            )}
            {(risk.costImpact !== undefined ||
              risk.scheduleImpact !== undefined) && (
              <div className="flex gap-4 sm:col-span-2">
                {risk.costImpact !== undefined && (
                  <span>
                    <span className="font-medium text-zinc-500">
                      Cost impact:{' '}
                    </span>
                    <span className="text-zinc-700 dark:text-zinc-300">
                      {risk.costImpact.toLocaleString()}
                    </span>
                  </span>
                )}
                {risk.scheduleImpact !== undefined && (
                  <span>
                    <span className="font-medium text-zinc-500">
                      Schedule impact:{' '}
                    </span>
                    <span className="text-zinc-700 dark:text-zinc-300">
                      {risk.scheduleImpact} days
                    </span>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── RiskRegister ─────────────────────────────────────────────────────────────

interface RiskRegisterProps {
  projectId: number;
  initialRisks: Risk[];
}

export function RiskRegister({ projectId, initialRisks }: RiskRegisterProps) {
  const [risks, setRisks] = useState<Risk[]>(initialRisks);
  const [filterStatus, setFilterStatus] = useState<RiskStatus | 'all'>('all');
  const [filterCategory, setFilterCategory] = useState<RiskCategory | 'all'>(
    'all'
  );
  const [addOpen, setAddOpen] = useState(false);
  const [editRisk, setEditRisk] = useState<Risk | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const persist = useCallback(
    (updated: Risk[]) => {
      setRisks(updated);
      saveRisks(projectId, updated);
    },
    [projectId]
  );

  const handleAdd = (data: ReturnType<typeof blankForm>) => {
    const newRisk: Risk = {
      ...data,
      id: crypto.randomUUID(),
      projectId,
      riskId: nextRiskId(risks),
      riskScore: calcRiskScore(data.probability, data.impact),
      residualScore: calcRiskScore(
        data.residualProbability,
        data.residualImpact
      ),
    };
    persist([...risks, newRisk]);
  };

  const handleEdit = (data: ReturnType<typeof blankForm>) => {
    if (!editRisk) return;
    const updated = risks.map((r) =>
      r.id === editRisk.id
        ? {
            ...r,
            ...data,
            riskScore: calcRiskScore(data.probability, data.impact),
            residualScore: calcRiskScore(
              data.residualProbability,
              data.residualImpact
            ),
          }
        : r
    );
    persist(updated);
    setEditRisk(null);
  };

  const handleDelete = () => {
    if (!deleteId) return;
    persist(risks.filter((r) => r.id !== deleteId));
    setDeleteId(null);
  };

  const filtered = risks.filter((r) => {
    if (filterStatus !== 'all' && r.status !== filterStatus) return false;
    if (filterCategory !== 'all' && r.category !== filterCategory) return false;
    return true;
  });

  const criticalCount = risks.filter((r) => r.riskScore >= 17).length;
  const highCount = risks.filter(
    (r) => r.riskScore >= 10 && r.riskScore <= 16
  ).length;
  const openCount = risks.filter(
    (r) => r.status !== 'closed' && r.status !== 'mitigated'
  ).length;

  return (
    <div className="space-y-4">
      {/* Summary KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard label="Total Risks" value={risks.length} />
        <KpiCard label="Open" value={openCount} highlight="blue" />
        <KpiCard label="High Risk" value={highCount} highlight="orange" />
        <KpiCard label="Critical" value={criticalCount} highlight="red" />
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={filterStatus}
          onValueChange={(v) => setFilterStatus(v as RiskStatus | 'all')}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {(Object.keys(RISK_STATUS_LABELS) as RiskStatus[]).map((k) => (
              <SelectItem key={k} value={k}>
                {RISK_STATUS_LABELS[k]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filterCategory}
          onValueChange={(v) => setFilterCategory(v as RiskCategory | 'all')}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {(Object.keys(RISK_CATEGORY_LABELS) as RiskCategory[]).map((k) => (
              <SelectItem key={k} value={k}>
                {RISK_CATEGORY_LABELS[k]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="ml-auto">
          <Button onClick={() => setAddOpen(true)} size="sm">
            <Plus className="mr-1.5 h-4 w-4" />
            Add Risk
          </Button>
        </div>
      </div>

      {/* Risk list */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-200 py-12 text-center dark:border-zinc-700">
          <AlertTriangle className="mx-auto mb-3 h-10 w-10 text-zinc-300 dark:text-zinc-600" />
          <p className="text-sm text-zinc-500">
            {risks.length === 0
              ? 'No risks logged yet. Click "Add Risk" to start the register.'
              : 'No risks match the current filters.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((risk) => (
            <RiskRow
              key={risk.id}
              risk={risk}
              onEdit={setEditRisk}
              onDelete={setDeleteId}
            />
          ))}
        </div>
      )}

      {/* Add dialog */}
      <RiskFormDialog
        open={addOpen}
        title="Add Risk"
        onClose={() => setAddOpen(false)}
        onSave={handleAdd}
      />

      {/* Edit dialog */}
      {editRisk && (
        <RiskFormDialog
          open={!!editRisk}
          title={`Edit ${editRisk.riskId}`}
          initial={editRisk}
          onClose={() => setEditRisk(null)}
          onSave={handleEdit}
        />
      )}

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(v) => !v && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Risk</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the risk from the register. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function KpiCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: 'blue' | 'orange' | 'red';
}) {
  const colorMap: Record<string, string> = {
    red: 'text-red-600 dark:text-red-400',
    orange: 'text-orange-600 dark:text-orange-400',
    blue: 'text-blue-600 dark:text-blue-400',
  };
  const color =
    (highlight && colorMap[highlight]) || 'text-zinc-900 dark:text-zinc-100';

  return (
    <div className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
