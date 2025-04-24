'use client';

import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';
import { handleError } from '@/lib/error-handler';
import { Loader2 } from 'lucide-react';

interface UserProfile {
  id: string;
  name: string;
  avatar_url: string;
  role: string;
  bio: string;
  created_at: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/auth/login');
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;

        if (!profile) {
          // If profile doesn't exist, create one
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert([
              {
                id: user.id,
                name: user.email?.split('@')[0] || 'User',
                role: 'user',
                created_at: new Date().toISOString(),
              }
            ])
            .select()
            .single();

          if (createError) throw createError;
          setProfile(newProfile);
        } else {
          setProfile(profile);
        }
      } catch (error) {
        const { message } = handleError(error);
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <p className="text-destructive text-center mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Section */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4 mb-6">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile.avatar_url} />
                <AvatarFallback>{profile.name?.[0] || 'U'}</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-2xl font-bold">{profile.name}</h2>
                <p className="text-gray-600 dark:text-gray-300">{profile.role}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Bio</h3>
                <p className="text-gray-600 dark:text-gray-300">{profile.bio || 'No bio added yet.'}</p>
              </div>
              <div>
                <h3 className="font-medium mb-2">Member Since</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {new Date(profile.created_at).toLocaleDateString()}
                </p>
              </div>
              <Button onClick={() => router.push('/profile/edit')}>
                Edit Profile
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Settings Section */}
        <Card>
          <CardHeader>
            <CardTitle>Account Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button 
                onClick={() => router.push('/profile/payment')}
                className="w-full"
                variant="outline"
              >
                Payment Settings
              </Button>
              <Button 
                onClick={() => router.push('/profile/security')}
                className="w-full"
                variant="outline"
              >
                Security Settings
              </Button>
              <Button 
                onClick={() => router.push('/profile/notifications')}
                className="w-full"
                variant="outline"
              >
                Notification Preferences
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 