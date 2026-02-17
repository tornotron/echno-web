'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import {
  Wrench,
  Clock,
  MapPin,
  CheckCircle2,
  Circle,
  AlertTriangle,
  User,
  ClipboardList,
  HardHat,
  Coffee,
  Sun,
} from 'lucide-react';

// Helper function for priority colors
const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high': {
      return 'border-red-300 bg-red-50 text-red-700';
    }
    case 'medium': {
      return 'border-yellow-300 bg-yellow-50 text-yellow-700';
    }
    default: {
      return 'border-gray-300 bg-gray-50 text-gray-700';
    }
  }
};

// Mock data - filtered by logged-in user's assignments
const workerInfo = {
  name: 'John Doe',
  role: 'Mason',
  site: 'Site A - Block 1',
  supervisor: 'Mike Johnson',
  shift: '7:00 AM - 4:00 PM',
  checkInTime: '6:55 AM',
};

const todayTasks = [
  {
    id: 1,
    task: 'Complete foundation work - Section C',
    location: 'Block 1, Ground Floor',
    priority: 'high',
    status: 'in-progress',
    startTime: '7:00 AM',
    estimatedDuration: '4 hours',
    progress: 60,
    instructions:
      'Follow the blueprint specifications. Use grade M25 concrete.',
  },
  {
    id: 2,
    task: 'Install formwork for columns',
    location: 'Block 1, Ground Floor',
    priority: 'medium',
    status: 'pending',
    startTime: '11:00 AM',
    estimatedDuration: '2 hours',
    progress: 0,
    instructions: 'Ensure proper alignment. Double-check measurements.',
  },
  {
    id: 3,
    task: 'Safety equipment check',
    location: 'Equipment Storage',
    priority: 'high',
    status: 'completed',
    startTime: '6:45 AM',
    estimatedDuration: '15 mins',
    progress: 100,
    instructions: 'Daily PPE inspection before work.',
  },
  {
    id: 4,
    task: 'Material collection',
    location: 'Material Yard',
    priority: 'low',
    status: 'pending',
    startTime: '2:00 PM',
    estimatedDuration: '30 mins',
    progress: 0,
    instructions: 'Collect cement bags and aggregates for tomorrow.',
  },
];

const scheduleBreaks = [
  { time: '10:00 AM', type: 'Tea Break', duration: '15 mins', icon: Coffee },
  { time: '1:00 PM', type: 'Lunch Break', duration: '1 hour', icon: Sun },
  { time: '3:30 PM', type: 'Tea Break', duration: '15 mins', icon: Coffee },
];

const safetyReminders = [
  'Wear hard hat at all times',
  'Use safety harness for heights above 6 feet',
  'Report any unsafe conditions immediately',
  'Stay hydrated - water stations available',
];

const announcements = [
  {
    id: 1,
    message: 'Site inspection scheduled for 3:00 PM today',
    type: 'info',
    time: '8:00 AM',
  },
  {
    id: 2,
    message: 'New safety guidelines for concrete work',
    type: 'safety',
    time: 'Yesterday',
  },
];

export default function FieldWorkersDashboard() {
  const { data: session } = useSession();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [tasks, setTasks] = useState(todayTasks);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const userName =
    session?.user?.name?.split(' ')[0] || workerInfo.name.split(' ')[0];
  const completedTasks = tasks.filter((t) => t.status === 'completed').length;
  const totalTasks = tasks.length;
  const overallProgress = Math.round((completedTasks / totalTasks) * 100);

  const getTimeOfDay = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const handleTaskToggle = (taskId: number) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? {
              ...task,
              status: task.status === 'completed' ? 'pending' : 'completed',
              progress: task.status === 'completed' ? 0 : 100,
            }
          : task
      )
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': {
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      }
      case 'in-progress': {
        return <Clock className="h-5 w-5 text-blue-600" />;
      }
      default: {
        return <Circle className="h-5 w-5 text-gray-400" />;
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold sm:text-3xl">
            <Wrench className="h-7 w-7 text-yellow-600 sm:h-8 sm:w-8" />
            My Tasks
          </h1>
          <p className="text-muted-foreground mt-1">
            {getTimeOfDay()}, {userName}!
          </p>
        </div>
        <div className="flex items-center gap-3" />
      </div>

      {/* Worker Info & Progress */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5" />
              Today&apos;s Assignment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">Site</p>
                <p className="font-medium">{workerInfo.site}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Supervisor</p>
                <p className="font-medium">{workerInfo.supervisor}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Shift</p>
                <p className="font-medium">{workerInfo.shift}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Check-in</p>
                <p className="font-medium text-green-600">
                  {workerInfo.checkInTime}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ClipboardList className="h-5 w-5" />
              Today&apos;s Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">
                  {completedTasks}/{totalTasks}
                </span>
                <span className="text-muted-foreground text-sm">
                  tasks completed
                </span>
              </div>
              <Progress value={overallProgress} className="h-3" />
              <p className="text-muted-foreground text-center text-sm">
                {overallProgress}% of today&apos;s work done
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tasks List */}
      <Card>
        <CardHeader>
          <CardTitle>Today&apos;s Tasks</CardTitle>
          <CardDescription>Your assigned work for today</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`rounded-lg border p-4 transition-colors ${
                task.status === 'completed' ? 'bg-green-50 opacity-75' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="pt-1">
                  <Checkbox
                    checked={task.status === 'completed'}
                    onCheckedChange={() => handleTaskToggle(task.id)}
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <h4
                      className={`font-medium ${task.status === 'completed' ? 'text-muted-foreground line-through' : ''}`}
                    >
                      {task.task}
                    </h4>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={getPriorityColor(task.priority)}
                      >
                        {task.priority}
                      </Badge>
                      {getStatusIcon(task.status)}
                    </div>
                  </div>

                  <div className="text-muted-foreground flex flex-wrap gap-3 text-sm">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {task.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {task.startTime} ({task.estimatedDuration})
                    </span>
                  </div>

                  {task.status === 'in-progress' && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>Progress</span>
                        <span>{task.progress}%</span>
                      </div>
                      <Progress value={task.progress} className="h-2" />
                    </div>
                  )}

                  {task.instructions && task.status !== 'completed' && (
                    <div className="mt-2 rounded bg-blue-50 p-2 text-sm text-blue-800">
                      <strong>Instructions:</strong> {task.instructions}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Bottom Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Break Schedule */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Coffee className="h-5 w-5" />
              Break Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {scheduleBreaks.map((breakItem, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 rounded-lg border p-3"
                >
                  <breakItem.icon className="h-5 w-5 text-orange-500" />
                  <div className="flex-1">
                    <p className="font-medium">{breakItem.type}</p>
                    <p className="text-muted-foreground text-sm">
                      {breakItem.time} - {breakItem.duration}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Safety Reminders */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <HardHat className="h-5 w-5 text-yellow-600" />
              Safety Reminders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {safetyReminders.map((reminder, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                  <span>{reminder}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Announcements */}
      {announcements.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="h-5 w-5 text-blue-600" />
              Announcements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {announcements.map((announcement) => (
                <div
                  key={announcement.id}
                  className={`rounded-lg border p-3 ${
                    announcement.type === 'safety'
                      ? 'border-yellow-200 bg-yellow-50'
                      : 'border-blue-200 bg-blue-50'
                  }`}
                >
                  <p className="text-sm font-medium">{announcement.message}</p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {announcement.time}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
