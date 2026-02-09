"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Settings2, Lock, Eye, EyeOff, Shield, Key, Bell, Palette, Smartphone, Loader2, AlertTriangle } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { updatePassword } from "./actions";
import { useTransition } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";


export default function SettingsPage() {
  const user = null;
  const isUserLoading = false;
  const { toast } = useToast();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    sms: false,
  });

  const [isPending, startTransition] = useTransition();

  const handlePasswordChange = () => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("newPassword", newPassword);
      formData.append("confirmPassword", confirmPassword);

      const result = await updatePassword(formData);

      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
          variant: "default",
        });
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error,
        });
      }
    });
  };

  const passwordStrength = (password: string) => {
    if (password.length === 0) return { strength: 0, label: "", color: "" };
    if (password.length < 6) return { strength: 25, label: "Weak", color: "bg-red-500" };
    if (password.length < 10) return { strength: 50, label: "Fair", color: "bg-orange-500" };
    if (password.length < 14) return { strength: 75, label: "Good", color: "bg-yellow-500" };
    return { strength: 100, label: "Strong", color: "bg-green-500" };
  };

  const strength = passwordStrength(newPassword);
  const passwordsMatch = newPassword && confirmPassword && newPassword === confirmPassword;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30">
      <div className="max-w-5xl mx-auto p-6 md:p-8 lg:p-12">
        {/* Header Section */}
        <div className="mb-8 md:mb-12">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-lg">
              <Settings2 className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
              Settings
            </h1>
          </div>
          <p className="text-muted-foreground text-lg ml-15">
            Manage your account security and application preferences.
          </p>
        </div>

        <div className="space-y-6">
          {/* Security Card */}
          <Card className="border-0 shadow-xl shadow-purple-500/10 bg-white/80 backdrop-blur-sm overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-purple-500 via-blue-500 to-purple-500" />

            <CardHeader className="space-y-3 pb-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Lock className="w-4 h-4 text-purple-600" />
                </div>
                <CardTitle className="text-2xl">Account Security</CardTitle>
              </div>
              <CardDescription className="text-base">
                Update your password to keep your account secure. Use a strong, unique password.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6 pb-8">
              {/* New Password Field */}
              <div className="space-y-3 group">
                <Label
                  htmlFor="new-password"
                  className="text-sm font-semibold flex items-center gap-2 text-slate-700"
                >
                  <Key className="w-4 h-4 text-purple-500" />
                  New Password
                </Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                    placeholder="Enter your new password"
                    className="h-12 border-2 border-slate-200 focus:border-purple-400 focus:ring-purple-400/20 transition-all duration-200 hover:border-slate-300 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {newPassword && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Password Strength:</span>
                      <span className={`font-semibold ${strength.strength === 100 ? 'text-green-600' :
                        strength.strength === 75 ? 'text-yellow-600' :
                          strength.strength === 50 ? 'text-orange-600' : 'text-red-600'
                        }`}>
                        {strength.label}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${strength.color} transition-all duration-300`}
                        style={{ width: `${strength.strength}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-3 group">
                <Label
                  htmlFor="confirm-password"
                  className="text-sm font-semibold flex items-center gap-2 text-slate-700"
                >
                  <Shield className="w-4 h-4 text-blue-500" />
                  Confirm New Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    placeholder="Confirm your new password"
                    className="h-12 border-2 border-slate-200 focus:border-blue-400 focus:ring-blue-400/20 transition-all duration-200 hover:border-slate-300 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                {/* Password Match Indicator */}
                {confirmPassword && (
                  <div className="flex items-center gap-2 text-sm">
                    {passwordsMatch ? (
                      <>
                        <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="text-green-600 font-medium">Passwords match</span>
                      </>
                    ) : (
                      <>
                        <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </div>
                        <span className="text-red-600 font-medium">Passwords do not match</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Security Tips */}
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-l-4 border-purple-400 p-4 rounded-r-lg">
                <p className="text-sm font-semibold text-slate-700 mb-2">Password Tips:</p>
                <ul className="text-sm text-slate-600 space-y-1 ml-4 list-disc">
                  <li>Use at least 12 characters</li>
                  <li>Include numbers, symbols, and mixed case letters</li>
                  <li>Avoid common words or personal information</li>
                </ul>
              </div>

              {/* Warning Banner */}
              <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border-l-4 border-orange-400 p-4 rounded-r-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Warning</p>
                    <p className="text-sm text-slate-700">
                      Changing your password will require you to log in again on all devices.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>

            <CardFooter className="border-t bg-slate-50/50 px-6 py-5 flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center">
              <p className="text-sm text-muted-foreground">
                Last password change: Never
              </p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg shadow-purple-500/30 h-11 px-8 font-semibold transition-all duration-200 hover:shadow-xl hover:shadow-purple-500/40 hover:scale-105"
                    disabled={!passwordsMatch || strength.strength < 50 || isPending}
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4 mr-2" />
                        Update Password
                      </>
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to change your password? You will be required to log in again with your new password.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handlePasswordChange} className="bg-purple-600 hover:bg-purple-700">
                      Confirm Change
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}