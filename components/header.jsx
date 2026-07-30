import React from "react";
import { Button } from "./ui/button";
import { PenBox, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { checkUser } from "@/lib/checkUser";
import Image from "next/image";

const Header = async () => {
  await checkUser();

  return (
    <header className="fixed top-0 w-full bg-[#0B0B0C]/85 backdrop-blur-md z-50 border-b border-[#2A2A2D]">
      <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/">
          <Image
            src={"/Screenshot 2026-07-29 220347.png"}
            alt="PennyPal Logo"
            width={200}
            height={60}
            className="h-12 w-auto object-contain"
          />
        </Link>

        <div className="hidden md:flex items-center space-x-8">
          <SignedOut>
            <a
              href="#features"
              className="text-[#F3E7B3]/70 hover:text-[#D4AF37]"
            >
              Features
            </a>
            <a
              href="#testimonials"
              className="text-[#F3E7B3]/70 hover:text-[#D4AF37]"
            >
              Testimonials
            </a>
          </SignedOut>
        </div>

        <div className="flex items-center space-x-4">
          <SignedIn>
            <Link
              href="/dashboard"
              className="text-[#F3E7B3]/70 hover:text-[#D4AF37] flex items-center gap-2"
            >
              <Button
                variant="outline"
                className="border-[#D4AF37]/40 bg-transparent text-[#F3E7B3] hover:bg-[#D4AF37]/10"
              >
                <LayoutDashboard size={18} />
                <span className="hidden md:inline">Dashboard</span>
              </Button>
            </Link>
            <a href="/transaction/create">
              <Button className="flex items-center gap-2 bg-[#D4AF37] text-[#0B0B0C] hover:bg-[#F3E7B3]">
                <PenBox size={18} />
                <span className="hidden md:inline">Add Transaction</span>
              </Button>
            </a>
          </SignedIn>
          <SignedOut>
            <SignInButton forceRedirectUrl="/dashboard">
              <Button
                variant="outline"
                className="border-[#D4AF37]/40 bg-transparent text-[#F3E7B3] hover:bg-[#D4AF37]/10"
              >
                Login
              </Button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-10 h-10",
                },
              }}
            />
          </SignedIn>
        </div>
      </nav>
    </header>
  );
};

export default Header;
