import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function Page({ searchParams }: { searchParams: { error: string } }) {
  const error = searchParams?.error

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Card className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-foreground">Authentication Error</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md bg-destructive/10 p-3">
              <p className="text-sm text-destructive">
                {error ? (
                  <>
                    <span className="font-medium">Error code:</span> {error}
                  </>
                ) : (
                  'An unspecified error occurred during authentication.'
                )}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-sm text-muted-foreground">
                Please try signing in again or contact support if the problem persists.
              </p>
              <div className="flex justify-center gap-2">
                <Link href="/auth/login">
                  <Button variant="outline" className="w-full">
                    Back to Login
                  </Button>
                </Link>
                <Link href="/">
                  <Button variant="ghost" className="w-full">
                    Go Home
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
