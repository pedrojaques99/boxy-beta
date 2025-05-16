import { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { OAuthErrorDisplay } from '@/components/auth/oauth-error'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Erro de Autenticação | Boxy',
  description: 'Ocorreu um erro durante o processo de autenticação',
}

export default function AuthErrorPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const error = searchParams.error as string || 'unknown'
  
  return (
    <div className="container flex items-center justify-center min-h-[80vh]">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="text-center">Erro de Autenticação</CardTitle>
        </CardHeader>
        <CardContent>
          <OAuthErrorDisplay />
          
          <div className="mt-4 text-center text-sm text-muted-foreground">
            <p>
              Você pode{' '}
              <Link
                href="/auth/login"
                className="underline underline-offset-4 hover:text-primary"
              >
                tentar fazer login novamente
              </Link>{' '}
              ou voltar para a{' '}
              <Link
                href="/"
                className="underline underline-offset-4 hover:text-primary"
              >
                página inicial
              </Link>
              .
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center gap-2">
          <Button asChild variant="outline">
            <Link href="/auth/login">Login</Link>
          </Button>
          <Button asChild variant="default">
            <Link href="/">Página Inicial</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
