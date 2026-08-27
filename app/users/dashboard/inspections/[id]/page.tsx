'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/shadcn/card';
import { Button } from '@/components/shadcn/button';
import { Badge } from '@/components/shadcn/badge';
import {
  Edit,
  MapPin,
  Calendar,
  User,
  Building2,
  FileText,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  ListChecks,
  Thermometer,
  Cloud,
  Users,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { useInspectionById } from '@/hooks/inspection';
import { useEmployees } from '@tornotron/echno-core/employee/hooks';
import { useProjects } from '@tornotron/echno-core/project/hooks';
import { routes } from '@/nav';
import Link from 'next/link';
import { employeeFilterHref } from '@/hooks/use-employee-filter';
import {
  InspectionStatus,
  InspectionResult,
  InspectionOrigin,
  CheckItemStatus,
  inspectionStatusLabels,
  inspectionTypeLabels,
  inspectionResultLabels,
  checkItemStatusLabels,
  complianceRiskLevelLabels,
  complianceRiskLevelBadgeColors,
  compliancePhaseLabels,
  type InspectionCheckItem,
  type InspectionDefect,
} from '@/types/inspection';
import { format } from 'date-fns';

// Helper functions
const getStatusBadge = (status: InspectionStatus): string => {
  const colors: Record<InspectionStatus, string> = {
    [InspectionStatus.SCHEDULED]:
      'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    [InspectionStatus.IN_PROGRESS]:
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    [InspectionStatus.COMPLETED]:
      'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    [InspectionStatus.FAILED]:
      'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    [InspectionStatus.PASSED]:
      'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    [InspectionStatus.PASSED_WITH_REMARKS]:
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    [InspectionStatus.CANCELLED]:
      'bg-zinc-100 text-zinc-800 dark:bg-zinc-900 dark:text-zinc-300',
    [InspectionStatus.SUGGESTED]:
      'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-300',
  };
  return colors[status] || 'bg-zinc-100 text-zinc-800';
};

const getResultBadge = (result: InspectionResult): string => {
  const colors: Record<InspectionResult, string> = {
    [InspectionResult.PASSED]:
      'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    [InspectionResult.FAILED]:
      'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    [InspectionResult.PASSED_WITH_REMARKS]:
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    [InspectionResult.PENDING]:
      'bg-zinc-100 text-zinc-800 dark:bg-zinc-900 dark:text-zinc-300',
  };
  return colors[result] || 'bg-zinc-100 text-zinc-800';
};

const getCheckItemIcon = (status: CheckItemStatus) => {
  switch (status) {
    case CheckItemStatus.PASSED: {
      return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    }
    case CheckItemStatus.FAILED: {
      return <XCircle className="h-5 w-5 text-red-600" />;
    }
    case CheckItemStatus.NOT_APPLICABLE: {
      return <div className="h-5 w-5 text-zinc-400">N/A</div>;
    }
    default: {
      return <Clock className="h-5 w-5 text-zinc-400" />;
    }
  }
};

export default function InspectionDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { data: projects = [] } = useProjects();
  const { data: employees = [] } = useEmployees();
  const inspectionId = params.id as string;
  const { data: inspection, isLoading } = useInspectionById(inspectionId);

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-indigo-500"></div>
          <p className="text-zinc-600 dark:text-zinc-400">
            Loading inspection details...
          </p>
        </div>
      </div>
    );
  }

  if (!inspection) {
    return null;
  }

  const project = projects.find((p) => p.id === inspection.projectId);
  const inspector = employees.find((emp) => emp.id === inspection.inspectorId);
  const compliance =
    inspection.totalCheckPoints > 0
      ? (inspection.passedCheckPoints / inspection.totalCheckPoints) * 100
      : 0;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                {inspection.title}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                <span>Inspection #{inspection.inspectionNumber}</span>
                {project && (
                  <>
                    <span>•</span>
                    <span className="font-medium">{project.projectName}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() =>
              router.push(
                routes.inspections.detail(inspection.id).edit
              )
            }
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
        </div>
      </div>

      {/* Status Overview */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <Badge className={getStatusBadge(inspection.status)}>
                {inspectionStatusLabels[inspection.status]}
              </Badge>
              {inspection.result && (
                <Badge className={getResultBadge(inspection.result)}>
                  {inspectionResultLabels[inspection.result]}
                </Badge>
              )}
              <Badge variant="outline">
                {inspectionTypeLabels[inspection.type]}
              </Badge>
              {inspection.origin === InspectionOrigin.AI_GENERATED && (
                <Badge className="bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-300">
                  <Sparkles className="mr-1 h-3 w-3" />
                  AI-suggested
                </Badge>
              )}
              {inspection.riskLevel && (
                <Badge
                  className={
                    complianceRiskLevelBadgeColors[inspection.riskLevel]
                  }
                >
                  {complianceRiskLevelLabels[inspection.riskLevel]} risk
                </Badge>
              )}
              {inspection.compliancePhase && (
                <Badge variant="outline">
                  {compliancePhaseLabels[inspection.compliancePhase]}
                </Badge>
              )}
            </div>
            {inspection.totalCheckPoints > 0 && (
              <div className="text-right">
                <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {compliance.toFixed(1)}%
                </div>
                <div className="text-sm text-zinc-600 dark:text-zinc-400">
                  Compliance
                </div>
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Details - 2 columns */}
        <div className="space-y-6 lg:col-span-2">
          {/* AI Compliance Analysis (AI-generated compliance inspections only) */}
          {inspection.origin === InspectionOrigin.AI_GENERATED && (
            <Card className="border-violet-200 dark:border-violet-900">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-violet-600" />
                  AI-suggested Compliance
                </CardTitle>
                <CardDescription>
                  This compliance was proposed by the AI compliance analysis.
                  Review it before acting on it.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  {inspection.riskLevel && (
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="h-4 w-4 text-zinc-500" />
                      <span className="text-sm text-zinc-600 dark:text-zinc-400">
                        Risk level
                      </span>
                      <Badge
                        className={
                          complianceRiskLevelBadgeColors[inspection.riskLevel]
                        }
                      >
                        {complianceRiskLevelLabels[inspection.riskLevel]}
                      </Badge>
                    </div>
                  )}
                  {inspection.compliancePhase && (
                    <Badge variant="outline">
                      {compliancePhaseLabels[inspection.compliancePhase]}
                    </Badge>
                  )}
                </div>

                {inspection.aiRationale && (
                  <div>
                    <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Rationale
                    </div>
                    <p className="mt-1 text-sm whitespace-pre-line text-zinc-600 dark:text-zinc-400">
                      {inspection.aiRationale}
                    </p>
                  </div>
                )}

                {inspection.resolutionOptions && (
                  <div>
                    <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Resolution options
                    </div>
                    <p className="mt-1 text-sm whitespace-pre-line text-zinc-600 dark:text-zinc-400">
                      {inspection.resolutionOptions}
                    </p>
                  </div>
                )}

                {inspection.complianceRuleRef && (
                  <div>
                    <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Reference
                    </div>
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                      {inspection.complianceRuleRef}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-start gap-3">
                  <Building2 className="mt-1 h-5 w-5 text-zinc-500" />
                  <div>
                    <div className="text-sm text-zinc-600 dark:text-zinc-400">
                      Project
                    </div>
                    <div className="font-medium text-zinc-900 dark:text-zinc-100">
                      {project?.projectName || 'Unknown Project'}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="mt-1 h-5 w-5 text-zinc-500" />
                  <div>
                    <div className="text-sm text-zinc-600 dark:text-zinc-400">
                      Location
                    </div>
                    <div className="font-medium text-zinc-900 dark:text-zinc-100">
                      {inspection.location || 'Not specified'}
                    </div>
                  </div>
                </div>

                {inspection.areaInspected && (
                  <div className="flex items-start gap-3">
                    <FileText className="mt-1 h-5 w-5 text-zinc-500" />
                    <div>
                      <div className="text-sm text-zinc-600 dark:text-zinc-400">
                        Area Inspected
                      </div>
                      <div className="font-medium text-zinc-900 dark:text-zinc-100">
                        {inspection.areaInspected}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <Calendar className="mt-1 h-5 w-5 text-zinc-500" />
                  <div>
                    <div className="text-sm text-zinc-600 dark:text-zinc-400">
                      Scheduled Date
                    </div>
                    <div className="font-medium text-zinc-900 dark:text-zinc-100">
                      {inspection.scheduledDate
                        ? format(new Date(inspection.scheduledDate), 'PPP')
                        : 'Not scheduled'}
                      {inspection.scheduledTime &&
                        ` at ${inspection.scheduledTime}`}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <User className="mt-1 h-5 w-5 text-zinc-500" />
                  <div>
                    <div className="text-sm text-zinc-600 dark:text-zinc-400">
                      Inspector
                    </div>
                    <div className="font-medium text-zinc-900 dark:text-zinc-100">
                      {inspection.inspectorId ? (
                        <Link
                          href={employeeFilterHref(
                            routes.inspections.href,
                            inspection.inspectorId,
                            'inspector'
                          )}
                          className="hover:underline"
                        >
                          {inspector?.name || 'Unknown Inspector'}
                        </Link>
                      ) : (
                        (inspector?.name ?? 'Unknown Inspector')
                      )}
                    </div>
                  </div>
                </div>

                {inspection.drawingReference && (
                  <div className="flex items-start gap-3">
                    <FileText className="mt-1 h-5 w-5 text-zinc-500" />
                    <div>
                      <div className="text-sm text-zinc-600 dark:text-zinc-400">
                        Drawing Reference
                      </div>
                      <div className="font-medium text-zinc-900 dark:text-zinc-100">
                        {inspection.drawingReference}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {(inspection.clientRepresentative ||
                inspection.attendees.length > 0) && (
                <div className="mt-4 border-t pt-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    {inspection.clientRepresentative && (
                      <div>
                        <div className="text-sm text-zinc-600 dark:text-zinc-400">
                          Client Representative
                        </div>
                        <div className="font-medium text-zinc-900 dark:text-zinc-100">
                          {inspection.clientRepresentative}
                        </div>
                      </div>
                    )}
                    {inspection.attendees.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                          <Users className="h-4 w-4" />
                          Attendees
                        </div>
                        <div className="font-medium text-zinc-900 dark:text-zinc-100">
                          {inspection.attendees.join(', ')}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Weather Conditions */}
          {(inspection.weatherConditions || inspection.temperature) && (
            <Card>
              <CardHeader>
                <CardTitle>Weather Conditions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {inspection.weatherConditions && (
                    <div className="flex items-start gap-3">
                      <Cloud className="mt-1 h-5 w-5 text-zinc-500" />
                      <div>
                        <div className="text-sm text-zinc-600 dark:text-zinc-400">
                          Weather
                        </div>
                        <div className="font-medium text-zinc-900 dark:text-zinc-100">
                          {inspection.weatherConditions}
                        </div>
                      </div>
                    </div>
                  )}
                  {inspection.temperature && (
                    <div className="flex items-start gap-3">
                      <Thermometer className="mt-1 h-5 w-5 text-zinc-500" />
                      <div>
                        <div className="text-sm text-zinc-600 dark:text-zinc-400">
                          Temperature
                        </div>
                        <div className="font-medium text-zinc-900 dark:text-zinc-100">
                          {inspection.temperature}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Check Items. Rendered even when there are none, because an
              inspection with no checkpoints is exactly the case where the user
              needs to be told they can add some. */}
          {inspection.checkItems.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Inspection Checklist</CardTitle>
                <CardDescription>
                  The individual checks this inspection covers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border border-dashed py-8 text-center">
                  <ListChecks className="mx-auto mb-3 h-8 w-8 text-zinc-400" />
                  <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
                    No checkpoints have been added to this inspection yet.
                  </p>
                  <Button asChild variant="outline" size="sm">
                    <Link
                      href={routes.inspections.detail(inspection.id).edit}
                    >
                      Add checkpoints
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Inspection Checklist</CardTitle>
                <CardDescription>
                  {inspection.passedCheckPoints}/{inspection.totalCheckPoints}{' '}
                  items passed
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {inspection.checkItems.map(
                    (item: InspectionCheckItem, index: number) => (
                      <div
                        key={item.id || index}
                        className="flex items-start gap-3 rounded-lg border p-3"
                      >
                        {getCheckItemIcon(item.status)}
                        <div className="flex-1">
                          <div className="font-medium text-zinc-900 dark:text-zinc-100">
                            {item.checkPoint}
                          </div>
                          {item.remarks && (
                            <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                              {item.remarks}
                            </div>
                          )}
                        </div>
                        <Badge variant="outline">
                          {checkItemStatusLabels[item.status]}
                        </Badge>
                      </div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Defects */}
          {inspection.defects.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  Defects Found
                </CardTitle>
                <CardDescription>
                  {inspection.defectsFound} defects identified
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {inspection.defects.map(
                    (defect: InspectionDefect, index: number) => (
                      <div
                        key={defect.id || index}
                        className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="font-medium text-zinc-900 dark:text-zinc-100">
                              {defect.description}
                            </div>
                            {defect.location && (
                              <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                                Location: {defect.location}
                              </div>
                            )}
                            {defect.correctiveAction && (
                              <div className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
                                <strong>Corrective Action:</strong>{' '}
                                {defect.correctiveAction}
                              </div>
                            )}
                          </div>
                          {defect.severity && (
                            <Badge
                              variant="outline"
                              className={
                                defect.severity === 'critical'
                                  ? 'border-red-600 text-red-600'
                                  : defect.severity === 'major'
                                    ? 'border-orange-600 text-orange-600'
                                    : 'border-yellow-600 text-yellow-600'
                              }
                            >
                              {defect.severity}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar - 1 column */}
        <div className="space-y-6">
          {/* Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    Check Points
                  </span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {inspection.totalCheckPoints}
                  </span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-zinc-200 dark:bg-zinc-700">
                  <div
                    className="h-2 rounded-full bg-green-600"
                    style={{ width: `${compliance}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-green-50 p-3 dark:bg-green-950">
                  <div className="text-2xl font-bold text-green-700 dark:text-green-400">
                    {inspection.passedCheckPoints}
                  </div>
                  <div className="text-xs text-green-600 dark:text-green-500">
                    Passed
                  </div>
                </div>
                <div className="rounded-lg bg-red-50 p-3 dark:bg-red-950">
                  <div className="text-2xl font-bold text-red-700 dark:text-red-400">
                    {inspection.failedCheckPoints}
                  </div>
                  <div className="text-xs text-red-600 dark:text-red-500">
                    Failed
                  </div>
                </div>
              </div>

              {inspection.defectsFound > 0 && (
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">
                      Defects Found
                    </span>
                    <span className="font-semibold text-red-700 dark:text-red-400">
                      {inspection.defectsFound}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timestamps */}
          <Card>
            <CardHeader>
              <CardTitle>Timestamps</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {inspection.createdAt && (
                <div>
                  <div className="text-zinc-600 dark:text-zinc-400">
                    Created
                  </div>
                  <div className="font-medium text-zinc-900 dark:text-zinc-100">
                    {format(new Date(inspection.createdAt), 'PPp')}
                  </div>
                </div>
              )}
              {inspection.updatedAt && (
                <div>
                  <div className="text-zinc-600 dark:text-zinc-400">
                    Last Updated
                  </div>
                  <div className="font-medium text-zinc-900 dark:text-zinc-100">
                    {format(new Date(inspection.updatedAt), 'PPp')}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
