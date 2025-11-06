"use client"

import { useState, use } from "react"
import { AppLayout } from "@/components/common"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Upload,
  X,
  Save,
  AlertCircle,
  FileText,
  AlertTriangle,
  Trash2,
} from "lucide-react"
import { useRouter } from "next/navigation"
import {
  IssueType,
  getIssueTypeLabel,
  getIssueTypeColor,
} from "@/types/issue/issue-type"
import {
  IssueStatus,
  getIssueStatusLabel,
} from "@/types/issue/issue-status"
import { mockIssues } from "@/lib/mock-data"
import { toast } from "@/lib/styles/toast-styles"

// Mock data for tasks
const mockTasks = [
  { id: 1, title: "Foundation Work Phase 1", projectName: "Metro Station Construction" },
  { id: 2, title: "Electrical Installation", projectName: "Highway Expansion Project" },
  { id: 3, title: "Structural Assessment", projectName: "Bridge Reconstruction" },
  { id: 4, title: "Safety Inspection", projectName: "Airport Terminal Development" },
  { id: 5, title: "Quality Review", projectName: "Metro Station Construction" },
]

interface PageProps {
  params: Promise<{ id: string }>
}

export default function EditIssuePage({ params }: PageProps) {
  const { id } = use(params)
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Find the issue to edit
  const issueToEdit = mockIssues.find((i) => i.id?.toString() === id)

  // Form state - initialize with existing issue data
  const [taskId, setTaskId] = useState<string>(issueToEdit?.taskId?.toString() || "")
  const [title, setTitle] = useState(issueToEdit?.title || "")
  const [description, setDescription] = useState(issueToEdit?.description || "")
  const [issueType, setIssueType] = useState<IssueType>(issueToEdit?.type || IssueType.technical)
  const [status, setStatus] = useState<IssueStatus>(issueToEdit?.status || IssueStatus.open)
  const [priority, setPriority] = useState<string>("medium")
  const [attachments, setAttachments] = useState<File[]>([])

  if (!issueToEdit) {
    return (
      <AppLayout>
        <div className="px-4 py-8">
          <Card>
            <CardContent className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-zinc-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                Issue not found
              </h3>
              <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                The issue you're trying to edit doesn't exist.
              </p>
              <Button onClick={() => router.push("/dashboard/workflow/issues")}>
                Back to Issues
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    )
  }

  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      setAttachments([...attachments, ...newFiles])
    }
  }

  // Remove attachment
  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index))
  }

  // Get priority color
  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
      medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300",
      high: "bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300",
      critical: "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300",
    }
    return colors[priority] || colors.medium
  }

  // Handle status change with immediate feedback
  const handleStatusChange = (newStatus: IssueStatus) => {
    setStatus(newStatus)
    toast.success("Status Updated", {
      description: `Issue status changed to ${getIssueStatusLabel(newStatus)}`
    })
  }

  // Validate form
  const validateForm = () => {
    if (!title.trim()) {
      toast.error("Validation Error", { description: "Please enter an issue title" })
      return false
    }
    if (title.trim().length < 5) {
      toast.error("Validation Error", { description: "Title must be at least 5 characters" })
      return false
    }
    if (!description.trim()) {
      toast.error("Validation Error", { description: "Please provide a description" })
      return false
    }
    if (description.trim().length < 20) {
      toast.error("Validation Error", { description: "Description must be at least 20 characters" })
      return false
    }
    return true
  }

  // Handle delete
  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this issue? This action cannot be undone.")) {
      return
    }

    setIsDeleting(true)
    try {
      // TODO: Implement API call to delete issue
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success("Issue Deleted", {
        description: "The issue has been deleted successfully"
      })
      router.push("/dashboard/workflow/issues")
    } catch (error) {
      toast.error("Error", {
        description: "Failed to delete issue. Please try again."
      })
    } finally {
      setIsDeleting(false)
    }
  }

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      // TODO: Implement API call to update issue
      await new Promise(resolve => setTimeout(resolve, 1500))
      toast.success("Issue Updated", {
        description: `Issue "${title}" has been updated successfully`
      })
      router.push(`/dashboard/workflow/issues/${id}`)
    } catch (error) {
      toast.error("Error", {
        description: "Failed to update issue. Please try again."
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AppLayout>
      <div className="px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
              Edit Issue
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400">
              Update issue information
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Details Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Issue Details
                  </CardTitle>
                  <CardDescription>
                    Update information about the issue
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Related Task (Optional) */}
                  <div className="space-y-2">
                    <Label htmlFor="task">Related Task (Optional)</Label>
                    <Select value={taskId} onValueChange={setTaskId}>
                      <SelectTrigger id="task">
                        <SelectValue placeholder="Select a task (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockTasks.map((task) => (
                          <SelectItem key={task.id} value={task.id.toString()}>
                            <div className="flex flex-col">
                              <span>{task.title}</span>
                              <span className="text-xs text-zinc-500">
                                {task.projectName}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Issue Title */}
                  <div className="space-y-2">
                    <Label htmlFor="title">
                      Issue Title <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="title"
                      placeholder="Enter a brief, descriptive title..."
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Minimum 5 characters ({title.length}/5)
                    </p>
                  </div>

                  {/* Issue Type, Status, Priority */}
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="issueType">
                        Type <span className="text-red-500">*</span>
                      </Label>
                      <Select 
                        value={issueType} 
                        onValueChange={(value) => setIssueType(value as IssueType)}
                      >
                        <SelectTrigger id="issueType">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.values(IssueType).map((type) => (
                            <SelectItem key={type} value={type}>
                              {getIssueTypeLabel(type)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status">
                        Status <span className="text-red-500">*</span>
                      </Label>
                      <Select 
                        value={status} 
                        onValueChange={(value) => handleStatusChange(value as IssueStatus)}
                      >
                        <SelectTrigger id="status">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.values(IssueStatus).map((s) => (
                            <SelectItem key={s} value={s}>
                              {getIssueStatusLabel(s)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="priority">
                        Priority <span className="text-red-500">*</span>
                      </Label>
                      <Select value={priority} onValueChange={setPriority}>
                        <SelectTrigger id="priority">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description">
                      Description <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="description"
                      placeholder="Provide a detailed description of the issue..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={8}
                      className="resize-none"
                    />
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Minimum 20 characters ({description.length}/20)
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Attachments Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Add More Attachments
                  </CardTitle>
                  <CardDescription>
                    Upload additional photos, documents, or supporting files
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* File Upload */}
                  <div className="space-y-2">
                    <Label htmlFor="attachments">Upload Files</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="attachments"
                        type="file"
                        onChange={handleFileChange}
                        multiple
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.mp4,.mov"
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById("attachments")?.click()}
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Choose Files
                      </Button>
                      <span className="text-sm text-zinc-500 dark:text-zinc-400">
                        Photos, Videos, PDFs (Max 10MB each)
                      </span>
                    </div>
                  </div>

                  {/* Attachment List */}
                  {attachments.length > 0 && (
                    <div className="space-y-2">
                      {attachments.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg"
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-zinc-500" />
                            <span className="text-sm text-zinc-900 dark:text-zinc-100">
                              {file.name}
                            </span>
                            <span className="text-xs text-zinc-500">
                              ({(file.size / 1024).toFixed(1)} KB)
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeAttachment(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isSubmitting || isDeleting}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {isDeleting ? "Deleting..." : "Delete Issue"}
                </Button>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={isSubmitting || isDeleting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || isDeleting}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {isSubmitting ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Summary Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Issue Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-600 dark:text-zinc-400">Type</span>
                    <Badge 
                      variant="outline"
                      style={{ 
                        borderColor: getIssueTypeColor(issueType),
                        color: getIssueTypeColor(issueType)
                      }}
                    >
                      {getIssueTypeLabel(issueType)}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-600 dark:text-zinc-400">Status</span>
                    <Badge variant="outline">
                      {getIssueStatusLabel(status)}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-600 dark:text-zinc-400">Priority</span>
                    <Badge className={getPriorityColor(priority)}>
                      {priority.charAt(0).toUpperCase() + priority.slice(1)}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-600 dark:text-zinc-400">New Attachments</span>
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">
                      {attachments.length}
                    </span>
                  </div>
                  {taskId && (
                    <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700">
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                        Linked to:
                      </p>
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {mockTasks.find(t => t.id.toString() === taskId)?.title}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Real-time Updates Info */}
              <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-green-900 dark:text-green-100">
                        Real-time Updates
                      </p>
                      <p className="text-xs text-green-700 dark:text-green-300">
                        Status changes are saved immediately and relevant team members will be notified.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Guidelines */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Edit Guidelines
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-xs text-zinc-600 dark:text-zinc-400">
                    <li className="flex items-start gap-2">
                      <span className="text-zinc-400">•</span>
                      <span>Changes are saved when you click Save Changes</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-zinc-400">•</span>
                      <span>Status updates notify relevant stakeholders</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-zinc-400">•</span>
                      <span>All changes are logged in the issue history</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-zinc-400">•</span>
                      <span>Deleting an issue cannot be undone</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Safety Alert */}
              {issueType === IssueType.safety && (
                <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-red-900 dark:text-red-100">
                          Safety Issue
                        </p>
                        <p className="text-xs text-red-700 dark:text-red-300">
                          For immediate safety hazards, contact the safety officer directly.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Priority Alert */}
              {priority === "critical" && (
                <Card className="bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-orange-900 dark:text-orange-100">
                          Critical Priority
                        </p>
                        <p className="text-xs text-orange-700 dark:text-orange-300">
                          This issue requires immediate attention from project management.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </form>
      </div>
    </AppLayout>
  )
}
