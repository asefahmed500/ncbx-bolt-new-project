
"use client";

import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react"; 
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    console.log("[LoginPage] Attempting login for email:", email);

    try {
      const result = await signIn("credentials", {
        redirect: false, 
        email: email.trim(), 
        password,
      });

      console.log("[LoginPage] signIn result object:", JSON.stringify(result, null, 2));

      if (result?.error) {
        console.error("[LoginPage] signIn returned an error:", result.error);
        let errorMessage = "Invalid email or password."; 
        if (result.error !== "CredentialsSignin") {
            errorMessage = `Login error: ${result.error}. Check server logs for details.`;
        }
        toast({
          title: "Login Failed",
          description: errorMessage,
          variant: "destructive",
        });
      } else if (result?.ok) { 
        console.log("[LoginPage] Login successful, redirecting to dashboard...");
        toast({
          title: "Login Successful",
          description: "Welcome back!",
        });
        router.push("/dashboard"); 
        router.refresh(); 
      } else {
         console.warn("[LoginPage] signIn result was not 'ok' and had no specific error, or result was undefined/null. Result:", JSON.stringify(result, null, 2));
         toast({
          title: "Login Attempted",
          description: "Could not determine login status. Please check server logs and try again.",
          variant: "destructive",
        });
      }
    } catch (error: any) { 
      console.error("[LoginPage] CRITICAL: Exception during signIn call or subsequent logic.");
      console.error("[LoginPage] Error object raw:", error);
      let errorMessage = "An unexpected error occurred during login. Please try again.";
      if (error instanceof Error) {
        console.error("[LoginPage] Exception name:", error.name);
        console.error("[LoginPage] Exception message:", error.message);
        console.error("[LoginPage] Exception stack:", error.stack);
        
        if (error.name === 'TypeError' && typeof error.message === 'string' && error.message.toLowerCase().includes('failed to fetch')) {
            errorMessage = "Failed to connect to the authentication server. Please check your internet connection and ensure the server is running (see server logs).";
        } else if (typeof error.message === 'string' && error.message.includes('emitWarning is not a function')) {
             errorMessage = "Login failed due to a server-side issue. Please contact support (Ref: Mongoose/emitWarning).";
             console.error("[LoginPage] Detected 'emitWarning' issue: This typically indicates a Mongoose bundling problem on the server, where its browser build might be incorrectly used server-side.");
        } else if (typeof error.message === 'string' && error.name !== 'TypeError') {
           errorMessage = error.message;
        }
      }
      
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/30 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-headline">Login</CardTitle>
          <CardDescription>Enter your credentials to access your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="bg-input text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="bg-input text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Login"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="text-center text-sm">
          <p className="text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-medium text-primary hover:underline">
              Register
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
