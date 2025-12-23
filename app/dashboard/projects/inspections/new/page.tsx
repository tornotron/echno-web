'use client';

import { useState } from 'react';
import { AppLayout } from '@/components/common';
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
import { useRouter } from 'next/navigation';
import { mockProjects, mockEmployees } from '@/components/shared/mock-data';
import {
  InspectionStatus,
  InspectionType,
  inspectionTypeLabels,
} from '@/types/inspection';
import { toast } from '@/lib/styles/toast-styles';

export default function NewInspectionPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [type, setType] = useState<InspectionType | ''>('');
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

  // Validation
  const isFormValid = () => {
    return (
      title.trim() !== '' &&
      type !== '' &&
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

      const project = mockProjects.find(
        (p) => p.id === Number.parseInt(projectId)
      );
      const inspector = mockEmployees.find(
        (emp) => emp.id === Number.parseInt(inspectorId)
      );

      // Generate inspection number (in real app, this would be from backend)
      const inspectionNumber = `INS-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0')}`;

      console.log('Creating inspection:', {
        inspectionNumber,
        title,
        type,
        status: InspectionStatus.scheduled,
        projectId: Number.parseInt(projectId),
        projectName: project?.projectName,
        location,
        areaInspected,
        scheduledDate: new Date(scheduledDate),
        scheduledTime,
        inspectorId: Number.parseInt(inspectorId),
        inspectorName: inspector?.name,
        contractorName: contractorName || undefined,
        clientRepresentative: clientRepresentative || undefined,
        drawingReference: drawingReference || undefined,
        observationsAndComments: observationsAndComments || undefined,
        checkItems: [],
        defects: [],
        totalCheckPoints: 0,
        passedCheckPoints: 0,
        failedCheckPoints: 0,
        defectsFound: 0,
        criticalDefects: 0,
        majorDefects: 0,
        minorDefects: 0,
        compliancePercentage: 0,
        reinspectionRequired: false,
        createdBy: 1, // Current user
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      toast.success('Inspection scheduled successfully!');
      router.push('/dashboard/projects/inspections');
    } catch (error) {
      console.error('Error creating inspection:', error);
      toast.error('Failed to create inspection');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            Schedule New Inspection
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Schedule a new inspection for your construction project
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Enter the basic details about the inspection
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

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="type">
                      Inspection Type <span className="text-red-600">*</span>
                    </Label>
                    <Select
                      value={type}
                      onValueChange={(value) =>
                        setType(value as InspectionType)
                      }
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
                    <Label htmlFor="project">
                      Project <span className="text-red-600">*</span>
                    </Label>
                    <Select value={projectId} onValueChange={setProjectId}>
                      <SelectTrigger id="project">
                        <SelectValue placeholder="Select project" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockProjects.map((project) => (
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
                </div>
              </CardContent>
            </Card>

            {/* Location Details */}
            <Card>
              <CardHeader>
                <CardTitle>Location Details</CardTitle>
                <CardDescription>
                  Specify where the inspection will take place
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
                    Area to be Inspected <span className="text-red-600">*</span>
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
                  Set the inspection date and assign personnel
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

            {/* Additional Information */}
            <Card>
              <CardHeader>
                <CardTitle>Additional Information</CardTitle>
                <CardDescription>
                  Add any additional notes or observations
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
                    placeholder="Enter any initial observations or special instructions..."
                    rows={4}
                  />
                </div>
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
                {isSubmitting ? 'Scheduling...' : 'Schedule Inspection'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
