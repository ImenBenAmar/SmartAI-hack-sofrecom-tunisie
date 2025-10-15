"use client";

import Image from "next/image";
import Link from "next/link";
import { SignInButton, SignOutButton } from "@/components/AuthButtons";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const { status } = useSession();
  const pathname = usePathname();
  
  const isActive = (path: string) => {
    if (path === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(path);
  };
  
  return (
  <header className="navbar navbar-expand-lg navbar-dark bg-dark border-bottom border-1 border-orange" role="banner" data-bs-theme="dark">
      <div className="container-fluid d-flex align-items-end">
        <Link className="navbar-brand d-inline-flex align-items-end gap-2" href="/">
          <Image src="/orange-logo.svg" alt="Orange" width={28} height={28} className="align-baseline" />
          <span className="lh-1 fs-5">SmartMail AI</span>
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#mainNavbar"
          aria-controls="mainNavbar"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon" />
        </button>

          <div className="collapse navbar-collapse d-flex w-100 flex-grow-1" id="mainNavbar">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <Link className={`nav-link${isActive("/") ? " active" : ""}`} aria-current={isActive("/") ? "page" : undefined} href="/">Home</Link>
            </li>
            {status === "authenticated" && (
              <li className="nav-item">
                <Link className={`nav-link${isActive("/inbox") ? " active" : ""}`} aria-current={isActive("/inbox") ? "page" : undefined} href="/inbox">Inbox</Link>
              </li>
            )}
          </ul>

          {/* Right cluster: conditional search + auth */}
          <div className="d-flex align-items-center gap-3 ms-auto">
            {status === "authenticated" && (
              <form role="search" className="d-flex" onSubmit={(e) => e.preventDefault()}>
                <input
                  className="form-control"
                  type="search"
                  placeholder="Search emails"
                  aria-label="Search emails"
                />
              </form>
            )}
            {/* Auth actions */}
            <div className="d-flex align-items-center gap-2">
              <SignInButton />
              <SignOutButton />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
