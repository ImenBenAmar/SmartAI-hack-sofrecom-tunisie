"use client";

import { useSession } from "next-auth/react";
import { SignInButton, SignOutButton } from "@/components/AuthButtons";

export default function Home() {
  const { data: session, status } = useSession();

  return (
    <>
      <section className="mb-4 p-4 p-lg-5 bg-light rounded-3">
        <div className="container-fluid py-2">
          <h1 className="display-5 fw-bold">SmartMail AI</h1>
          <p className="col-md-8 fs-5">
            Your AI-powered assistant for Gmail. Summarize, triage, and act—faster.
          </p>
          {status !== "authenticated" ? (
            <SignInButton />
          ) : (
            <div className="d-flex align-items-center gap-2">
              <span>Signed in as <strong>{session?.user?.email}</strong></span>
              <SignOutButton />
            </div>
          )}
        </div>
      </section>

      <div className="row">
        <div className="col-12 col-lg-8">
          <div className="card mb-3">
            <div className="card-body">
              <h5 className="card-title">Why SmartMail AI?</h5>
              <ul className="mb-0">
                <li>Summarize long threads with one click.</li>
                <li>Auto-label and prioritize based on context.</li>
                <li>Compose replies with smart prompts.</li>
              </ul>
            </div>
          </div>
        </div>
        <div className="col-12 col-lg-4">
          <div className="alert alert-info" role="alert">
            Cross-platform ready: Web and Desktop (Electron).
          </div>
        </div>
      </div>
    </>
  );
}
