import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4 py-12">
      <div className="clay-card bg-surface-container-lowest p-10 rounded-xl w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-headline font-black text-on-surface mb-2">Join Today</h1>
          <p className="text-on-surface-variant">Create your digital ticket identity</p>
        </div>

        <form className="flex flex-col gap-6">
          <Input 
            label="Full Name" 
            type="text" 
            placeholder="John Doe" 
            id="name"
          />
          <Input 
            label="Email Address" 
            type="email" 
            placeholder="john@example.com" 
            id="email"
          />
          <Input 
            label="Password" 
            type="password" 
            placeholder="••••••••" 
            id="password"
          />
          <Input 
            label="Confirm Password" 
            type="password" 
            placeholder="••••••••" 
            id="confirm-password"
          />

          <Button className="w-full justify-center py-4 mt-4">
            Create Account
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
          <Link href="/" className="text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center gap-2 text-sm font-medium">
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
