import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Layout } from "@/components/site/Layout";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { LogOut, User as UserIcon, Calendar, Mail } from "lucide-react";

export const Route = createFileRoute("/account")({
  component: Account,
  head: () => ({ meta: [{ title: "My Account — MLG Autohaus" }] }),
});

type Profile = { display_name: string | null; phone: string | null };
type TestDrive = { id: string; preferred_date: string; status: string; created_at: string; vehicle_id: string | null };
type Enquiry = { id: string; message: string; status: string; created_at: string; vehicle_id: string | null };

function Account() {
  const nav = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState<Profile>({ display_name: "", phone: "" });
  const [newPwd, setNewPwd] = useState("");
  const [busy, setBusy] = useState(false);
  const [testDrives, setTestDrives] = useState<TestDrive[]>([]);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { nav({ to: "/auth" }); return; }
      setUserId(session.user.id);
      setEmail(session.user.email ?? "");

      const { data: p } = await supabase.from("profiles").select("display_name,phone").eq("user_id", session.user.id).maybeSingle();
      if (p) setProfile(p as Profile);

      const userEmail = session.user.email ?? "";
      const [{ data: td }, { data: en }] = await Promise.all([
        supabase.from("test_drives").select("id,preferred_date,status,created_at,vehicle_id").eq("email", userEmail).order("created_at", { ascending: false }),
        supabase.from("enquiries").select("id,message,status,created_at,vehicle_id").eq("email", userEmail).order("created_at", { ascending: false }),
      ]);
      setTestDrives((td as TestDrive[]) || []);
      setEnquiries((en as Enquiry[]) || []);
    })();
  }, [nav]);

  const saveProfile = async () => {
    if (!userId) return;
    setBusy(true);
    const { error } = await supabase.from("profiles").upsert(
      { user_id: userId, display_name: profile.display_name, phone: profile.phone },
      { onConflict: "user_id" }
    );
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Profile updated");
  };

  const changePassword = async () => {
    if (newPwd.length < 6) return toast.error("Password must be at least 6 characters");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: newPwd });
    setBusy(false);
    if (error) return toast.error(error.message);
    setNewPwd("");
    toast.success("Password updated");
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    nav({ to: "/" });
  };

  return (
    <Layout>
      <section className="bg-primary py-12 text-primary-foreground">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="text-xs uppercase tracking-[0.2em] text-gold">Welcome back</div>
          <h1 className="mt-2 font-display text-3xl sm:text-4xl">My Account</h1>
          <p className="mt-2 text-primary-foreground/75">{email}</p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <Tabs defaultValue="profile">
          <TabsList className="grid w-full grid-cols-3 sm:w-auto">
            <TabsTrigger value="profile"><UserIcon className="mr-2 h-4 w-4" />Profile</TabsTrigger>
            <TabsTrigger value="test-drives"><Calendar className="mr-2 h-4 w-4" />Test Drives</TabsTrigger>
            <TabsTrigger value="enquiries"><Mail className="mr-2 h-4 w-4" />Enquiries</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-6 space-y-6">
            <div className="rounded-xl border border-border bg-card p-6 shadow-card">
              <h2 className="font-display text-xl">Personal details</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">Full name</label>
                  <Input value={profile.display_name ?? ""} onChange={(e) => setProfile({ ...profile, display_name: e.target.value })} />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">Phone</label>
                  <Input value={profile.phone ?? ""} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs text-muted-foreground">Email</label>
                  <Input value={email} disabled />
                </div>
              </div>
              <div className="mt-4">
                <Button onClick={saveProfile} disabled={busy}>Save profile</Button>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 shadow-card">
              <h2 className="font-display text-xl">Change password</h2>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <Input type="password" placeholder="New password (min 6 chars)" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} />
                <Button onClick={changePassword} disabled={busy || !newPwd}>Update password</Button>
              </div>
            </div>

            <Button variant="outline" onClick={signOut}><LogOut className="mr-2 h-4 w-4" />Sign out</Button>
          </TabsContent>

          <TabsContent value="test-drives" className="mt-6">
            <div className="rounded-xl border border-border bg-card p-6 shadow-card">
              <h2 className="font-display text-xl">My test drive bookings</h2>
              {testDrives.length === 0 ? (
                <p className="mt-4 text-sm text-muted-foreground">
                  You haven't booked any test drives yet. <Link to="/catalogue" className="text-gold underline">Browse vehicles</Link>.
                </p>
              ) : (
                <div className="mt-4 divide-y divide-border">
                  {testDrives.map((t) => (
                    <div key={t.id} className="flex items-center justify-between py-3">
                      <div>
                        <div className="font-medium">{new Date(t.preferred_date).toLocaleDateString()}</div>
                        <div className="text-xs text-muted-foreground">Booked {new Date(t.created_at).toLocaleDateString()}</div>
                      </div>
                      <span className="rounded bg-muted px-2 py-1 text-xs uppercase tracking-wider">{t.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="enquiries" className="mt-6">
            <div className="rounded-xl border border-border bg-card p-6 shadow-card">
              <h2 className="font-display text-xl">My enquiries</h2>
              {enquiries.length === 0 ? (
                <p className="mt-4 text-sm text-muted-foreground">
                  No enquiries yet. <Link to="/contact" className="text-gold underline">Get in touch</Link>.
                </p>
              ) : (
                <div className="mt-4 divide-y divide-border">
                  {enquiries.map((e) => (
                    <div key={e.id} className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-muted-foreground">{new Date(e.created_at).toLocaleDateString()}</div>
                        <span className="rounded bg-muted px-2 py-1 text-xs uppercase tracking-wider">{e.status}</span>
                      </div>
                      <p className="mt-2 text-sm text-foreground/80">{e.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </section>
    </Layout>
  );
}
