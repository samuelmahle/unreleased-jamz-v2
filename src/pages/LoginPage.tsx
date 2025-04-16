import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, sendVerificationEmail } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(email, password);
      toast.success("Logged in successfully!");
      navigate("/");
    } catch (error: any) {
      console.error("Login error:", error);
      if (error.code === 'auth/email-not-verified') {
        toast.error("Please verify your email before logging in", {
          description: "Check your inbox for the verification link",
          action: {
            label: "Resend",
            onClick: async () => {
              try {
                await sendVerificationEmail(error.user);
                toast.success("Verification email sent!");
              } catch (err: any) {
                toast.error(err.message || "Failed to send verification email");
              }
            }
          }
        });
      } else {
        toast.error(error.message || "Failed to login");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Sign in to your Setlisted account</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-white">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-gray-800 border-gray-700 text-white"
              placeholder="Enter your email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-white">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-gray-800 border-gray-700 text-white"
              placeholder="Enter your password"
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-music hover:bg-music-accent text-white"
            disabled={isLoading}
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>

          <p className="text-center text-sm text-gray-400">
            Don't have an account?{" "}
            <a href="/register" className="text-music hover:text-music-accent">
              Sign up
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}
