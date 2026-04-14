"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ApiError, registerUser } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      setError("Please fill all fields.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Password and confirm password do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    try {
      setIsLoading(true);
      await registerUser({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      });

      setSuccessMessage("Account created successfully. Redirecting to login...");
      setTimeout(() => {
        router.push("/login");
      }, 1000);
    } catch (submitError) {
      const message =
        submitError instanceof ApiError ? submitError.message : "Unable to create account right now.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4 py-12">
      <div className="clay-card bg-surface-container-lowest p-10 rounded-xl w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-headline font-black text-on-surface mb-2">Join Today</h1>
          <p className="text-on-surface-variant">Create your digital ticket identity</p>
        </div>

        <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
          <Input
            label="Full Name"
            type="text"
            placeholder="John Doe"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            required
          />
          <Input
            label="Email Address"
            type="email"
            placeholder="john@example.com"
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
            autoComplete="new-password"
            required
          />
          <Input
            label="Confirm Password"
            type="password"
            placeholder="********"
            id="confirm-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            required
          />

          {error ? <p className="text-sm font-semibold text-red-500 bg-red-100/70 px-3 py-2 rounded-lg">{error}</p> : null}
          {successMessage ? (
            <p className="text-sm font-semibold text-green-700 bg-green-100/80 px-3 py-2 rounded-lg">{successMessage}</p>
          ) : null}

          <Button className="w-full justify-center py-4 mt-4" type="submit" disabled={isLoading}>
            {isLoading ? "Creating Account..." : "Create Account"}
          </Button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-on-surface-variant text-sm">
            Already a member?{" "}
            <Link href="/login" className="text-primary font-bold hover:underline">
              Sign In
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
