'use client';

import { useState, useEffect, useRef } from 'react';
import { User } from '@/types/user/user';
import { UserProfileView } from '@/components/user-profile/user-profile-view';
import { ProfileEditForm } from '@/components/user-profile/profile-edit-form';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { toast } from '@/lib/styles/toast-styles';

interface ProfilePageClientProps {
  user: User;
}

export function ProfilePageClient({ user }: ProfilePageClientProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [currentUser, setCurrentUser] = useState(user);
  const loginToastShown = useRef(false);

  // Show login success toast if redirected from login (client-side only)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const loginParam = params.get('login');
      if (loginParam === 'success' && !loginToastShown.current) {
        loginToastShown.current = true;
        
        const timer = setTimeout(() => {
          toast.success("Login successful!", {
            description: "Welcome to your profile.",
          });
          
          // Clean up URL
          const url = new URL(window.location.href);
          url.searchParams.delete('login');
          window.history.replaceState({}, '', url.toString());
        }, 100);
        
        return () => clearTimeout(timer);
      }
    }
  }, []);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleSuccess = (updatedUser: User) => {
    setCurrentUser(updatedUser);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Profile
          </Button>
        </div>
        <ProfileEditForm
          user={currentUser}
          onCancel={handleCancel}
          onSuccess={handleSuccess}
        />
      </div>
    );
  }

  return (
    <UserProfileView
      user={currentUser}
      showEditButton={true}
      onEdit={handleEdit}
      variant="detailed"
    />
  );
}
