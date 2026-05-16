'use client';

import { useSession } from 'next-auth/react';
import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/shadcn/card';
import { Badge } from '@/components/shadcn/badge';
import { Button } from '@/components/shadcn/button';
import { Progress } from '@/components/shadcn/progress';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/shadcn/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/shadcn/table';
import {
  Handshake,
  FolderKanban,
  FileText,
  DollarSign,
  MessageSquare,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Download,
  Eye,
  ArrowRight,
  Building,
  TrendingUp,
  FileCheck,
  Send,
} from 'lucide-react';
import Link from 'next/link';
import { routes } from '@/nav';

// Helper function for status colors
const getStatusColor = (status: string) => {
  switch (status) {
    case 'paid':
    case 'completed': {
      return 'bg-green-100 text-green-800';
    }
    case 'pending':
    case 'in-progress': {
      return 'bg-yellow-100 text-yellow-800';
    }
    case 'overdue': {
      return 'bg-red-100 text-red-800';
    }
    default: {
      return 'bg-gray-100 text-gray-800';
    }
  }
};

// Helper function for currency formatting
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(amount);
};

// Mock data - filtered by logged-in user's organization
const portalStats = {
  activeProjects: 2,
  pendingInvoices: 3,
  totalContractValue: 450_000,
  completedMilestones: 8,
  upcomingDeadlines: 2,
};

const myProjects = [
  {
    id: '1',
    name: 'Commercial Building - Phase 1',
    organization: 'Acme Construction',
    status: 'in-progress',
    progress: 65,
    contractValue: 250_000,
    startDate: '2024-01-15',
    endDate: '2024-06-30',
    nextMilestone: 'Foundation completion',
    nextMilestoneDate: '2024-02-28',
  },
  {
    id: '2',
    name: 'Residential Complex - Electrical',
    organization: 'Acme Construction',
    status: 'in-progress',
    progress: 40,
    contractValue: 200_000,
    startDate: '2024-02-01',
    endDate: '2024-08-31',
    nextMilestone: 'First floor wiring',
    nextMilestoneDate: '2024-03-15',
  },
];

const invoices = [
  {
    id: 'INV-001',
    project: 'Commercial Building - Phase 1',
    amount: 50_000,
    status: 'paid',
    date: '2024-01-31',
    dueDate: '2024-02-15',
  },
  {
    id: 'INV-002',
    project: 'Commercial Building - Phase 1',
    amount: 75_000,
    status: 'pending',
    date: '2024-02-28',
    dueDate: '2024-03-15',
  },
  {
    id: 'INV-003',
    project: 'Residential Complex - Electrical',
    amount: 40_000,
    status: 'pending',
    date: '2024-02-15',
    dueDate: '2024-03-01',
  },
  {
    id: 'INV-004',
    project: 'Residential Complex - Electrical',
    amount: 30_000,
    status: 'overdue',
    date: '2024-01-15',
    dueDate: '2024-02-01',
  },
];

const documents = [
  {
    id: 1,
    name: 'Contract Agreement - Phase 1',
    type: 'contract',
    project: 'Commercial Building',
    date: '2024-01-10',
    size: '2.4 MB',
  },
  {
    id: 2,
    name: 'Work Order #WO-2024-015',
    type: 'work-order',
    project: 'Commercial Building',
    date: '2024-02-20',
    size: '156 KB',
  },
  {
    id: 3,
    name: 'Safety Compliance Certificate',
    type: 'certificate',
    project: 'All Projects',
    date: '2024-01-05',
    size: '890 KB',
  },
  {
    id: 4,
    name: 'Progress Report - February',
    type: 'report',
    project: 'Commercial Building',
    date: '2024-02-28',
    size: '1.2 MB',
  },
  {
    id: 5,
    name: 'Material Specifications',
    type: 'specification',
    project: 'Residential Complex',
    date: '2024-02-01',
    size: '3.1 MB',
  },
];

const messages = [
  {
    id: 1,
    from: 'Project Manager',
    subject: 'Schedule update for next week',
    date: '2 hours ago',
    unread: true,
  },
  {
    id: 2,
    from: 'Procurement Team',
    subject: 'Material delivery confirmation',
    date: '1 day ago',
    unread: true,
  },
  {
    id: 3,
    from: 'Finance Department',
    subject: 'Invoice INV-002 received',
    date: '2 days ago',
    unread: false,
  },
  {
    id: 4,
    from: 'Site Engineer',
    subject: 'Quality inspection scheduled',
    date: '3 days ago',
    unread: false,
  },
];

const upcomingEvents = [
  {
    id: 1,
    event: 'Site Progress Meeting',
    date: '2024-03-05',
    time: '10:00 AM',
    type: 'meeting',
  },
  {
    id: 2,
    event: 'Milestone Review - Foundation',
    date: '2024-03-08',
    time: '2:00 PM',
    type: 'review',
  },
  {
    id: 3,
    event: 'Safety Audit',
    date: '2024-03-12',
    time: '9:00 AM',
    type: 'audit',
  },
];

const getPortalTitle = () => {
  return 'Partner Portal';
};

export default function ExternalPortalDashboard() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState('overview');

  const userName = session?.user?.name || 'Partner';
  const unreadMessages = messages.filter((m) => m.unread).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold">
            <Handshake className="h-8 w-8 text-indigo-600" />
            {getPortalTitle()}
          </h1>
          <p className="text-muted-foreground mt-1">
            Welcome, {userName}! View your projects, documents, and invoices.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {unreadMessages > 0 && (
            <Badge className="bg-red-600">{unreadMessages} new messages</Badge>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Projects
            </CardTitle>
            <FolderKanban className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {portalStats.activeProjects}
            </div>
            <p className="text-muted-foreground text-xs">
              Projects you&apos;re involved in
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Contract Value
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(portalStats.totalContractValue)}
            </div>
            <p className="text-muted-foreground text-xs">
              Total active contracts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Invoices
            </CardTitle>
            <FileText className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {portalStats.pendingInvoices}
            </div>
            <p className="text-muted-foreground text-xs">Awaiting payment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Milestones</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {portalStats.completedMilestones}
            </div>
            <p className="text-muted-foreground text-xs">
              Completed milestones
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-none">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="messages">
            Messages {unreadMessages > 0 && `(${unreadMessages})`}
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Projects */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>My Projects</CardTitle>
                <CardDescription>
                  Projects you&apos;re currently involved in
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href={routes.portfolio.projects.href}>
                  View All <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {myProjects.map((project) => (
                <div key={project.id} className="rounded-lg border p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{project.name}</h4>
                        <Badge className={getStatusColor(project.status)}>
                          {project.status === 'in-progress'
                            ? 'In Progress'
                            : project.status}
                        </Badge>
                      </div>
                      <div className="text-muted-foreground flex flex-wrap gap-3 text-sm">
                        <span className="flex items-center gap-1">
                          <Building className="h-3 w-3" />
                          {project.organization}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          {formatCurrency(project.contractValue)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {project.startDate} - {project.endDate}
                        </span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link
                        href={
                          routes.portfolio.projects.allProjects.detail(
                            project.id
                          ).href
                        }
                      >
                        View Details
                      </Link>
                    </Button>
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{project.progress}%</span>
                    </div>
                    <Progress value={project.progress} className="h-2" />
                  </div>
                  <div className="mt-3 rounded bg-blue-50 p-2 text-sm">
                    <strong>Next Milestone:</strong> {project.nextMilestone}{' '}
                    (Due: {project.nextMilestoneDate})
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Upcoming Events */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Upcoming Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`rounded-full p-2 ${
                          event.type === 'meeting'
                            ? 'bg-blue-100'
                            : event.type === 'review'
                              ? 'bg-purple-100'
                              : 'bg-orange-100'
                        }`}
                      >
                        {event.type === 'meeting' && (
                          <MessageSquare className="h-4 w-4 text-blue-600" />
                        )}
                        {event.type === 'review' && (
                          <FileCheck className="h-4 w-4 text-purple-600" />
                        )}
                        {event.type === 'audit' && (
                          <CheckCircle2 className="h-4 w-4 text-orange-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{event.event}</p>
                        <p className="text-muted-foreground text-sm">
                          {event.date} at {event.time}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">{event.type}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invoices Tab */}
        <TabsContent value="invoices">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Invoices</CardTitle>
                <CardDescription>
                  Your billing and payment history
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href={routes.finance.invoices.href}>
                  View All <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">
                        {invoice.id}
                      </TableCell>
                      <TableCell>{invoice.project}</TableCell>
                      <TableCell>{formatCurrency(invoice.amount)}</TableCell>
                      <TableCell>{invoice.dueDate}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(invoice.status)}>
                          {invoice.status === 'paid' && (
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                          )}
                          {invoice.status === 'overdue' && (
                            <AlertCircle className="mr-1 h-3 w-3" />
                          )}
                          {invoice.status.charAt(0).toUpperCase() +
                            invoice.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
              <CardDescription>
                Contracts, reports, and project documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <FileText className="text-muted-foreground h-4 w-4" />
                          {doc.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{doc.type}</Badge>
                      </TableCell>
                      <TableCell>{doc.project}</TableCell>
                      <TableCell>{doc.date}</TableCell>
                      <TableCell>{doc.size}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Messages Tab */}
        <TabsContent value="messages">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Messages</CardTitle>
                <CardDescription>
                  Communication from project teams
                </CardDescription>
              </div>
              <Button size="sm">
                <Send className="mr-2 h-4 w-4" />
                New Message
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`hover:bg-muted/50 flex items-start gap-3 rounded-lg border p-4 transition-colors ${
                      message.unread ? 'border-blue-200 bg-blue-50' : ''
                    }`}
                  >
                    <div
                      className={`mt-1 h-2 w-2 rounded-full ${message.unread ? 'bg-blue-600' : 'bg-transparent'}`}
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p
                          className={`font-medium ${message.unread ? 'text-blue-900' : ''}`}
                        >
                          {message.from}
                        </p>
                        <span className="text-muted-foreground text-xs">
                          {message.date}
                        </span>
                      </div>
                      <p
                        className={`text-sm ${message.unread ? 'text-blue-800' : 'text-muted-foreground'}`}
                      >
                        {message.subject}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
