'use client';

import { getAuthService } from '@/lib/auth/auth-service';
import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';
import { handleError, handleSuccess } from '@/lib/error-handler';
import { Loader2, Lock, Unlock, Crown, Settings, Edit2, Calendar, User, Heart } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import { useTranslations } from '@/hooks/use-translations';

interface Download {
  id: string;
  created_at: string;
  resource: {
    id: string;
    title: string;
    image_url: string;
  };
}

interface UserProfile {
  id: string;
  name: string;
  avatar_url: string;
  role: string;
  bio: string;
  created_at: string;
  subscription_type: 'free' | 'premium';
  liked_resources?: Array<{
    id: string;
    title: string;
    description: string;
    thumbnail_url: string;
  }>;
  liked_products?: Array<{
    id: string;
    name: string;
    description: string;
    thumb: string;
  }>;
  downloads?: Download[];
}

export default function ProfilePage() {
  const { user, loading: userLoading } = useAuth();
  const { t } = useTranslations();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [cpf, setCpf] = useState('');
  const authService = getAuthService();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Add safeT function for translation
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

  // Atualizar o CPF quando o usuário for carregado
  useEffect(() => {
    if (user?.user_metadata?.cpf) {
      setCpf(user.user_metadata.cpf);
    }
  }, [user]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (userLoading) return;
      
      try {
        setLoading(true);
        
        if (!user?.id) {
          console.error('User not found');
          authService.redirectToAuthPage(router, '/profile', 'user_not_found');
          return;
        }
        
        // Get or create user profile using AuthService
        let existingProfile = await authService.getUserProfile(user.id);

        // If no profile exists, create one
        if (!existingProfile) {
          const newProfile = {
            id: user.id,
            name: user.email?.split('@')[0] || 'User',
            role: 'user',
            bio: '',
            avatar_url: '',
            created_at: new Date().toISOString(),
            subscription_type: 'free'
          };

          existingProfile = await authService.saveUserProfile(newProfile);
        }

        // Fetch recent downloads, liked resources, and liked products in parallel
        const [downloads, likedResources, likedProducts] = await Promise.all([
          authService.getRecentDownloads(user.id, 5),
          authService.getUserLikedResources(user.id),
          authService.getUserLikedProducts(user.id)
        ]);

        setProfile({
          ...existingProfile,
          downloads: downloads || [],
          liked_resources: likedResources || [],
          liked_products: likedProducts || []
        });
      } catch (error) {
        console.error('Profile error:', error);
        const { error: errorMessage } = handleError(error);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router, authService, user, userLoading]);

  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
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
      if (profile.avatar_url) {
        const oldPath = profile.avatar_url.split('/').pop();
        if (oldPath) {
          await authService.removeFile('avatar', `${profile.id}/${oldPath}`);
        }
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}-${Date.now()}.${fileExt}`;
      const filePath = `${profile.id}/${fileName}`;

      // Upload the new avatar
      const publicUrl = await authService.uploadFile('avatar', filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      // Update profile with new avatar URL
      const updatedProfile = await authService.saveUserProfile({
        ...profile,
        avatar_url: publicUrl
      });

      setProfile(updatedProfile);
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

  if (userLoading) {
    return <div className="container mx-auto px-4 py-8 max-w-6xl"><Loader2 className="h-8 w-8 animate-spin mx-auto" /></div>;
  }

  if (!user) {
    // Redirect to login if not authenticated
    useEffect(() => {
      router.push('/login?redirect=/profile');
    }, [router]);
    return null;
  }

  // Show force logout button on auth/session errors
  if (error && (error.includes('Auth session missing') || error.includes('AuthApiError'))) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <p className="text-destructive text-center mb-4">{error}</p>
            <Button
              onClick={() => {
                localStorage.clear();
                sessionStorage.clear();
                // Attempt to clear cookies (best effort)
                document.cookie.split(';').forEach(function(c) {
                  document.cookie = c.replace(/^ +/, '').replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
                });
                router.push('/login?redirect=/profile');
              }}
              variant="destructive"
            >
              Fazer login novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="bg-card border-0 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-semibold">{safeT('profile.profileInfo')}</CardTitle>
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
              <CardTitle className="text-xl font-semibold">{safeT('profile.accountSettings')}</CardTitle>
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
              {safeT('profile.tryAgain')}
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
      {profile?.role === 'admin' && (
        <Button
          variant="default"
          className="mb-4 flex items-center gap-2"
          onClick={() => router.push('/admin')}
        >
          <Crown className="h-4 w-4" />
          Painel Admin
        </Button>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Profile Section */}
        <Card className="bg-card border-0 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold">{safeT('profile.profileInfo')}</CardTitle>
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
                    <span className="text-white text-sm font-medium flex items-center justify-center">{safeT('profile.clickToChange')}</span>
                  </div>
                  <input
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
                  {safeT('profile.bio')}
                </h3>
                <p className="text-muted-foreground">{profile.bio || safeT('profile.noBio')}</p>
              </div>

              {/* Member Since Section */}
              <div className="space-y-2">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {safeT('profile.memberSince')}
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
                  {safeT('profile.subscription.title')}
                </h3>
                <div className="flex flex-col gap-2">
                  <p className="text-muted-foreground">
                    {safeT('profile.currentPlan')}: <span className="font-medium text-foreground capitalize">{profile.subscription_type}</span>
                  </p>
                  {profile.subscription_type === 'free' && (
                    <Button 
                      onClick={() => router.push('/price')}
                      variant="default"
                      size="sm"
                      className="w-fit"
                    >
                      <Crown className="h-4 w-4 mr-2" />
                      {safeT('profile.upgradeToPremium')}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Settings Section */}
        <Card className="bg-card border-0 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <Settings className="h-5 w-5" />
              {safeT('profile.accountSettings')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button 
                onClick={() => router.push('/profile/edit')}
                className="w-full justify-start h-12 px-4"
                variant="outline"
              >
                <Edit2 className="h-4 w-4 mr-2" />
                {safeT('profile.editProfile')}
              </Button>

              <Button 
                onClick={() => router.push('/profile/subscription')}
                className="w-full justify-start h-12 px-4"
                variant="outline"
              >
                <Crown className="h-4 w-4 mr-2" />
                {safeT('profile.manageSubscription')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Liked Resources Section */}
        <Card className="bg-card border-0 shadow-sm md:col-span-2">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
              {safeT('profile.likedResources.title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {profile.liked_resources && profile.liked_resources.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {profile.liked_resources.map((resource) => (
                  <Card key={resource.id} className="overflow-hidden hover:shadow-md transition-shadow">
                    <div className="aspect-video relative">
                      <img
                        src={resource.thumbnail_url}
                        alt={resource.title}
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-lg mb-2">{resource.title}</h3>
                      <p className="text-muted-foreground text-sm line-clamp-2">{resource.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">{safeT('profile.noLikedResources')}</p>
                <Button
                  onClick={() => router.push('/resources')}
                  variant="outline"
                  className="mt-4"
                >
                  {safeT('profile.browseResources')}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Liked Products Section */}
        <Card className="bg-card border-0 shadow-sm md:col-span-2">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <Heart className="h-5 w-5" />
              {safeT('profile.likedProducts.title') || 'Liked Products'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {profile.liked_products && profile.liked_products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {profile.liked_products.map((product) => (
                  <Card key={product.id} className="overflow-hidden hover:shadow-md transition-shadow">
                    <div className="aspect-video relative">
                      <img
                        src={product.thumb}
                        alt={product.name}
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
                      <p className="text-muted-foreground text-sm line-clamp-2">{product.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">{safeT('profile.noLikedProducts') || 'No liked products yet.'}</p>
                <Button
                  onClick={() => router.push('/shop')}
                  variant="outline"
                  className="mt-4"
                >
                  {safeT('profile.browseProducts') || 'Browse Products'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Downloads Section */}
        <Card className="bg-card border-0 shadow-sm col-span-full">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold">
              {safeT('profile.recentDownloads')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {profile.downloads && profile.downloads.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {profile.downloads.map((download) => (
                  <div
                    key={download.id}
                    className="group relative overflow-hidden rounded-lg border bg-card transition-colors hover:bg-accent"
                  >
                    <div className="aspect-square overflow-hidden">
                      <img
                        src={download.resource.image_url}
                        alt={download.resource.title}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-medium leading-none truncate">
                        {download.resource.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-2">
                        {new Date(download.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {safeT('profile.noDownloads')}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 