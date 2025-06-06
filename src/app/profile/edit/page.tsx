'use client';

import { getAuthService } from '@/lib/auth/auth-service';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { handleError } from '@/lib/error-handler';
import { Loader2, ImagePlus } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from '@/hooks/use-translations';
import { createClient } from '@/lib/supabase/client';

interface UserProfile {
  id: string;
  name: string;
  avatar_url: string;
  role: string;
  bio: string;
  created_at: string;
}

interface UploadProgressEvent {
  loaded: number;
  total: number;
}

export default function EditProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const authService = getAuthService();
  const router = useRouter();
  const { t } = useTranslations();
  const supabase = createClient();

  const safeT = (key: string): string => {
    if (!t) return key;
    const keys = key.split('.');
    let value: any = t;
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return key;
      }
    }
    return typeof value === 'string' ? value : key;
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        // Middleware now handles auth redirects, we can assume user exists
        
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;
        if (!profile) throw new Error('Profile not found');

        setProfile(profile);
      } catch (error) {
        const { error: errorMessage } = handleError(error);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setSaving(true);
    try {
      // Validate required fields
      if (!profile.name?.trim()) {
        const { error: errorMessage } = handleError(new Error('Name is required'));
        toast.error(errorMessage);
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          name: profile.name.trim(),
          role: profile.role?.trim(),
          bio: profile.bio?.trim(),
        })
        .eq('id', profile.id);

      if (error) throw error;
      
      toast.success(safeT('profileEdit.updateSuccess'));
      router.push('/profile');
    } catch (error) {
      const { error: errorMessage } = handleError(error, 'Error updating profile');
      toast.error(errorMessage);
      setSaving(false);
    }
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

      // Delete old avatar if exists
      if (profile.avatar_url) {
        const oldPath = profile.avatar_url.split('/').pop();
        if (oldPath) {
          await supabase.storage
            .from('avatar')
            .remove([`${profile.id}/${oldPath}`]);
        }
      }

      // Upload new avatar
      const { error: uploadError } = await supabase.storage
        .from('avatar')
        .upload(filePath, file, {
          // @ts-ignore - Supabase supports onUploadProgress but types are not updated
          onUploadProgress: (progress: UploadProgressEvent) => {
            setUploadProgress((progress.loaded / progress.total) * 100);
          },
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatar')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      setProfile({ ...profile, avatar_url: publicUrl });
      toast.success(safeT('profileEdit.avatarUpdateSuccess'));
    } catch (error) {
      const { error: errorMessage } = handleError(error, 'Error updating avatar');
      toast.error(errorMessage);
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
              {safeT('profileEdit.tryAgain')}
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
      <Card>
        <CardHeader>
          <CardTitle>{safeT('profileEdit.editProfile')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="relative group">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={profile.avatar_url} />
                  <AvatarFallback>{profile.name?.[0] || 'U'}</AvatarFallback>
                </Avatar>
                <input
                  id="avatar"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => document.getElementById('avatar')?.click()}
                  className="absolute -bottom-2 -right-2 p-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <ImagePlus className="h-4 w-4" />
                </button>
                {uploadProgress > 0 && (
                  <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                    <div className="w-16 h-1 bg-stone-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="name">{safeT('profileEdit.name')}</Label>
              <Input
                id="name"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                required
                className="dark:bg-stone-900 dark:text-stone-100 dark:border-stone-700 dark:placeholder:text-stone-500"
              />
            </div>

            <div>
              <Label htmlFor="role">{safeT('profileEdit.role')}</Label>
              <Input
                id="role"
                value={profile.role}
                onChange={(e) => setProfile({ ...profile, role: e.target.value })}
                placeholder={safeT('profileEdit.rolePlaceholder')}
                className="dark:bg-stone-900 dark:text-stone-100 dark:border-stone-700 dark:placeholder:text-stone-500"
              />
            </div>

            <div>
              <Label htmlFor="bio">{safeT('profileEdit.bio')}</Label>
              <Textarea
                id="bio"
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                rows={4}
                placeholder={safeT('profileEdit.bioPlaceholder')}
                className="dark:bg-stone-900 dark:text-stone-100 dark:border-stone-700 dark:placeholder:text-stone-500"
              />
            </div>

            <div className="flex space-x-4">
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    {safeT('profileEdit.saving')}
                  </>
                ) : (
                  safeT('profileEdit.saveChanges')
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/profile')}
              >
                {safeT('profileEdit.cancel')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 