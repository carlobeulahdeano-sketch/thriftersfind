"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { User, Mail, Save, Shield, AlertTriangle } from "lucide-react";
import { updateProfile } from "./actions";
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

interface ProfileFormProps {
    user: {
        name: string;
        email: string;
    };
}

export function ProfileForm({ user }: ProfileFormProps) {
    const { toast } = useToast();

    const [displayName, setDisplayName] = useState(user.name);
    const [email, setEmail] = useState(user.email);
    const [isLoading, setIsLoading] = useState(false);

    const handleSaveChanges = async () => {
        setIsLoading(true);
        const formData = new FormData();
        formData.append("displayName", displayName);
        formData.append("email", email);

        try {
            const result = await updateProfile(formData) as any;

            if (result.error) {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: result.error,
                });
            } else {
                toast({
                    title: "Success",
                    description: "Profile updated successfully.",
                });
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "An unexpected error occurred.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="border-0 shadow-xl shadow-pink-500/10 bg-white/80 backdrop-blur-sm overflow-hidden">
            {/* Decorative gradient bar */}
            <div className="h-1.5 bg-gradient-to-r from-cyan-500 via-pink-500 to-cyan-500" />

            <CardHeader className="space-y-3 pb-6">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-pink-100 flex items-center justify-center">
                        <Shield className="w-4 h-4 text-pink-600" />
                    </div>
                    <CardTitle className="text-2xl">Personal Information</CardTitle>
                </div>
                <CardDescription className="text-base">
                    Update your display name and email address to keep your profile current.
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-8 pb-8">
                {/* Display Name Field */}
                <div className="space-y-3 group">
                    <Label
                        htmlFor="displayName"
                        className="text-sm font-semibold flex items-center gap-2 text-slate-700"
                    >
                        <User className="w-4 h-4 text-pink-500" />
                        Display Name
                    </Label>
                    <Input
                        id="displayName"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Enter your display name"
                        className="h-12 border-2 border-slate-200 focus:border-pink-400 focus:ring-pink-400/20 transition-all duration-200 hover:border-slate-300"
                    />
                </div>

                {/* Email Field */}
                <div className="space-y-3 group">
                    <Label
                        htmlFor="email"
                        className="text-sm font-semibold flex items-center gap-2 text-slate-700"
                    >
                        <Mail className="w-4 h-4 text-cyan-500" />
                        Email Address
                    </Label>
                    <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your.email@example.com"
                        className="h-12 border-2 border-slate-200 focus:border-cyan-400 focus:ring-cyan-400/20 transition-all duration-200 hover:border-slate-300"
                    />
                </div>

                {/* Info Banner */}
                <div className="bg-gradient-to-r from-cyan-50 to-pink-50 border-l-4 border-pink-400 p-4 rounded-r-lg">
                    <p className="text-sm text-slate-700">
                        <span className="font-semibold">Privacy Note:</span> Your information is securely stored and never shared with third parties.
                    </p>
                </div>

                {/* Warning Banner */}
                <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border-l-4 border-orange-400 p-4 rounded-r-lg">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5" />
                        <div>
                            <p className="text-sm font-semibold text-slate-800">Warning</p>
                            <p className="text-sm text-slate-700">
                                Changing your personal information will affect your data across the application.
                            </p>
                        </div>
                    </div>
                </div>
            </CardContent>

            <CardFooter className="border-t bg-slate-50/50 px-6 py-5 flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center">
                <p className="text-sm text-muted-foreground">
                    Last updated: Never
                </p>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button
                            className="bg-gradient-to-r from-pink-600 to-pink-700 hover:from-pink-700 hover:to-pink-800 text-white shadow-lg shadow-pink-500/30 h-11 px-8 font-semibold transition-all duration-200 hover:shadow-xl hover:shadow-pink-500/40 hover:scale-105"
                            disabled={isLoading}
                        >
                            <Save className="w-4 h-4 mr-2" />
                            {isLoading ? "Saving..." : "Save Changes"}
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Are you sure you want to change your personal information? This action will update your profile data.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleSaveChanges} className="bg-pink-600 hover:bg-pink-700">
                                Confirm Change
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </CardFooter>
        </Card>
    );
}
