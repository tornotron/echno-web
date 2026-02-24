'use client';

import { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Save } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { mockEmployees, mockInspections } from '@/components/shared/mock-data';
import { useProjects } from '@/hooks/project/use-projects';
import {
  InspectionStatus,
  InspectionType,
  InspectionResult,
  inspectionTypeLabels,
  inspectionStatusLabels,
  inspectionResultLabels,
} from '@/types/inspection';
import { toast } from '@/lib/styles/toast-styles';
import { format } from 'date-fns';

export default function EditInspectionPage() {
  const router = useRouter();
  const params = useParams();
  const { data: projects = [] } = useProjects();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form state
  const [title, setTitle] = useState('');
  const [type, setType] = useState<InspectionType | ''>('');
  const [status, setStatus] = useState<InspectionStatus | ''>('');
  const [result, setResult] = useState<InspectionResult | ''>('');
  const [projectId, setProjectId] = useState<string>('');
  const [location, setLocation] = useState('');
  const [areaInspected, setAreaInspected] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [inspectorId, setInspectorId] = useState<string>('');
  const [contractorName, setContractorName] = useState('');
  const [clientRepresentative, setClientRepresentative] = useState('');
  const [drawingReference, setDrawingReference] = useState('');
  const [observationsAndComments, setObservationsAndComments] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [weatherConditions, setWeatherConditions] = useState('');
  const [temperature, setTemperature] = useState('');
  const [reinspectionRequired, setReinspectionRequired] = useState(false);
  const [reinspectionDate, setReinspectionDate] = useState('');
  const [reinspectionNotes, setReinspectionNotes] = useState('');

  // Load inspection data
  useEffect(() => {
    const loadInspection = async () => {
      try {
        const inspectionId = Number.parseInt(params.id as string);
        const inspection = mockInspections.find((i) => i.id === inspectionId);

        if (!inspection) {
          toast.error('Inspection not found');
          router.push('/dashboard/projects/inspections');
          return;
        }

        // Populate form with existing data
        setTitle(inspection.title);
        setType(inspection.type);
        setStatus(inspection.status);
        setResult(inspection.result || '');
        setProjectId(inspection.projectId?.toString() || '');
        setLocation(inspection.location);
        setAreaInspected(inspection.areaInspected);
        setScheduledDate(format(inspection.scheduledDate, 'yyyy-MM-dd'));
        setScheduledTime(inspection.scheduledTime || '');
        setInspectorId(inspection.inspectorId.toString());
        setContractorName(inspection.contractorName || '');
        setClientRepresentative(inspection.clientRepresentative || '');
        setDrawingReference(inspection.drawingReference || '');
        setObservationsAndComments(inspection.observationsAndComments || '');
        setRecommendations(inspection.recommendations || '');
        setWeatherConditions(inspection.weatherConditions || '');
        setTemperature(inspection.temperature || '');
        setReinspectionRequired(inspection.reinspectionRequired);
        setReinspectionDate(
          inspection.reinspectionDate
            ? format(inspection.reinspectionDate, 'yyyy-MM-dd')
            : ''
        );
        setReinspectionNotes(inspection.reinspectionNotes || '');

        setLoading(false);
      } catch (error) {
        logger.error('Error loading inspection:', error);
        toast.error('Failed to load inspection');
        router.push('/dashboard/projects/inspections');
      }
    };

    loadInspection();
  }, [params.id, router]);

  // Validation
  const isFormValid = () => {
    return (
      title.trim() !== '' &&
      type !== '' &&
      status !== '' &&
      projectId !== '' &&
      location.trim() !== '' &&
      areaInspected.trim() !== '' &&
      scheduledDate !== '' &&
      inspectorId !== ''
    );
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const project = projects.find((p) => p.id === Number.parseInt(projectId));
      const inspector = mockEmployees.find(
        (emp) => emp.id === Number.parseInt(inspectorId)
      );

      logger.debug('Updating inspection:', {
        id: Number.parseInt(params.id as string),
        title,
        type,
        status,
        result: result || undefined,
        projectId: Number.parseInt(projectId),
        projectName: project?.projectName,
        location,
        areaInspected,
        scheduledDate: new Date(scheduledDate),
        scheduledTime: scheduledTime || undefined,
        inspectorId: Number.parseInt(inspectorId),
        inspectorName: inspector?.name,
        contractorName: contractorName || undefined,
        clientRepresentative: clientRepresentative || undefined,
        drawingReference: drawingReference || undefined,
        observationsAndComments: observationsAndComments || undefined,
        recommendations: recommendations || undefined,
        weatherConditions: weatherConditions || undefined,
        temperature: temperature || undefined,
        reinspectionRequired,
        reinspectionDate: reinspectionDate
          ? new Date(reinspectionDate)
          : undefined,
        reinspectionNotes: reinspectionNotes || undefined,
        updatedAt: new Date(),
      });

      toast.success('Inspection updated successfully!');
      router.push(`/dashboard/projects/inspections/${params.id}`);
    } catch (error) {
      logger.error('Error updating inspection:', error);
      toast.error('Failed to update inspection');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="text-zinc-600 dark:text-zinc-400">
            Loading inspection...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
          Edit Inspection
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Update inspection details and results
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Update the basic details about the inspection
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">
                  Inspection Title <span className="text-red-600">*</span>
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Foundation Quality Inspection"
                  required
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="type">
                    Inspection Type <span className="text-red-600">*</span>
                  </Label>
                  <Select
                    value={type}
                    onValueChange={(value) => setType(value as InspectionType)}
                  >
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Select inspection type" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(inspectionTypeLabels).map(
                        ([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">
                    Status <span className="text-red-600">*</span>
                  </Label>
                  <Select
                    value={status}
                    onValueChange={(value) =>
                      setStatus(value as InspectionStatus)
                    }
                  >
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(inspectionStatusLabels).map(
                        ([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="result">Result</Label>
                  <Select
                    value={result}
                    onValueChange={(value) =>
                      setResult(value as InspectionResult)
                    }
                  >
                    <SelectTrigger id="result">
                      <SelectValue placeholder="Select result" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(inspectionResultLabels).map(
                        ([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="project">
                  Project <span className="text-red-600">*</span>
                </Label>
                <Select value={projectId} onValueChange={setProjectId}>
                  <SelectTrigger id="project">
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem
                        key={project.id}
                        value={project.id.toString()}
                      >
                        {project.projectName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Location Details */}
          <Card>
            <CardHeader>
              <CardTitle>Location Details</CardTitle>
              <CardDescription>
                Update location and area information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="location">
                  Location <span className="text-red-600">*</span>
                </Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., Building A - Ground Floor"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="areaInspected">
                  Area Inspected <span className="text-red-600">*</span>
                </Label>
                <Input
                  id="areaInspected"
                  value={areaInspected}
                  onChange={(e) => setAreaInspected(e.target.value)}
                  placeholder="e.g., Foundation - Block A"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="drawingReference">
                  Drawing Reference (Optional)
                </Label>
                <Input
                  id="drawingReference"
                  value={drawingReference}
                  onChange={(e) => setDrawingReference(e.target.value)}
                  placeholder="e.g., DRG-FND-001"
                />
              </div>
            </CardContent>
          </Card>

          {/* Schedule & Personnel */}
          <Card>
            <CardHeader>
              <CardTitle>Schedule & Personnel</CardTitle>
              <CardDescription>
                Update inspection schedule and personnel
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="scheduledDate">
                    Scheduled Date <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    id="scheduledDate"
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="scheduledTime">
                    Scheduled Time (Optional)
                  </Label>
                  <Input
                    id="scheduledTime"
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="inspector">
                  Inspector <span className="text-red-600">*</span>
                </Label>
                <Select value={inspectorId} onValueChange={setInspectorId}>
                  <SelectTrigger id="inspector">
                    <SelectValue placeholder="Select inspector" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockEmployees.map((employee) => (
                      <SelectItem
                        key={employee.id}
                        value={employee.id?.toString() || ''}
                      >
                        {employee.name} - {employee.designation}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="contractorName">
                    Contractor Name (Optional)
                  </Label>
                  <Input
                    id="contractorName"
                    value={contractorName}
                    onChange={(e) => setContractorName(e.target.value)}
                    placeholder="e.g., ABC Constructions"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clientRepresentative">
                    Client Representative (Optional)
                  </Label>
                  <Input
                    id="clientRepresentative"
                    value={clientRepresentative}
                    onChange={(e) => setClientRepresentative(e.target.value)}
                    placeholder="e.g., Mr. Sharma"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Weather & Conditions */}
          <Card>
            <CardHeader>
              <CardTitle>Weather & Conditions</CardTitle>
              <CardDescription>
                Record weather and site conditions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="weatherConditions">
                    Weather Conditions (Optional)
                  </Label>
                  <Input
                    id="weatherConditions"
                    value={weatherConditions}
                    onChange={(e) => setWeatherConditions(e.target.value)}
                    placeholder="e.g., Clear, Sunny"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="temperature">Temperature (Optional)</Label>
                  <Input
                    id="temperature"
                    value={temperature}
                    onChange={(e) => setTemperature(e.target.value)}
                    placeholder="e.g., 28°C"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Observations & Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>Observations & Recommendations</CardTitle>
              <CardDescription>
                Add observations, comments, and recommendations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="observationsAndComments">
                  Observations & Comments (Optional)
                </Label>
                <Textarea
                  id="observationsAndComments"
                  value={observationsAndComments}
                  onChange={(e) => setObservationsAndComments(e.target.value)}
                  placeholder="Enter observations and comments..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="recommendations">
                  Recommendations (Optional)
                </Label>
                <Textarea
                  id="recommendations"
                  value={recommendations}
                  onChange={(e) => setRecommendations(e.target.value)}
                  placeholder="Enter recommendations..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Re-inspection */}
          <Card>
            <CardHeader>
              <CardTitle>Re-inspection</CardTitle>
              <CardDescription>
                Manage re-inspection requirements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="reinspectionRequired"
                  checked={reinspectionRequired}
                  onChange={(e) => setReinspectionRequired(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-300"
                />
                <Label htmlFor="reinspectionRequired" className="font-normal">
                  Re-inspection Required
                </Label>
              </div>

              {reinspectionRequired && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="reinspectionDate">Re-inspection Date</Label>
                    <Input
                      id="reinspectionDate"
                      type="date"
                      value={reinspectionDate}
                      onChange={(e) => setReinspectionDate(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reinspectionNotes">
                      Re-inspection Notes
                    </Label>
                    <Textarea
                      id="reinspectionNotes"
                      value={reinspectionNotes}
                      onChange={(e) => setReinspectionNotes(e.target.value)}
                      placeholder="Enter re-inspection notes..."
                      rows={3}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !isFormValid()}>
              <Save className="mr-2 h-4 w-4" />
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
