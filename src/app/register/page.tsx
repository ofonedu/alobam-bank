
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { AppLogo } from "@/components/layout/AppLogo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import type { RegisterFormData } from "@/lib/schemas";
import { useToast } from "@/hooks/use-toast";


export default function RegisterPage() {
  const router = useRouter();
  const { signUp } = useAuth();
  const { toast } = useToast();

  const handleRegister = async (values: RegisterFormData) => {
    try {
      await signUp(values);
      toast({ title: "Registration Successful", description: "Your account has been created." });
      router.push("/dashboard");
    } catch (error: any) {
      let errorMessage = "Registration failed. Please try again.";
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = "This email is already registered. Please try logging in.";
      }
      // console.error("Registration error:", error); // Already handled by RegisterForm or useAuth
      toast({
        title: "Registration Failed",
        description: errorMessage,
        variant: "destructive",
      });
      throw new Error(errorMessage);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="mb-8">
        <AppLogo />
      </div>
      <Card className="w-full max-w-lg shadow-xl"> {/* Increased max-width for more fields */}
        <CardHeader>
          <CardTitle className="text-2xl">Create Account</CardTitle>
          <CardDescription>Join VerifAI to manage your finances securely.</CardDescription>
        </CardHeader>
        <CardContent>
          <RegisterForm onSubmit={handleRegister} />
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
