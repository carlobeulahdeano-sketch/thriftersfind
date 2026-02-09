import { getCurrentUser } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import { User } from "lucide-react";
import { ProfileForm } from "./profile-form";

export default async function ProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-pink-50/30 to-cyan-50/30">
      <div className="max-w-4xl mx-auto p-6 md:p-8 lg:p-12">
        {/* Header Section */}
        <div className="mb-8 md:mb-12">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-cyan-500 flex items-center justify-center shadow-lg">
              <User className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-cyan-600 via-pink-600 to-cyan-600 bg-clip-text text-transparent">
              Profile
            </h1>
          </div>
          <p className="text-muted-foreground text-lg ml-15">
            Manage your account settings and preferences.
          </p>
        </div>

        {/* Main Card */}
        <ProfileForm user={{ name: user.name, email: user.email }} />
      </div>
    </div>
  );
}