import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/sidebar";
import { UserMenu } from "@/components/layout/user-menu";
import { ToastContainer } from "@/components/ui/toast";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-10 px-6 py-3 flex items-center justify-end">
          <UserMenu email={user.email || ""} />
        </header>
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
      <ToastContainer />
    </div>
  );
}
