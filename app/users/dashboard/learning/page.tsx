'use client';

import { useSession } from 'next-auth/react';
import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  GraduationCap,
  BookOpen,
  Clock,
  CheckCircle2,
  Play,
  Award,
  Calendar,
  Target,
  TrendingUp,
  FileText,
  Video,
  Users,
  Star,
  Lock,
} from 'lucide-react';
import { UserGroupBadge } from '@/components/rbac/user-group-badge';

// Helper function for category colors
const getCategoryColor = (category: string) => {
  switch (category.toLowerCase()) {
    case 'safety': {
      return 'bg-red-100 text-red-800 border-red-200';
    }
    case 'technical': {
      return 'bg-blue-100 text-blue-800 border-blue-200';
    }
    case 'practical': {
      return 'bg-green-100 text-green-800 border-green-200';
    }
    default: {
      return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }
};

// Mock data - filtered by trainee's assigned program
const traineeStats = {
  coursesCompleted: 5,
  totalCourses: 12,
  hoursLearned: 24,
  certifications: 2,
  currentStreak: 7,
  overallProgress: 42,
};

const currentCourses = [
  {
    id: 1,
    title: 'Construction Safety Fundamentals',
    category: 'Safety',
    progress: 75,
    totalModules: 8,
    completedModules: 6,
    duration: '4 hours',
    instructor: 'John Smith',
    nextLesson: 'Fall Protection Systems',
    deadline: '2024-03-15',
    status: 'in-progress',
  },
  {
    id: 2,
    title: 'Blueprint Reading Basics',
    category: 'Technical',
    progress: 45,
    totalModules: 10,
    completedModules: 4,
    duration: '6 hours',
    instructor: 'Sarah Johnson',
    nextLesson: 'Understanding Elevations',
    deadline: '2024-03-20',
    status: 'in-progress',
  },
  {
    id: 3,
    title: 'Hand Tools & Equipment',
    category: 'Practical',
    progress: 20,
    totalModules: 6,
    completedModules: 1,
    duration: '3 hours',
    instructor: 'Mike Wilson',
    nextLesson: 'Power Tool Safety',
    deadline: '2024-03-25',
    status: 'in-progress',
  },
];

const upcomingCourses = [
  {
    id: 4,
    title: 'Concrete Mixing & Pouring',
    category: 'Practical',
    duration: '5 hours',
    startDate: '2024-03-18',
    locked: false,
  },
  {
    id: 5,
    title: 'Scaffolding Safety',
    category: 'Safety',
    duration: '3 hours',
    startDate: '2024-03-25',
    locked: true,
  },
  {
    id: 6,
    title: 'First Aid Certification',
    category: 'Safety',
    duration: '8 hours',
    startDate: '2024-04-01',
    locked: true,
  },
];

const completedCourses = [
  {
    id: 7,
    title: 'Workplace Safety Orientation',
    category: 'Safety',
    completedDate: '2024-01-15',
    score: 95,
    certificate: true,
  },
  {
    id: 8,
    title: 'Basic Mathematics for Construction',
    category: 'Technical',
    completedDate: '2024-01-25',
    score: 88,
    certificate: false,
  },
  {
    id: 9,
    title: 'Introduction to Construction Industry',
    category: 'General',
    completedDate: '2024-02-05',
    score: 92,
    certificate: true,
  },
];

const achievements = [
  {
    id: 1,
    title: 'Quick Learner',
    description: 'Completed 5 courses',
    icon: Award,
    earned: true,
    date: '2024-02-10',
  },
  {
    id: 2,
    title: 'Safety First',
    description: 'Perfect score on safety quiz',
    icon: CheckCircle2,
    earned: true,
    date: '2024-01-20',
  },
  {
    id: 3,
    title: '7-Day Streak',
    description: 'Learned 7 days in a row',
    icon: TrendingUp,
    earned: true,
    date: '2024-02-28',
  },
  {
    id: 4,
    title: 'Certified Pro',
    description: 'Earn 5 certificates',
    icon: GraduationCap,
    earned: false,
    progress: 40,
  },
];

const schedule = [
  {
    day: 'Monday',
    time: '9:00 AM - 12:00 PM',
    activity: 'Theory Classes',
    location: 'Training Room A',
  },
  {
    day: 'Monday',
    time: '1:00 PM - 4:00 PM',
    activity: 'Practical Training',
    location: 'Workshop',
  },
  {
    day: 'Tuesday',
    time: '9:00 AM - 12:00 PM',
    activity: 'Safety Training',
    location: 'Training Room B',
  },
  {
    day: 'Wednesday',
    time: '9:00 AM - 4:00 PM',
    activity: 'On-site Shadowing',
    location: 'Site A',
  },
];

const mentor = {
  name: 'Michael Brown',
  role: 'Senior Site Engineer',
  experience: '15 years',
  nextMeeting: '2024-03-05 at 10:00 AM',
};

export default function LearningDashboard() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState('courses');

  const userName = session?.user?.name?.split(' ')[0] || 'Trainee';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold">
            <GraduationCap className="h-8 w-8 text-teal-600" />
            Learning Center
          </h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, {userName}! Continue your learning journey.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <UserGroupBadge showIcon />
          <Badge className="bg-orange-100 text-orange-800">
            <TrendingUp className="mr-1 h-3 w-3" />
            {traineeStats.currentStreak} day streak
          </Badge>
        </div>
      </div>

      {/* Progress Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Courses Completed
            </CardTitle>
            <BookOpen className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {traineeStats.coursesCompleted}/{traineeStats.totalCourses}
            </div>
            <Progress
              value={
                (traineeStats.coursesCompleted / traineeStats.totalCourses) *
                100
              }
              className="mt-2 h-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hours Learned</CardTitle>
            <Clock className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {traineeStats.hoursLearned}h
            </div>
            <p className="text-muted-foreground text-xs">Total learning time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Certifications
            </CardTitle>
            <Award className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {traineeStats.certifications}
            </div>
            <p className="text-muted-foreground text-xs">Certificates earned</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Overall Progress
            </CardTitle>
            <Target className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {traineeStats.overallProgress}%
            </div>
            <Progress
              value={traineeStats.overallProgress}
              className="mt-2 h-2"
            />
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
          <TabsTrigger value="courses">My Courses</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="mentor">Mentor</TabsTrigger>
        </TabsList>

        {/* Courses Tab */}
        <TabsContent value="courses" className="space-y-6">
          {/* Current Courses */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5 text-green-600" />
                Continue Learning
              </CardTitle>
              <CardDescription>Pick up where you left off</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentCourses.map((course) => (
                <div key={course.id} className="rounded-lg border p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-semibold">{course.title}</h4>
                        <Badge
                          variant="outline"
                          className={getCategoryColor(course.category)}
                        >
                          {course.category}
                        </Badge>
                      </div>
                      <div className="text-muted-foreground flex flex-wrap gap-3 text-sm">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {course.instructor}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {course.duration}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Due: {course.deadline}
                        </span>
                      </div>
                      <div className="rounded bg-blue-50 p-2 text-sm">
                        <strong>Next:</strong> {course.nextLesson}
                      </div>
                    </div>
                    <Button className="shrink-0">
                      <Play className="mr-2 h-4 w-4" />
                      Continue
                    </Button>
                  </div>
                  <div className="mt-4 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>
                        {course.completedModules}/{course.totalModules} modules
                      </span>
                      <span>{course.progress}%</span>
                    </div>
                    <Progress value={course.progress} className="h-2" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Upcoming Courses */}
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Courses</CardTitle>
              <CardDescription>Courses scheduled for you</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingCourses.map((course) => (
                  <div
                    key={course.id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="flex items-center gap-3">
                      {course.locked ? (
                        <Lock className="h-5 w-5 text-gray-400" />
                      ) : (
                        <BookOpen className="h-5 w-5 text-blue-600" />
                      )}
                      <div>
                        <p
                          className={`font-medium ${course.locked ? 'text-muted-foreground' : ''}`}
                        >
                          {course.title}
                        </p>
                        <div className="text-muted-foreground flex gap-2 text-sm">
                          <Badge
                            variant="outline"
                            className={getCategoryColor(course.category)}
                          >
                            {course.category}
                          </Badge>
                          <span>{course.duration}</span>
                          <span>Starts: {course.startDate}</span>
                        </div>
                      </div>
                    </div>
                    {course.locked ? (
                      <Badge variant="outline">Locked</Badge>
                    ) : (
                      <Button variant="outline" size="sm">
                        Preview
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Completed Courses */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Completed Courses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {completedCourses.map((course) => (
                  <div
                    key={course.id}
                    className="flex items-center justify-between rounded-lg border bg-green-50 p-4"
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium">{course.title}</p>
                        <div className="text-muted-foreground flex gap-2 text-sm">
                          <Badge
                            variant="outline"
                            className={getCategoryColor(course.category)}
                          >
                            {course.category}
                          </Badge>
                          <span>Score: {course.score}%</span>
                          <span>Completed: {course.completedDate}</span>
                        </div>
                      </div>
                    </div>
                    {course.certificate && (
                      <Button variant="outline" size="sm">
                        <Award className="mr-2 h-4 w-4" />
                        Certificate
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Schedule Tab */}
        <TabsContent value="schedule">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Schedule</CardTitle>
              <CardDescription>Your training timetable</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {schedule.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-4 rounded-lg border p-4"
                  >
                    <div className="min-w-[100px]">
                      <p className="font-semibold">{item.day}</p>
                      <p className="text-muted-foreground text-sm">
                        {item.time}
                      </p>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{item.activity}</p>
                      <p className="text-muted-foreground text-sm">
                        {item.location}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Achievements Tab */}
        <TabsContent value="achievements">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                Achievements
              </CardTitle>
              <CardDescription>
                Badges and milestones you&apos;ve earned
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                {achievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className={`rounded-lg border p-4 ${
                      achievement.earned
                        ? 'border-yellow-200 bg-yellow-50'
                        : 'opacity-60'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`rounded-full p-2 ${
                          achievement.earned ? 'bg-yellow-100' : 'bg-gray-100'
                        }`}
                      >
                        <achievement.icon
                          className={`h-6 w-6 ${
                            achievement.earned
                              ? 'text-yellow-600'
                              : 'text-gray-400'
                          }`}
                        />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold">{achievement.title}</h4>
                        <p className="text-muted-foreground text-sm">
                          {achievement.description}
                        </p>
                        {achievement.earned ? (
                          <p className="mt-1 text-xs text-green-600">
                            Earned on {achievement.date}
                          </p>
                        ) : (
                          <div className="mt-2">
                            <Progress
                              value={achievement.progress}
                              className="h-1"
                            />
                            <p className="text-muted-foreground mt-1 text-xs">
                              {achievement.progress}% complete
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Mentor Tab */}
        <TabsContent value="mentor">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Your Mentor</CardTitle>
                <CardDescription>
                  Your assigned guide throughout the program
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-100">
                    <Users className="h-8 w-8 text-teal-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{mentor.name}</h3>
                    <p className="text-muted-foreground">{mentor.role}</p>
                    <p className="text-muted-foreground text-sm">
                      {mentor.experience} experience
                    </p>
                    <div className="mt-3 rounded bg-blue-50 p-2 text-sm">
                      <strong>Next Meeting:</strong> {mentor.nextMeeting}
                    </div>
                    <Button className="mt-4">Schedule Meeting</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resources</CardTitle>
                <CardDescription>Helpful materials and guides</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="mr-2 h-4 w-4" />
                    Training Handbook
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Video className="mr-2 h-4 w-4" />
                    Video Tutorials
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <BookOpen className="mr-2 h-4 w-4" />
                    Study Materials
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Users className="mr-2 h-4 w-4" />
                    Trainee Forum
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
