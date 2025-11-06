"use client"

import { useState, useEffect } from "react"
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
  Send,
  AlertCircle,
  FileText,
  AlertTriangle,
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
import { toast } from "@/lib/styles/toast-styles"

// Mock data for tasks
const mockTasks = [
  { id: 1, title: "Foundation Work Phase 1", projectName: "Metro Station Construction" },
  { id: 2, title: "Electrical Installation", projectName: "Highway Expansion Project" },
  { id: 3, title: "Structural Assessment", projectName: "Bridge Reconstruction" },
  { id: 4, title: "Safety Inspection", projectName: "Airport Terminal Development" },
  { id: 5, title: "Quality Review", projectName: "Metro Station Construction" },
]

export default function NewIssuePage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form state
  const [taskId, setTaskId] = useState<string>("")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [issueType, setIssueType] = useState<IssueType>(IssueType.technical)
  const [status, setStatus] = useState<IssueStatus>(IssueStatus.open)
  const [priority, setPriority] = useState<string>("medium")
  const [attachments, setAttachments] = useState<File[]>([])

  // Pre-fill task from URL parameters (client-side only)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const taskIdParam = params.get('taskId')
      const taskTitleParam = params.get('taskTitle')
      
      if (taskIdParam) {
        setTaskId(taskIdParam)
      }
      
      if (taskTitleParam) {
        // Optionally pre-fill the title with context
        setTitle(`Issue in: ${taskTitleParam}`)
      }
    }
  }, [])

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

  // Handle save as draft
  const handleSaveDraft = async () => {
    if (!title.trim()) {
      toast.error("Validation Error", {
        description: "Please fill in the title before saving draft"
      })
      return
    }

    setIsSubmitting(true)
    try {
      // TODO: Implement API call to save draft
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success("Draft Saved", {
        description: "Your issue has been saved as draft"
      })
      router.push("/dashboard/workflow/issues")
    } catch (error) {
      toast.error("Error", {
        description: "Failed to save draft. Please try again."
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      // TODO: Implement API call to create issue
      await new Promise(resolve => setTimeout(resolve, 1500))
      toast.success("Issue Created", {
        description: `Issue "${title}" has been created successfully`
      })
      router.push("/dashboard/workflow/issues")
    } catch (error) {
      toast.error("Error", {
        description: "Failed to create issue. Please try again."
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
              Report New Issue
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400">
              Document and track issues or problems
            </p>
          </div>
        </div>

        {/* Task Context Alert */}
        {taskId && (
          <Card className="mb-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Reporting issue for task
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    {mockTasks.find(t => t.id.toString() === taskId)?.title || "Selected Task"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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
                    Provide information about the issue
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
                        onValueChange={(value) => setStatus(value as IssueStatus)}
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
                      placeholder="Provide a detailed description of the issue, including:&#10;- What happened?&#10;- When did it occur?&#10;- What is the impact?&#10;- Steps to reproduce (if applicable)"
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
                    Attachments
                  </CardTitle>
                  <CardDescription>
                    Upload photos, documents, or other supporting files
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
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSaveDraft}
                  disabled={isSubmitting}
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save as Draft
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="ml-auto"
                >
                  <Send className="mr-2 h-4 w-4" />
                  {isSubmitting ? "Creating..." : "Create Issue"}
                </Button>
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
                    <span className="text-zinc-600 dark:text-zinc-400">Attachments</span>
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

              {/* Issue Types Guide */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Issue Types</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-xs">
                    <div>
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">Technical</p>
                      <p className="text-zinc-600 dark:text-zinc-400">Engineering or technical problems</p>
                    </div>
                    <div>
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">Safety</p>
                      <p className="text-zinc-600 dark:text-zinc-400">Safety hazards or violations</p>
                    </div>
                    <div>
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">Quality</p>
                      <p className="text-zinc-600 dark:text-zinc-400">Quality control issues</p>
                    </div>
                    <div>
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">Material</p>
                      <p className="text-zinc-600 dark:text-zinc-400">Material shortages or defects</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Guidelines */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Reporting Guidelines
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-xs text-zinc-600 dark:text-zinc-400">
                    <li className="flex items-start gap-2">
                      <span className="text-zinc-400">•</span>
                      <span>Be specific and clear in your description</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-zinc-400">•</span>
                      <span>Include all relevant details and context</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-zinc-400">•</span>
                      <span>Attach photos or documentation when possible</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-zinc-400">•</span>
                      <span>Select the appropriate issue type</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-zinc-400">•</span>
                      <span>Set priority based on urgency and impact</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-zinc-400">•</span>
                      <span>Link to related task if applicable</span>
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
                          For immediate safety hazards, contact the safety officer directly and follow emergency procedures.
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
                          Critical issues will be escalated immediately to project management.
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
