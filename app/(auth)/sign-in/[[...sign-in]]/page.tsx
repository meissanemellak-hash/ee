import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <main
      className="min-h-screen bg-muted/25 flex items-center justify-center p-6"
      role="main"
      aria-label="Connexion"
    >
      <div className="w-full max-w-md sign-in-footer-single-line">
        <SignIn
          routing="hash"
          signUpUrl="/demo"
          fallbackRedirectUrl="/dashboard"
          localization={{
            signIn: {
              start: {
                actionLink: 'Demander une démo',
              },
            },
          }}
        />
      </div>
    </main>
  )
}
