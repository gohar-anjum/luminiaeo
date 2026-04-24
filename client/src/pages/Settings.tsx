import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiClient, ApiError } from "@/lib/api/client";
import { ContentAreaLoader } from "@/components/ContentAreaLoader";

export default function Settings() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();

  const [form, setForm] = useState({
    name: "",
    email: "",
    current_password: "",
    password: "",
    password_confirmation: "",
  });

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        name: user.name || "",
        email: user.email || "",
      }));
    }
  }, [user]);

  const handleSave = async () => {
    // ===== VALIDATION LAYER =====

    if (form.name && form.name.length < 3) {
      return toast({
        title: "Validation Error",
        description: "Name must be at least 3 characters",
        variant: "destructive",
      });
    }

    if (
        form.email &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
    ) {
      return toast({
        title: "Validation Error",
        description: "Invalid email format",
        variant: "destructive",
      });
    }

    const isPasswordFlow =
        form.current_password ||
        form.password ||
        form.password_confirmation;

    if (isPasswordFlow) {
      if (!form.current_password || !form.password || !form.password_confirmation) {
        return toast({
          title: "Error",
          description: "All password fields are required",
          variant: "destructive",
        });
      }

      if (form.password !== form.password_confirmation) {
        return toast({
          title: "Error",
          description: "Passwords do not match",
          variant: "destructive",
        });
      }

      if (form.password.length < 8) {
        return toast({
          title: "Error",
          description: "Password must be at least 8 characters",
          variant: "destructive",
        });
      }
    }

    // ===== REQUEST CONSTRUCTION =====

    const request: any = {};

    if (form.name !== user?.name) request.name = form.name;
    if (form.email !== user?.email) request.email = form.email;

    if (isPasswordFlow) {
      request.current_password = form.current_password;
      request.password = form.password;
      request.password_confirmation = form.password_confirmation;
    }

    if (Object.keys(request).length === 0) {
      return toast({
        title: "No Changes",
        description: "Nothing to update",
      });
    }

    // ===== API CALL =====

    setIsSaving(true);

    try {
      await apiClient.updateProfile(request);

      if (refreshUser) await refreshUser();

      toast({
        title: "Success",
        description: "Settings updated successfully",
      });

      // Reset password fields only
      setForm((prev) => ({
        ...prev,
        current_password: "",
        password: "",
        password_confirmation: "",
      }));
    } catch (error: any) {
      console.error(error);

      const message =
          error instanceof ApiError
              ? error.message
              : error.response?.message ||
              error.message ||
              "Update failed";

      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
      <div className="p-8">
        <Card>
          <CardHeader>
            <CardTitle>Account Settings</CardTitle>
            <CardDescription>
              Manage your profile and security settings
            </CardDescription>
          </CardHeader>

          <CardContent>
            <ContentAreaLoader
                loading={isSaving}
                phase="Saving changes..."
                minHeightClassName="min-h-[300px]"
            >
              <div className="space-y-6">
                {/* Profile */}
                <h3 className="text-lg font-medium">Profile</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input
                        value={form.name}
                        onChange={(e) =>
                            setForm({ ...form, name: e.target.value })
                        }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                        type="email"
                        value={form.email}
                        onChange={(e) =>
                            setForm({ ...form, email: e.target.value })
                        }
                    />
                  </div>
                </div>
                <h3 className="text-lg font-medium">Change Password</h3>

                {/* Security */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  <div className="space-y-2">
                    <Label>Current Password</Label>
                    <Input
                        type="password"
                        value={form.current_password}
                        onChange={(e) =>
                            setForm({
                              ...form,
                              current_password: e.target.value,
                            })
                        }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>New Password</Label>
                    <Input
                        type="password"
                        value={form.password}
                        onChange={(e) =>
                            setForm({ ...form, password: e.target.value })
                        }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Confirm Password</Label>
                    <Input
                        type="password"
                        value={form.password_confirmation}
                        onChange={(e) =>
                            setForm({
                              ...form,
                              password_confirmation: e.target.value,
                            })
                        }
                    />
                  </div>
                </div>

                <Button onClick={handleSave} disabled={isSaving}>
                  Save Settings
                </Button>
              </div>
            </ContentAreaLoader>
          </CardContent>
        </Card>
      </div>
  );
}