
"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { registerUser } from "@/actions/auth"; // Server action
import { Loader2 } from "lucide-react";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    console.log("[RegisterPage] Attempting registration for:", email);

    const formData = new FormData(event.currentTarget);
    // Optional: Log formData entries if debugging
    // for (let [key, value] of formData.entries()) {
    //   console.log(`[RegisterPage] FormData: ${key}: ${value}`);
    // }

    const result = await registerUser(formData);
    console.log("[RegisterPage] registerUser action result:", result);

    setIsLoading(false);

    if (result.error) {
      let description = result.error;
      // If 'details' (field-specific errors from Zod) exists, use that for a more specific message.
      if (result.details && typeof result.details === 'object' && Object.keys(result.details).length > 0) {
        // Concatenate all field error messages
        description = Object.values(result.details).flat().join(" ");
      }
      toast({
        title: "Registration Failed",
        description: description || "An unknown error occurred.",
        variant: "destructive",
      });
    } else if (result.success) {
      toast({
        title: "Registration Successful",
        description: "You can now log in.",
      });
      router.push("/login");
    } else {
      // Fallback for unexpected result structure
      toast({
        title: "Registration Attempted",
        description: "An unexpected response was received from the server.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/30 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-headline">Create Account</CardTitle>
          <CardDescription>Sign up to start building your websites.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name" // Name attribute is crucial for FormData
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your Name"
                required
                className="bg-input text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email" // Name attribute is crucial for FormData
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
                name="password" // Name attribute is crucial for FormData
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="•••••••• (min. 6 characters)"
                required
                className="bg-input text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Create Account"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="text-center text-sm">
          <p className="text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Login
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
