'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useUser } from '@tornotron/echno-core/user/hooks';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/shadcn/card';
import { Button } from '@/components/shadcn/button';
import { Switch } from '@/components/shadcn/switch';
import { Label } from '@/components/shadcn/label';
import { Separator } from '@/components/shadcn/separator';
import {
  User as UserIcon,
  Moon,
  Sun,
  Bell,
  Shield,
  Mail,
  Smartphone,
  Eye,
  Lock,
  AlertTriangle,
} from 'lucide-react';
import { toast } from '@/lib/styles/toast-styles';

interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  projectUpdates: boolean;
  taskReminders: boolean;
  leaveUpdates: boolean;
}

interface PrivacySettings {
  profileVisibility: boolean;
  activityStatus: boolean;
  dataSharing: boolean;
}

export default function SettingsPage() {
  const router = useRouter();
  const { data: user, isLoading: isUserLoading } = useUser();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(globalThis.window !== undefined);

  // Notification settings - initialize from localStorage
  const [notifications, setNotifications] = useState<NotificationSettings>(
    () => {
      if (globalThis.window === undefined) {
        return {
          emailNotifications: true,
          pushNotifications: true,
          projectUpdates: true,
          taskReminders: true,
          leaveUpdates: true,
        };
      }

      const savedNotifications = localStorage.getItem('notificationSettings');
      if (savedNotifications) {
        try {
          return JSON.parse(savedNotifications);
        } catch (error) {
          console.error('Failed to parse notification settings:', error);
        }
      }

      return {
        emailNotifications: true,
        pushNotifications: true,
        projectUpdates: true,
        taskReminders: true,
        leaveUpdates: true,
      };
    }
  );

  // Privacy settings - initialize from localStorage
  const [privacy, setPrivacy] = useState<PrivacySettings>(() => {
    if (globalThis.window === undefined) {
      return {
        profileVisibility: true,
        activityStatus: true,
        dataSharing: false,
      };
    }

    const savedPrivacy = localStorage.getItem('privacySettings');
    if (savedPrivacy) {
      try {
        return JSON.parse(savedPrivacy);
      } catch (error) {
        console.error('Failed to parse privacy settings:', error);
      }
    }

    return {
      profileVisibility: true,
      activityStatus: true,
      dataSharing: false,
    };
  });

  // Save notification settings to localStorage
  const updateNotificationSetting = (
    key: keyof NotificationSettings,
    value: boolean
  ) => {
    const newSettings = { ...notifications, [key]: value };
    setNotifications(newSettings);
    localStorage.setItem('notificationSettings', JSON.stringify(newSettings));
    toast.success('Settings Updated', {
      description: 'Your notification preferences have been saved',
    });
  };

  // Save privacy settings to localStorage
  const updatePrivacySetting = (key: keyof PrivacySettings, value: boolean) => {
    const newSettings = { ...privacy, [key]: value };
    setPrivacy(newSettings);
    localStorage.setItem('privacySettings', JSON.stringify(newSettings));
    toast.success('Settings Updated', {
      description: 'Your privacy preferences have been saved',
    });
  };

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    toast.success('Theme Updated', {
      description: `Switched to ${newTheme} mode`,
    });
  };

  if (isUserLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-red-500">User not found</p>
          <p className="text-sm text-zinc-600">Please log in again</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Profile Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <UserIcon className="h-5 w-5" />
            <CardTitle>Profile</CardTitle>
          </div>
          <CardDescription>
            Manage your profile information and personal details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-1">
              <p className="font-medium">{user.name}</p>
              <p className="text-muted-foreground text-sm">{user.email}</p>
            </div>
            <Button variant="outline" onClick={() => router.push('/profile')}>
              Edit Profile
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Appearance Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            {mounted && theme === 'dark' ? (
              <Moon className="h-5 w-5" />
            ) : (
              <Sun className="h-5 w-5" />
            )}
            <CardTitle>Appearance</CardTitle>
          </div>
          <CardDescription>
            Customize how the application looks on your device
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <Label>Theme</Label>
            <div className="grid grid-cols-3 gap-3">
              <Button
                variant={theme === 'light' ? 'default' : 'outline'}
                className="w-full"
                onClick={() => handleThemeChange('light')}
                disabled={!mounted}
              >
                <Sun className="mr-2 h-4 w-4" />
                Light
              </Button>
              <Button
                variant={theme === 'dark' ? 'default' : 'outline'}
                className="w-full"
                onClick={() => handleThemeChange('dark')}
                disabled={!mounted}
              >
                <Moon className="mr-2 h-4 w-4" />
                Dark
              </Button>
              <Button
                variant={theme === 'system' ? 'default' : 'outline'}
                className="w-full"
                onClick={() => handleThemeChange('system')}
                disabled={!mounted}
              >
                System
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <CardTitle>Notifications</CardTitle>
          </div>
          <CardDescription>
            Configure how you want to receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* General Notifications */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="text-muted-foreground h-4 w-4" />
                <div className="space-y-0.5">
                  <Label htmlFor="email-notifications">
                    Email Notifications
                  </Label>
                  <p className="text-muted-foreground text-sm">
                    Receive notifications via email
                  </p>
                </div>
              </div>
              <Switch
                id="email-notifications"
                checked={notifications.emailNotifications}
                onCheckedChange={(checked) =>
                  updateNotificationSetting('emailNotifications', checked)
                }
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Smartphone className="text-muted-foreground h-4 w-4" />
                <div className="space-y-0.5">
                  <Label htmlFor="push-notifications">Push Notifications</Label>
                  <p className="text-muted-foreground text-sm">
                    Receive push notifications on your device
                  </p>
                </div>
              </div>
              <Switch
                id="push-notifications"
                checked={notifications.pushNotifications}
                onCheckedChange={(checked) =>
                  updateNotificationSetting('pushNotifications', checked)
                }
              />
            </div>
          </div>

          <Separator />

          {/* Specific Notification Types */}
          <div className="space-y-4">
            <p className="text-sm font-medium">Notification Types</p>

            <div className="flex items-center justify-between pl-7">
              <div className="space-y-0.5">
                <Label htmlFor="project-updates">Project Updates</Label>
                <p className="text-muted-foreground text-sm">
                  Get notified about project changes
                </p>
              </div>
              <Switch
                id="project-updates"
                checked={notifications.projectUpdates}
                onCheckedChange={(checked) =>
                  updateNotificationSetting('projectUpdates', checked)
                }
              />
            </div>

            <div className="flex items-center justify-between pl-7">
              <div className="space-y-0.5">
                <Label htmlFor="task-reminders">Task Reminders</Label>
                <p className="text-muted-foreground text-sm">
                  Reminders for upcoming task deadlines
                </p>
              </div>
              <Switch
                id="task-reminders"
                checked={notifications.taskReminders}
                onCheckedChange={(checked) =>
                  updateNotificationSetting('taskReminders', checked)
                }
              />
            </div>

            <div className="flex items-center justify-between pl-7">
              <div className="space-y-0.5">
                <Label htmlFor="leave-updates">Leave Updates</Label>
                <p className="text-muted-foreground text-sm">
                  Updates on leave requests and approvals
                </p>
              </div>
              <Switch
                id="leave-updates"
                checked={notifications.leaveUpdates}
                onCheckedChange={(checked) =>
                  updateNotificationSetting('leaveUpdates', checked)
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Privacy & Security Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <CardTitle>Privacy & Security</CardTitle>
          </div>
          <CardDescription>
            Control your privacy and security preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Eye className="text-muted-foreground h-4 w-4" />
              <div className="space-y-0.5">
                <Label htmlFor="profile-visibility">Profile Visibility</Label>
                <p className="text-muted-foreground text-sm">
                  Allow others to view your profile
                </p>
              </div>
            </div>
            <Switch
              id="profile-visibility"
              checked={privacy.profileVisibility}
              onCheckedChange={(checked) =>
                updatePrivacySetting('profileVisibility', checked)
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Lock className="text-muted-foreground h-4 w-4" />
              <div className="space-y-0.5">
                <Label htmlFor="activity-status">Activity Status</Label>
                <p className="text-muted-foreground text-sm">
                  Show when you&apos;re online or active
                </p>
              </div>
            </div>
            <Switch
              id="activity-status"
              checked={privacy.activityStatus}
              onCheckedChange={(checked) =>
                updatePrivacySetting('activityStatus', checked)
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="text-muted-foreground h-4 w-4" />
              <div className="space-y-0.5">
                <Label htmlFor="data-sharing">Data Sharing</Label>
                <p className="text-muted-foreground text-sm">
                  Share anonymous usage data to improve the app
                </p>
              </div>
            </div>
            <Switch
              id="data-sharing"
              checked={privacy.dataSharing}
              onCheckedChange={(checked) =>
                updatePrivacySetting('dataSharing', checked)
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200 dark:border-red-900">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <CardTitle className="text-red-500">Danger Zone</CardTitle>
          </div>
          <CardDescription>
            Irreversible actions that affect your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/20">
            <div className="space-y-1">
              <p className="font-medium text-red-600 dark:text-red-400">
                Delete Account
              </p>
              <p className="text-sm text-red-600/80 dark:text-red-400/80">
                Permanently delete your account and all associated data
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={() => {
                toast.error('Feature Not Available', {
                  description:
                    'Account deletion is currently not available. Please contact support.',
                });
              }}
            >
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
