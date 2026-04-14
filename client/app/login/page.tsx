"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ApiError, loginUser } from "@/lib/api";
import { saveAuthSession } from "@/lib/auth-storage";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Please enter email and password.");
      return;
    }

    try {
      setIsLoading(true);
      const data = await loginUser({
        email: email.trim().toLowerCase(),
        password,
      });

      saveAuthSession(data.accessToken, data.user);
      const nextPath = searchParams.get("next");
      router.push(nextPath || "/");
    } catch (submitError) {
      const message =
        submitError instanceof ApiError ? submitError.message : "Unable to login right now.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="clay-card bg-surface-container-lowest p-10 rounded-xl w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-headline font-black text-on-surface mb-2">Welcome Back</h1>
          <p className="text-on-surface-variant">Sign in to your Tactile account</p>
        </div>

        <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
          <Input
            label="Email Address"
            type="email"
            placeholder="suprabhat@example.com"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
          <Input
            label="Password"
            type="password"
            placeholder="********"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />

          {error ? (
            <p className="text-sm font-semibold text-red-500 bg-red-100/70 px-3 py-2 rounded-lg">{error}</p>
          ) : null}

          <div className="flex justify-end">
            <Link href="#" className="text-sm text-primary font-bold hover:underline">
              Forgot Password?
            </Link>
          </div>

          <Button className="w-full justify-center py-4 mt-4" type="submit" disabled={isLoading}>
            {isLoading ? "Signing In..." : "Sign In"}
          </Button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-on-surface-variant text-sm">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-primary font-bold hover:underline">
              Join the Premiere
            </Link>
          </p>
        </div>

        <div className="mt-10 pt-8 border-t border-surface-container-high text-center">
          <Link
            href="/"
            className="text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center gap-2 text-sm font-medium"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
