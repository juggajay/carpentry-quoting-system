import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <SignUp 
        appearance={{
          elements: {
            formButtonPrimary: 
              "bg-primary-light hover:bg-primary text-white transition-colors",
            card: "bg-background-card border border-border-default",
            headerTitle: "text-foreground",
            headerSubtitle: "text-muted-foreground",
            socialButtonsBlockButton: 
              "bg-background-secondary border-border-default hover:bg-background-hover text-foreground transition-colors",
            formFieldLabel: "text-muted-foreground",
            formFieldInput: 
              "bg-background-secondary border-border-default text-foreground focus:border-primary-light",
            footerActionLink: "text-primary-light hover:text-primary-DEFAULT",
            identityPreviewText: "text-muted-foreground",
            identityPreviewEditButtonIcon: "text-primary-light",
          },
          variables: {
            colorPrimary: "#9333EA",
            colorBackground: "#18181B",
            colorText: "#FAFAFA",
            colorInputBackground: "#0F0F0F",
            colorInputText: "#FAFAFA",
            borderRadius: "0.5rem",
          },
        }}
      />
    </div>
  );
}