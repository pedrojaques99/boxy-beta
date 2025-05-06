'use client';

import { getAuthService } from '@/lib/auth/auth-service';
import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';
import { handleError, handleSuccess } from '@/lib/error-handler';
import { Loader2, Lock, Unlock, Crown, Settings, Edit2, Calendar, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useUser } from '@supabase/auth-helpers-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

interface UserProfile {
  id: string;
  name: string;
  avatar_url: string;
  role: string;
  bio: string;
  created_at: string;
  subscription_type: 'free' | 'premium';
}

export default function ProfilePage() {
  const user = useUser();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [cpf, setCpf] = useState(user?.user_metadata?.cpf || '');
  const authService = getAuthService();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const { data, error: userError } = await authService.getUser();
        
        if (userError) throw userError;
        
        if (!data.user) {
          throw new Error('User not found');
        }
        
        // First try to get existing profile
        let { data: existingProfile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        // If no profile exists, create one
        if (!existingProfile && !profileError) {
          const newProfile = {
            id: data.user.id,
            name: data.user.email?.split('@')[0] || 'User',
            role: 'user',
            bio: '',
            avatar_url: '',
            created_at: new Date().toISOString(),
            subscription_type: 'free'
          };

          const { data: createdProfile, error: createError } = await supabase
            .from('profiles')
            .insert([newProfile])
            .select()
            .single();

          if (createError) throw createError;
          
          existingProfile = createdProfile;
        } else if (profileError) {
          throw profileError;
        }

        setProfile(existingProfile);
      } catch (error) {
        console.error('Profile error:', error);
        const { error: errorMessage } = handleError(error);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router, supabase, authService]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !profile) return;

    const file = e.target.files[0];
    if (!file.type.startsWith('image/')) {
      const { error: errorMessage } = handleError(new Error('Please upload an image file'));
      toast.error(errorMessage);
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      const { error: errorMessage } = handleError(new Error('Image size should be less than 5MB'));
      toast.error(errorMessage);
      return;
    }

    try {
      setUploadProgress(0);
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}-${Date.now()}.${fileExt}`;
      const filePath = `${profile.id}/${fileName}`;

      if (profile.avatar_url) {
        const oldPath = profile.avatar_url.split('/').pop();
        if (oldPath) {
          await supabase.storage
            .from('avatars')
            .remove([`${profile.id}/${oldPath}`]);
        }
      }

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
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
      toast.success('Avatar updated successfully');
    } catch (error) {
      const { error: errorMessage } = handleError(error, 'Error updating avatar');
      toast.error(errorMessage);
    } finally {
      setUploadProgress(0);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { error } = await authService.updateUser({
        data: { cpf }
      });
      if (error) throw error;
      toast.success('CPF updated successfully');
    } catch (err) {
      const { error: errorMessage } = handleError(err, 'Error updating CPF');
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="bg-card border-0 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-semibold">Profile Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-6">
                <div className="flex items-start space-x-6">
                  <Skeleton className="h-24 w-24 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-0 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-semibold">Account Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            </CardContent>
          </Card>
        </div>
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
                  <div className="mt-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium gap-1 ${
                      profile.subscription_type === 'premium' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-stone-100 text-stone-800 dark:bg-stone-800 dark:text-stone-200'
                    }`}>
                      {profile.subscription_type === 'premium' ? (
                        <>
                          <Crown className="h-3 w-3" />
                          Premium
                        </>
                      ) : (
                        <>
                          <User className="h-3 w-3" />
                          Free
                        </>
                      )}
                    </span>
                  </div>
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

              <Separator />

              {/* Bio Section */}
              <div className="space-y-2">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Edit2 className="h-4 w-4" />
                  Bio
                </h3>
                <p className="text-muted-foreground">{profile.bio || 'No bio added yet.'}</p>
              </div>

              {/* Member Since Section */}
              <div className="space-y-2">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Member Since
                </h3>
                <p className="text-muted-foreground">
                  {new Date(profile.created_at).toLocaleDateString('en-US', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  })}
                </p>
              </div>

              <Separator />

              {/* Subscription Info Section */}
              <div className="space-y-2">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  {profile.subscription_type === 'premium' ? (
                    <Unlock className="h-4 w-4" />
                  ) : (
                    <Lock className="h-4 w-4" />
                  )}
                  Subscription
                </h3>
                <div className="flex flex-col gap-2">
                  <p className="text-muted-foreground">
                    Current Plan: <span className="font-medium text-foreground capitalize">{profile.subscription_type}</span>
                  </p>
                  {profile.subscription_type === 'free' && (
                    <Button 
                      onClick={() => router.push('/price')}
                      variant="default"
                      size="sm"
                      className="w-fit"
                    >
                      <Crown className="h-4 w-4 mr-2" />
                      Upgrade to Premium
                    </Button>
                  )}
                </div>
              </div>

              <Button 
                onClick={() => router.push('/profile/edit')}
                className="w-fit"
                variant="outline"
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Settings Section */}
        <Card className="bg-card border-0 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Account Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button 
                onClick={() => router.push('/profile/payment')}
                className="w-full justify-start h-12 px-4"
                variant="outline"
              >
                <Crown className="h-4 w-4 mr-2" />
                Payment Settings
              </Button>
              <Button 
                onClick={() => router.push('/profile/security')}
                className="w-full justify-start h-12 px-4"
                variant="outline"
              >
                <Lock className="h-4 w-4 mr-2" />
                Security Settings
              </Button>
              <Button 
                onClick={() => router.push('/profile/notifications')}
                className="w-full justify-start h-12 px-4"
                variant="outline"
              >
                <Settings className="h-4 w-4 mr-2" />
                Notification Preferences
              </Button>
              <Button 
                onClick={() => router.push('/price')}
                className="w-full justify-start h-12 px-4"
                variant="outline"
              >
                <Crown className="h-4 w-4 mr-2" />
                Manage Subscription
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 