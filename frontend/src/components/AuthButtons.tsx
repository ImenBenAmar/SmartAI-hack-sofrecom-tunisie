"use client";

import { signIn, signOut, useSession } from "next-auth/react";

export function SignInButton() {
  const { status } = useSession();
  if (status === "authenticated") return null;
  return (
    <button className="btn btn-primary" onClick={() => signIn("google")}>Sign in with Google</button>
  );
}

export function SignOutButton() {
  const { status } = useSession();
  if (status !== "authenticated") return null;
  return (
    <button className="btn btn-outline-secondary" onClick={() => signOut()}>Sign out</button>
  );
}
