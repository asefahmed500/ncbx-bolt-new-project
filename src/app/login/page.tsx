
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
        email,
        password,
      });

      console.log("[LoginPage] signIn result object:", result); // Log the entire result

      if (result?.error) {
        console.error("[LoginPage] signIn returned an error:", result.error);
        toast({
          title: "Login Failed",
          description: result.error === "CredentialsSignin" ? "Invalid email or password." : `Login error: ${result.error}`,
          variant: "destructive",
        });
      } else if (result?.ok) { 
        console.log("[LoginPage] Login successful, redirecting...");
        toast({
          title: "Login Successful",
          description: "Welcome back!",
        });
        router.push("/"); 
        router.refresh(); 
      } else {
         console.warn("[LoginPage] signIn result was not 'ok' and had no specific error, or result was undefined/null. Result:", result);
         toast({
          title: "Login Attempted",
          description: "Could not determine login status. Please check server logs and try again.",
          variant: "destructive",
        });
      }
    } catch (error: any) { 
      console.error("[LoginPage] CRITICAL: Exception during signIn call or subsequent logic. Error object raw:", error);
       if (error instanceof Error) {
        console.error("[LoginPage] Exception name:", error.name);
        console.error("[LoginPage] Exception message:", error.message);
        console.error("[LoginPage] Exception stack:", error.stack);
      }
      let errorMessage = "An unexpected error occurred during login. Please try again.";
      if (error.message && error.name !== 'TypeError') { // Don't show generic "TypeError: Failed to fetch" to user
        errorMessage = error.message;
      } else if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
        errorMessage = "Failed to connect to the server. Please check your network and try again."
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
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Login
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
