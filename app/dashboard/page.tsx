"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/lib/styles/toast-styles"
import { AppLayout } from "@/components/common/app-layout"

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  useEffect(() => {
    // Show login success toast when user arrives at dashboard
    if (status === "authenticated" && session && !localStorage.getItem('loginToastShown')) {
      toast.success("Login successful!", {
        description: "Welcome back to your dashboard.",
      })
      localStorage.setItem('loginToastShown', 'true')
    }
  }, [status, session])

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900 dark:border-zinc-100 mx-auto"></div>
          <p className="mt-4 text-zinc-600 dark:text-zinc-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <AppLayout>
      <div className="px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Quick Stats Cards */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Today's Attendance</CardTitle>
            <CardDescription>Current attendance status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">24/30</div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
              80% attendance rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Active Employees</CardTitle>
            <CardDescription>Currently working</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">28</div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
              +2 from yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pending Requests</CardTitle>
            <CardDescription>Leave and overtime requests</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">5</div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
              Requires approval
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Welcome Message */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Welcome to Echno Attendance System</CardTitle>
            <CardDescription>
              Manage your organization's attendance, leaves, and employee records efficiently.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-zinc-600 dark:text-zinc-400">
              This dashboard provides you with quick access to attendance data, employee management,
              and reporting tools. Use the navigation menu to explore different sections of the system.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
    </AppLayout>
  )
}