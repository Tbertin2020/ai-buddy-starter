import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Lock, Mail, Phone, User, Landmark, Loader2 } from "lucide-react";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form states
  const [names, setNames] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        // Sign Up
        const response = await fetch("http://localhost/rwandadb-api/register.php", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ names, email, phone, password }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to register account.");
        }

        toast.success("Account created successfully! Please sign in.");
        setIsSignUp(false);
        setPassword("");
      } else {
        // Sign In
        const response = await fetch("http://localhost/rwandadb-api/login.php", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Invalid email or password.");
        }

        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        toast.success(`Welcome back, ${data.user.names}!`);
        navigate({ to: "/" });
      }
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b0f19] px-4 relative overflow-hidden">
      {/* Background ambient lighting blobs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-blue-500/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[350px] h-[350px] rounded-full bg-indigo-500/10 blur-[100px] pointer-events-none" />

      <Card className="w-full max-w-md border-[#1f293d] bg-[#111827]/80 backdrop-blur-xl shadow-2xl relative">
        <CardHeader className="space-y-2 text-center pb-8 border-b border-[#1f293d]">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10 text-blue-400 mb-2">
            <Landmark className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-white">
            Rwanda Statistics Explorer
          </CardTitle>
          <CardDescription className="text-gray-400">
            {isSignUp
              ? "Create your research account to get started"
              : "Authentication required to access national statistics"}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 pt-6">
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="names" className="text-gray-300">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                  <Input
                    id="names"
                    placeholder="John Doe"
                    type="text"
                    required
                    value={names}
                    onChange={(e) => setNames(e.target.value)}
                    className="pl-10 bg-[#1f293d]/50 border-[#1f293d] text-white placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                <Input
                  id="email"
                  placeholder="name@example.com"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-[#1f293d]/50 border-[#1f293d] text-white placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-gray-300">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                  <Input
                    id="phone"
                    placeholder="+250 788 000 000"
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-10 bg-[#1f293d]/50 border-[#1f293d] text-white placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-gray-300">Password</Label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                <Input
                  id="password"
                  placeholder="••••••••"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 bg-[#1f293d]/50 border-[#1f293d] text-white placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 rounded-md transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : isSignUp ? (
                "Create Account"
              ) : (
                "Sign In"
              )}
            </Button>
            <div className="text-sm text-center text-gray-400">
              {isSignUp ? (
                <>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUp(false);
                      toast.info("Switched to Sign In mode");
                    }}
                    className="text-blue-400 hover:underline hover:text-blue-300 font-semibold"
                  >
                    Sign In
                  </button>
                </>
              ) : (
                <>
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUp(true);
                      toast.info("Switched to Register mode");
                    }}
                    className="text-blue-400 hover:underline hover:text-blue-300 font-semibold"
                  >
                    Create Account
                  </button>
                </>
              )}
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
