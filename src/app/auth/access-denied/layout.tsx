export default function AccessDeniedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      {children}
    </div>
  )
} 