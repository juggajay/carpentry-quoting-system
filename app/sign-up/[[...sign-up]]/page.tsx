import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background-primary">
      <SignUp 
        appearance={{
          elements: {
            formButtonPrimary: 
              "bg-primary-light hover:bg-primary-DEFAULT text-white transition-colors",
            card: "bg-background-card border border-border-default",
            headerTitle: "text-text-primary",
            headerSubtitle: "text-text-secondary",
            socialButtonsBlockButton: 
              "bg-background-secondary border-border-default hover:bg-background-hover text-text-primary transition-colors",
            formFieldLabel: "text-text-secondary",
            formFieldInput: 
              "bg-background-secondary border-border-default text-text-primary focus:border-primary-light focus:ring-primary-light",
            footerActionLink: "text-primary-light hover:text-primary-DEFAULT",
            identityPreviewText: "text-text-secondary",
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