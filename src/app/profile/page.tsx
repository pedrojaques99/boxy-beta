'use client';

import { createClient } from '@/lib/supabase/client';
import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';
import { handleError, handleSuccess } from '@/lib/error-handler';
import { Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
  const [uploadProgress, setUploadProgress] = useState(0);
  const supabase = createClient();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !profile) return;

    const file = e.target.files[0];
    if (!file.type.startsWith('image/')) {
      handleError(new Error('Please upload an image file'));
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      handleError(new Error('Image size should be less than 5MB'));
      return;
    }

    try {
      setUploadProgress(0);
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}-${Date.now()}.${fileExt}`;
      const filePath = `${profile.id}/${fileName}`;

      // Delete old avatar if exists
      if (profile.avatar_url) {
        const oldPath = profile.avatar_url.split('/').pop();
        if (oldPath) {
          await supabase.storage
            .from('avatars')
            .remove([`${profile.id}/${oldPath}`]);
        }
      }

      // Upload new avatar
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          // @ts-ignore - Supabase supports onUploadProgress but types are not updated
          onUploadProgress: (progress: UploadProgressEvent) => {
            setUploadProgress((progress.loaded / progress.total) * 100);
          },
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      setProfile({ ...profile, avatar_url: publicUrl });
      handleSuccess('Avatar updated successfully');
    } catch (error) {
      handleError(error);
    } finally {
      setUploadProgress(0);
    }
  };

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
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Profile Section */}
        <Card className="bg-card border-0 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold">Profile Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-6">
              {/* Avatar and Name Section */}
              <div className="flex items-start space-x-6">
                <div className="relative group">
                  <Avatar 
                    className="h-24 w-24 cursor-pointer transition-transform hover:ring-2 hover:ring-primary hover:ring-offset-2 ring-offset-background" 
                    onClick={handleAvatarClick}
                  >
                    <AvatarImage src={profile.avatar_url} />
                    <AvatarFallback className="text-lg">{profile.name?.[0] || 'U'}</AvatarFallback>
                  </Avatar>
                  <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <span className="text-white text-sm font-medium">Click to change</span>
                  </div>
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </div>
                <div className="flex flex-col">
                  <h2 className="text-2xl font-bold text-foreground">{profile.name}</h2>
                  <p className="text-muted-foreground">{profile.role}</p>
                </div>
              </div>

              {uploadProgress > 0 && (
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}

              {/* Bio Section */}
              <div className="space-y-2">
                <h3 className="font-semibold text-foreground">Bio</h3>
                <p className="text-muted-foreground">{profile.bio || 'No bio added yet.'}</p>
              </div>

              {/* Member Since Section */}
              <div className="space-y-2">
                <h3 className="font-semibold text-foreground">Member Since</h3>
                <p className="text-muted-foreground">
                  {new Date(profile.created_at).toLocaleDateString('en-US', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  })}
                </p>
              </div>

              <Button 
                onClick={() => router.push('/profile/edit')}
                className="w-fit"
                variant="default"
              >
                Edit Profile
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Settings Section */}
        <Card className="bg-card border-0 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold">Account Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button 
                onClick={() => router.push('/profile/payment')}
                className="w-full justify-start h-12 px-4"
                variant="outline"
              >
                Payment Settings
              </Button>
              <Button 
                onClick={() => router.push('/profile/security')}
                className="w-full justify-start h-12 px-4"
                variant="outline"
              >
                Security Settings
              </Button>
              <Button 
                onClick={() => router.push('/profile/notifications')}
                className="w-full justify-start h-12 px-4"
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