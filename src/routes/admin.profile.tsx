import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Upload, KeyRound, User as UserIcon } from "lucide-react";

export const Route = createFileRoute("/admin/profile")({
  component: ProfilePage,
});

type Profile = { display_name: string | null; phone: string | null; avatar_url: string | null };

function ProfilePage() {
  const nav = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState<Profile>({ display_name: "", phone: "", avatar_url: null });
  const [newEmail, setNewEmail] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { nav({ to: "/auth" }); return; }
      setUserId(session.user.id);
      setEmail(session.user.email ?? "");
      setNewEmail(session.user.email ?? "");
      const { data } = await supabase.from("profiles").select("display_name,phone,avatar_url").eq("user_id", session.user.id).maybeSingle();
      if (data) setProfile(data as Profile);
    })();
  }, [nav]);

  const saveProfile = async () => {
    if (!userId) return;
    setBusy(true);
    const { error } = await supabase.from("profiles").upsert(
      { user_id: userId, display_name: profile.display_name, phone: profile.phone, avatar_url: profile.avatar_url },
      { onConflict: "user_id" }
    );
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Profile updated");
  };

  const updateEmail = async () => {
    if (!newEmail || newEmail === email) return;
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Confirmation email sent — check your inbox to confirm the change.");
  };

  const updatePassword = async () => {
    if (newPwd.length < 6) return toast.error("Password must be at least 6 characters");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: newPwd });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Password updated");
    setNewPwd("");
  };

  const uploadAvatar = async (files: FileList | null) => {
    if (!files || !files[0] || !userId) return;
    setUploading(true);
    const file = files[0];
    const path = `${userId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) { setUploading(false); return toast.error(error.message); }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    setProfile((p) => ({ ...p, avatar_url: data.publicUrl }));
    await supabase.from("profiles").upsert({ user_id: userId, avatar_url: data.publicUrl }, { onConflict: "user_id" });
    setUploading(false);
    toast.success("Avatar updated");
  };

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-3xl">Profile & Account</h1>
      <p className="mt-1 text-sm text-muted-foreground">Update your personal info, email, password and profile picture.</p>

      <section className="mt-8 rounded-xl border border-border bg-card p-6">
        <h2 className="flex items-center gap-2 font-display text-xl"><UserIcon className="h-5 w-5 text-gold" /> Profile</h2>
        <div className="mt-4 flex items-center gap-4">
          <div className="relative h-20 w-20 overflow-hidden rounded-full bg-muted">
            {profile.avatar_url
              ? <img src={profile.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
              : <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-muted-foreground">{(profile.display_name || email).slice(0,1).toUpperCase()}</div>}
          </div>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-accent">
            <Upload className="h-4 w-4" /> {uploading ? "Uploading…" : "Change photo"}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => uploadAvatar(e.target.files)} />
          </label>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs text-muted-foreground">Display name</label>
            <Input value={profile.display_name ?? ""} onChange={(e) => setProfile({ ...profile, display_name: e.target.value })} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Phone</label>
            <Input value={profile.phone ?? ""} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
          </div>
        </div>
        <Button className="mt-4" onClick={saveProfile} disabled={busy}>Save profile</Button>
      </section>

      <section className="mt-6 rounded-xl border border-border bg-card p-6">
        <h2 className="flex items-center gap-2 font-display text-xl">Email address</h2>
        <p className="mt-1 text-sm text-muted-foreground">Current: {email}</p>
        <div className="mt-3 flex gap-2">
          <Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
          <Button onClick={updateEmail} disabled={busy}>Update email</Button>
        </div>
      </section>

      <section className="mt-6 rounded-xl border border-border bg-card p-6">
        <h2 className="flex items-center gap-2 font-display text-xl"><KeyRound className="h-5 w-5 text-gold" /> Change password</h2>
        <div className="mt-3 flex gap-2">
          <Input type="password" placeholder="New password (min 6 chars)" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} />
          <Button onClick={updatePassword} disabled={busy}>Update password</Button>
        </div>
      </section>
    </div>
  );
}
