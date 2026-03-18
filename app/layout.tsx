import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { SplashScreen } from "@/components/SplashScreen";
import { NavBar } from "@/components/NavBar";
import { DraggableAssistantButton } from "@/components/assistant/DraggableAssistantButton";
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
      <NavBar user={user} />
      <main className="page-shell">{children}</main>
      <DraggableAssistantButton />
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
