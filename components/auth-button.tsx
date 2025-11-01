"use client"

import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export function AuthButton() {
  const { data: session, status } = useSession()
  const router = useRouter()

  if (status === "loading") {
    return <Button disabled>Loading...</Button>
  }

  if (session) {
    return (
      <div className="flex items-center gap-4">
        <span>Welcome, {session.user?.name}</span>
                      <Button
                onClick={() => {
                  signOut({ callbackUrl: "/?logout=success" });
                }}
                variant="outline"
                size="sm"
              >
                Sign Out
              </Button>
      </div>
    )
  }

  return <Button onClick={() => router.push("/login")}>Sign In</Button>
}