'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { routes } from '@/nav';
import { useProjects } from '@/hooks/project/use-projects';
import { Button } from '@/components/shadcn/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from '@/components/shadcn/card';
import { Input } from '@/components/shadcn/input';
import { Label } from '@/components/shadcn/label';
import { Textarea } from '@/components/shadcn/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shadcn/select';
import { Save, X, Calendar, DollarSign } from 'lucide-react';
import { PageHeader } from '@/components/common';
import { format } from 'date-fns';
import { toast } from '@/lib/styles/toast-styles';

export default function NewReceiptPage() {
  const router = useRouter();
  const {
    data: projects,
    isLoading: projectsLoading,
    error: projectsError,
  } = useProjects();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    receiptNumber: '',
    type: 'payment',
    status: 'draft',
    projectId: undefined as number | undefined,
    receiptDate: new Date(),
    receivedFrom: '',
    amount: 0,
    currency: 'INR',
    paymentMethod: '',
    transactionId: '',
    referenceNumber: '',
    description: '',
    notes: '',
  });

  const receiptTypeLabels: Record<string, string> = {
    payment: 'Payment Receipt',
    advance: 'Advance Receipt',
    deposit: 'Deposit Receipt',
    refund: 'Refund Receipt',
    other: 'Other Receipt',
  };

  const handleInputChange = (field: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      if (!prev[field as string]) return prev;
      const next = { ...prev };
      delete next[field as string];
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.projectId) {
      setErrors({ projectId: 'Please select a project' });
      toast.error('Please fix the errors in the form');
      return;
    }
    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      toast.success('Receipt created successfully');
      setIsSubmitting(false);
      router.push(routes.finance.receipts.href);
    }, 800);
  };

  const handleCancel = () => {
    router.push(routes.finance.receipts.href);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="New Receipt"
        description="Create a new financial receipt"
      />

      <div className="max-w-3xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="mb-6">
                <CardTitle>Receipt Information</CardTitle>
                <CardDescription>
                  Basic details about the receipt
                </CardDescription>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="receiptNumber">Receipt Number</Label>
                  <Input
                    id="receiptNumber"
                    value={formData.receiptNumber}
                    onChange={(e) =>
                      handleInputChange('receiptNumber', e.target.value)
                    }
                    placeholder="e.g., RCP-2025-001"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => handleInputChange('type', value)}
                  >
                    <SelectTrigger id="type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(receiptTypeLabels).map(
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
                  <Label htmlFor="projectId">
                    Project <span className="text-red-500">*</span>
                  </Label>
                  {projectsLoading ? (
                    <Select disabled>
                      <SelectTrigger id="projectId">
                        <SelectValue placeholder="Loading projects..." />
                      </SelectTrigger>
                    </Select>
                  ) : projectsError ? (
                    <div className="text-sm text-red-500">
                      Failed to load projects
                    </div>
                  ) : (
                    <Select
                      value={formData.projectId?.toString() ?? ''}
                      onValueChange={(value) =>
                        handleInputChange('projectId', Number(value))
                      }
                    >
                      <SelectTrigger
                        id="projectId"
                        className={errors.projectId ? 'border-red-500' : ''}
                      >
                        <SelectValue placeholder="Select project" />
                      </SelectTrigger>
                      <SelectContent>
                        {projects?.map((project) => (
                          <SelectItem
                            key={project.id}
                            value={project.id.toString()}
                          >
                            {project.projectName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {errors.projectId && (
                    <p className="text-sm text-red-500">{errors.projectId}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="receiptDate">Receipt Date</Label>
                  <div className="relative">
                    <Calendar className="text-muted-foreground pointer-events-none absolute top-3 left-3 h-4 w-4" />
                    <Input
                      id="receiptDate"
                      type="date"
                      value={format(
                        new Date(formData.receiptDate || ''),
                        'yyyy-MM-dd'
                      )}
                      onChange={(e) =>
                        handleInputChange('receiptDate', e.target.value)
                      }
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  <div className="relative">
                    <DollarSign className="text-muted-foreground pointer-events-none absolute top-3 left-3 h-4 w-4" />
                    <Input
                      id="amount"
                      type="number"
                      value={formData.amount}
                      onChange={(e) =>
                        handleInputChange('amount', Number(e.target.value || 0))
                      }
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="receivedFrom">Received From</Label>
                  <Input
                    id="receivedFrom"
                    value={formData.receivedFrom}
                    onChange={(e) =>
                      handleInputChange('receivedFrom', e.target.value)
                    }
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="paymentMethod">Payment Method</Label>
                  <Input
                    id="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={(e) =>
                      handleInputChange('paymentMethod', e.target.value)
                    }
                    placeholder="e.g., Bank Transfer, Cheque, Cash"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="transactionId">Transaction / Reference</Label>
                  <Input
                    id="transactionId"
                    value={formData.transactionId}
                    onChange={(e) =>
                      handleInputChange('transactionId', e.target.value)
                    }
                    placeholder="Transaction ID or reference number"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      handleInputChange('description', e.target.value)
                    }
                    placeholder="Optional description"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-end space-x-2">
            <Button type="button" variant="ghost" onClick={handleCancel}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              <Save className="mr-2 h-4 w-4" />
              {isSubmitting ? 'Saving...' : 'Save Receipt'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
