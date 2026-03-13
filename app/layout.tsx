import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { SplashScreen } from "@/components/SplashScreen";
import { AppNav } from "@/components/AppNav";
import { getSessionUser } from "@/lib/session";
import { clerkPublishableKey, hasClerkKeys } from "@/lib/clerk-config";

export const metadata: Metadata = {
  title: "ShopNet",
  description: "An ecommerce web app for shopping, selling, chat, and smart checkout."
};

export default async function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  const user = await getSessionUser();
  const shell = (
    <>
      <SplashScreen />
      <AppNav user={user ? { name: user.name } : null} />
      <main className="page-shell">{children}</main>
    </>
  );

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        {hasClerkKeys ? (
          <ClerkProvider publishableKey={clerkPublishableKey}>{shell}</ClerkProvider>
        ) : (
          shell
        )}
      </body>
    </html>
  );
}
