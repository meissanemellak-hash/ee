import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <main
      className="min-h-screen bg-muted/25 flex items-center justify-center p-6"
      role="main"
      aria-label="Inscription"
    >
      <div className="w-full max-w-md">
        <SignUp routing="hash" />
      </div>
    </main>
  )
}
