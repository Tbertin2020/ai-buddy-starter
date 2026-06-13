import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";
import { 
  Users, 
  Map as MapIcon, 
  Database, 
  Hash, 
  Plus, 
  Edit, 
  Trash2, 
  ShieldAlert, 
  Activity, 
  Filter, 
  Search,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  MapPin,
  FileSpreadsheet
} from "lucide-react";

export const Route = createFileRoute("/admin")({
  component: AdminPanel,
});

type User = {
  id: number;
  names: string;
  email: string;
  phone: string;
  role: string;
  created_at: string;
};

type District = {
  id: string;
  name: string;
  province: string;
  lat: number;
  lng: number;
  created_at?: string;
};

type Indicator = {
  id: string;
  key: string;
  name: string;
  unit: string;
  category: string;
  created_at?: string;
};

type DataNumber = {
  id: string;
  district_id: string;
  district_name: string;
  indicator_id: string;
  indicator_name: string;
  year: number;
  value: number;
  created_at?: string;
};

const API_BASE_URL = "http://localhost/rwandadb-api";

function getHeaders() {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { "Authorization": `Bearer ${token}` } : {}),
  };
}

function AdminPanel() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"dashboard" | "users" | "districts" | "indicators" | "numbers">("dashboard");

  // Authentication validation
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (!token || !userStr) {
      toast.error("Access denied. Please log in first.");
      navigate({ to: "/login" });
      return;
    }
    const user = JSON.parse(userStr);
    setCurrentUser(user);
    if (user.role !== "admin") {
      setIsAdmin(false);
      setCheckingAuth(false);
    } else {
      setIsAdmin(true);
      setCheckingAuth(false);
    }
  }, [navigate]);

  // General statistics query
  const statsQuery = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/admin_stats.php`, { headers: getHeaders() });
      if (!res.ok) throw new Error("Failed to fetch admin statistics");
      return res.json();
    },
    enabled: isAdmin,
  });

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b0f19] text-white">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto" />
          <p className="text-sm text-gray-400">Verifying administrator credentials...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b0f19] text-white px-4">
        <Card className="max-w-md border-[#ef4444]/30 bg-[#111827]/80 backdrop-blur shadow-2xl text-center p-8 space-y-4">
          <div className="h-12 w-12 rounded-full bg-[#ef4444]/10 text-[#ef4444] flex items-center justify-center mx-auto">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold text-white">Access Denied</h2>
          <p className="text-gray-400 text-sm">
            This module is restricted to system administrators. Your account ({currentUser?.names}) is registered as a "{currentUser?.role}".
          </p>
          <Button onClick={() => navigate({ to: "/" })} className="w-full bg-blue-600 hover:bg-blue-500 text-white">
            Return to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6 text-foreground">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-border pb-4 gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Admin Control Panel</h2>
            <p className="text-muted-foreground text-sm">
              Manage system users, districts profiles, statistical indicators, and data entries.
            </p>
          </div>
          <div className="flex bg-muted rounded-md p-1 self-start md:self-auto overflow-x-auto max-w-full">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
                activeTab === "dashboard" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
                activeTab === "users" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Users
            </button>
            <button
              onClick={() => setActiveTab("districts")}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
                activeTab === "districts" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Districts
            </button>
            <button
              onClick={() => setActiveTab("indicators")}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
                activeTab === "indicators" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Indicators
            </button>
            <button
              onClick={() => setActiveTab("numbers")}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
                activeTab === "numbers" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Data Values
            </button>
          </div>
        </div>

        {/* Tab Contents */}
        {activeTab === "dashboard" && <OverviewTab stats={statsQuery.data} loading={statsQuery.isLoading} />}
        {activeTab === "users" && <UsersTab currentAdminId={currentUser.id} />}
        {activeTab === "districts" && <DistrictsTab />}
        {activeTab === "indicators" && <IndicatorsTab />}
        {activeTab === "numbers" && <NumbersTab />}
      </div>
    </AppShell>
  );
}

// -------------------------------------------------------------
// OVERVIEW TAB
// -------------------------------------------------------------
function OverviewTab({ stats, loading }: { stats: any; loading: boolean }) {
  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">Loading dashboard overview stats...</div>;
  }

  const counts = stats?.counts || { users: 0, researchers: 0, admins: 0, districts: 0, indicators: 0, records: 0 };
  const recentUsers: User[] = stats?.recentUsers || [];
  const recentUpdates: any[] = stats?.recentUpdates || [];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={Users} label="Total Users" value={counts.users} sub={`${counts.researchers} Researchers · ${counts.admins} Admins`} />
        <KpiCard icon={MapIcon} label="Districts Tracked" value={counts.districts} sub="Across 5 Provinces" />
        <KpiCard icon={Database} label="Indicators" value={counts.indicators} sub="Demographics, Health, Economy..." />
        <KpiCard icon={Hash} label="Data Records" value={counts.records} sub="Yearly numerical values" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Registered Users */}
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <Activity className="w-4 h-4 text-blue-500" />
            <div>
              <CardTitle className="text-base">Recent Registered Users</CardTitle>
              <CardDescription className="text-xs">Newly created researcher and admin accounts</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border text-sm">
              {recentUsers.length === 0 ? (
                <p className="text-muted-foreground text-center py-6">No users found.</p>
              ) : (
                recentUsers.map((u) => (
                  <div key={u.id} className="py-3 flex justify-between items-center gap-2">
                    <div className="truncate">
                      <p className="font-semibold text-foreground truncate">{u.names}</p>
                      <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                    </div>
                    <div className="text-right whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        u.role === "admin" ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                      }`}>
                        {u.role}
                      </span>
                      <p className="text-[10px] text-muted-foreground mt-1">{new Date(u.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Data Updates */}
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <div>
              <CardTitle className="text-base">Recent Statistics Updates</CardTitle>
              <CardDescription className="text-xs">Latest district indicator values modified</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border text-sm">
              {recentUpdates.length === 0 ? (
                <p className="text-muted-foreground text-center py-6">No updates found.</p>
              ) : (
                recentUpdates.map((ru) => (
                  <div key={ru.id} className="py-3 flex justify-between items-center gap-2">
                    <div className="truncate">
                      <p className="font-semibold text-foreground truncate">{ru.district_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{ru.indicator_name} ({ru.year})</p>
                    </div>
                    <div className="text-right whitespace-nowrap">
                      <p className="font-bold text-foreground">{ru.value.toLocaleString()}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{new Date(ru.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, sub }: { icon: any; label: string; value: number; sub: string }) {
  return (
    <Card className="border-border bg-card">
      <CardContent className="pt-6">
        <div className="flex justify-between items-start">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
          <div className="p-2 rounded bg-muted text-muted-foreground">
            <Icon className="w-4 h-4" />
          </div>
        </div>
        <p className="text-3xl font-bold mt-2 text-foreground">{value.toLocaleString()}</p>
        <p className="text-xs text-muted-foreground mt-2">{sub}</p>
      </CardContent>
    </Card>
  );
}

// -------------------------------------------------------------
// USERS MANAGEMENT TAB
// -------------------------------------------------------------
function UsersTab({ currentAdminId }: { currentAdminId: number }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form states
  const [names, setNames] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("researcher");

  // Query
  const usersQuery = useQuery<User[]>({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/admin_users.php`, { headers: getHeaders() });
      if (!res.ok) throw new Error("Failed to load users list");
      return res.json();
    }
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`${API_BASE_URL}/admin_users.php`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to create user");
      return resData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast.success("User created successfully");
      closeModal();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`${API_BASE_URL}/admin_users.php`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to update user");
      return resData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast.success("User updated successfully");
      closeModal();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`${API_BASE_URL}/admin_users.php?id=${id}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to delete user");
      return resData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast.success("User deleted successfully");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const closeModal = () => {
    setIsOpen(false);
    setEditingUser(null);
    setNames("");
    setEmail("");
    setPhone("");
    setPassword("");
    setRole("researcher");
  };

  const handleEdit = (u: User) => {
    setEditingUser(u);
    setNames(u.names);
    setEmail(u.email);
    setPhone(u.phone);
    setRole(u.role);
    setPassword(""); // Keep blank unless resetting
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      updateMutation.mutate({ id: editingUser.id, names, email, phone, role, password });
    } else {
      createMutation.mutate({ names, email, phone, password, role });
    }
  };

  const handleDelete = (id: number, names: string) => {
    if (id === currentAdminId) {
      toast.error("You cannot delete your own admin account.");
      return;
    }
    if (confirm(`Are you sure you want to delete user "${names}"? This cannot be undone.`)) {
      deleteMutation.mutate(id);
    }
  };

  const filtered = usersQuery.data?.filter(
    (u) =>
      u.names.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.phone.includes(search),
  ) || [];

  return (
    <Card className="border-border bg-card">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 gap-4">
        <div>
          <CardTitle className="text-lg">Manage Accounts</CardTitle>
          <CardDescription className="text-xs">Create, edit, or remove researcher and admin accounts.</CardDescription>
        </div>
        <div className="flex gap-2">
          <div className="relative max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 text-xs bg-muted border-border"
            />
          </div>
          <Button onClick={() => setIsOpen(true)} className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> Add User
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {usersQuery.isLoading ? (
          <div className="text-center py-12 text-muted-foreground text-sm">Loading users list...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-xs font-medium">
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Created Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground">
                      No users match your query.
                    </td>
                  </tr>
                ) : (
                  filtered.map((u) => (
                    <tr key={u.id} className="hover:bg-accent/40 text-foreground transition-colors">
                      <td className="py-3.5 px-4 font-semibold">{u.names}</td>
                      <td className="py-3.5 px-4 text-muted-foreground">{u.email}</td>
                      <td className="py-3.5 px-4 text-muted-foreground">{u.phone}</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          u.role === "admin" ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
                      <td className="py-3.5 px-4 text-right space-x-1.5">
                        <button
                          onClick={() => handleEdit(u)}
                          className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors inline-flex"
                          title="Edit"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(u.id, u.names)}
                          disabled={u.id === currentAdminId}
                          className="p-1.5 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-400 disabled:opacity-30 disabled:pointer-events-none transition-colors inline-flex"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>

      {/* Add/Edit Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md bg-card border-border shadow-2xl">
            <CardHeader>
              <CardTitle className="text-lg">{editingUser ? "Edit User Details" : "Create User Account"}</CardTitle>
              <CardDescription className="text-xs">
                {editingUser ? "Update profile settings. Fill password only to reset." : "Fill details to add a new account."}
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="usr-names" className="text-xs">Full Name</Label>
                  <Input id="usr-names" value={names} onChange={(e) => setNames(e.target.value)} required placeholder="Jane Doe" className="text-xs bg-muted" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="usr-email" className="text-xs">Email Address</Label>
                  <Input id="usr-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="jane@example.com" className="text-xs bg-muted" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="usr-phone" className="text-xs">Phone Number</Label>
                  <Input id="usr-phone" value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="+250 788 123 456" className="text-xs bg-muted" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="usr-pass" className="text-xs">{editingUser ? "New Password (Optional)" : "Password"}</Label>
                  <Input id="usr-pass" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required={!editingUser} placeholder={editingUser ? "Leave blank to keep current" : "••••••••"} className="text-xs bg-muted" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="usr-role" className="text-xs">Access Role</Label>
                  <select
                    id="usr-role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full rounded-md border border-input bg-muted px-3 py-2 text-xs focus-visible:outline-none text-foreground"
                  >
                    <option value="researcher">researcher (Read-Only access)</option>
                    <option value="admin">admin (Full CRUD access)</option>
                  </select>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2 border-t border-border pt-4">
                <Button type="button" onClick={closeModal} className="bg-transparent border border-border text-foreground hover:bg-muted text-xs">
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold">
                  {createMutation.isPending || updateMutation.isPending ? "Saving..." : "Save Account"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      )}
    </Card>
  );
}

// -------------------------------------------------------------
// DISTRICTS MANAGEMENT TAB
// -------------------------------------------------------------
function DistrictsTab() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [editingDistrict, setEditingDistrict] = useState<District | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [province, setProvince] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");

  // Query
  const districtsQuery = useQuery<District[]>({
    queryKey: ["admin-districts"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/admin_districts.php`, { headers: getHeaders() });
      if (!res.ok) throw new Error("Failed to load districts list");
      return res.json();
    }
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`${API_BASE_URL}/admin_districts.php`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to create district");
      return resData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-districts"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast.success("District created successfully");
      closeModal();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`${API_BASE_URL}/admin_districts.php`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to update district");
      return resData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-districts"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast.success("District updated successfully");
      closeModal();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_BASE_URL}/admin_districts.php?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to delete district");
      return resData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-districts"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast.success("District deleted successfully");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const closeModal = () => {
    setIsOpen(false);
    setEditingDistrict(null);
    setName("");
    setProvince("");
    setLat("");
    setLng("");
  };

  const handleEdit = (d: District) => {
    setEditingDistrict(d);
    setName(d.name);
    setProvince(d.province);
    setLat(String(d.lat));
    setLng(String(d.lng));
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = { name, province, lat: parseFloat(lat), lng: parseFloat(lng) };
    if (editingDistrict) {
      updateMutation.mutate({ id: editingDistrict.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete district "${name}"? All numerical data records associated with this district will also be deleted.`)) {
      deleteMutation.mutate(id);
    }
  };

  const filtered = districtsQuery.data?.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.province.toLowerCase().includes(search.toLowerCase()),
  ) || [];

  return (
    <Card className="border-border bg-card">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 gap-4">
        <div>
          <CardTitle className="text-lg">Manage Districts</CardTitle>
          <CardDescription className="text-xs font-medium text-muted-foreground">Add, update, or remove Rwandan geographic districts.</CardDescription>
        </div>
        <div className="flex gap-2">
          <div className="relative max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search districts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 text-xs bg-muted border-border"
            />
          </div>
          <Button onClick={() => setIsOpen(true)} className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> Add District
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {districtsQuery.isLoading ? (
          <div className="text-center py-12 text-muted-foreground text-sm">Loading districts list...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-xs font-medium">
                  <th className="py-3 px-4">District Name</th>
                  <th className="py-3 px-4">Province</th>
                  <th className="py-3 px-4">Latitude</th>
                  <th className="py-3 px-4">Longitude</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground">
                      No districts match your query.
                    </td>
                  </tr>
                ) : (
                  filtered.map((d) => (
                    <tr key={d.id} className="hover:bg-accent/40 text-foreground transition-colors">
                      <td className="py-3.5 px-4 font-semibold flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-blue-500" />
                        {d.name}
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground">{d.province}</td>
                      <td className="py-3.5 px-4 text-muted-foreground font-mono text-xs">{d.lat.toFixed(4)}</td>
                      <td className="py-3.5 px-4 text-muted-foreground font-mono text-xs">{d.lng.toFixed(4)}</td>
                      <td className="py-3.5 px-4 text-right space-x-1.5">
                        <button
                          onClick={() => handleEdit(d)}
                          className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors inline-flex"
                          title="Edit"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(d.id, d.name)}
                          className="p-1.5 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors inline-flex"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>

      {/* Add/Edit Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md bg-card border-border shadow-2xl">
            <CardHeader>
              <CardTitle className="text-lg">{editingDistrict ? "Edit District Profile" : "Add Geographic District"}</CardTitle>
              <CardDescription className="text-xs">
                Set geographic boundary coordinates and province layer.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="dst-name" className="text-xs">District Name</Label>
                  <Input id="dst-name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Nyarugenge" className="text-xs bg-muted" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="dst-province" className="text-xs">Province</Label>
                  <select
                    id="dst-province"
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    required
                    className="w-full rounded-md border border-input bg-muted px-3 py-2 text-xs focus-visible:outline-none text-foreground"
                  >
                    <option value="">-- Select Province --</option>
                    <option value="Kigali">Kigali</option>
                    <option value="Eastern">Eastern</option>
                    <option value="Northern">Northern</option>
                    <option value="Western">Western</option>
                    <option value="Southern">Southern</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="dst-lat" className="text-xs">Latitude</Label>
                    <Input id="dst-lat" type="number" step="any" value={lat} onChange={(e) => setLat(e.target.value)} required placeholder="e.g. -1.9536" className="text-xs bg-muted" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="dst-lng" className="text-xs">Longitude</Label>
                    <Input id="dst-lng" type="number" step="any" value={lng} onChange={(e) => setLng(e.target.value)} required placeholder="e.g. 30.0606" className="text-xs bg-muted" />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2 border-t border-border pt-4">
                <Button type="button" onClick={closeModal} className="bg-transparent border border-border text-foreground hover:bg-muted text-xs">
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold">
                  {createMutation.isPending || updateMutation.isPending ? "Saving..." : "Save District"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      )}
    </Card>
  );
}

// -------------------------------------------------------------
// INDICATORS MANAGEMENT TAB
// -------------------------------------------------------------
function IndicatorsTab() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [editingIndicator, setEditingIndicator] = useState<Indicator | null>(null);

  // Form states
  const [key, setKey] = useState("");
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("");
  const [category, setCategory] = useState("");

  // Query
  const indicatorsQuery = useQuery<Indicator[]>({
    queryKey: ["admin-indicators"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/admin_indicators.php`, { headers: getHeaders() });
      if (!res.ok) throw new Error("Failed to load indicators list");
      return res.json();
    }
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`${API_BASE_URL}/admin_indicators.php`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to create indicator");
      return resData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-indicators"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast.success("Indicator created successfully");
      closeModal();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`${API_BASE_URL}/admin_indicators.php`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to update indicator");
      return resData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-indicators"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast.success("Indicator updated successfully");
      closeModal();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_BASE_URL}/admin_indicators.php?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to delete indicator");
      return resData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-indicators"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast.success("Indicator deleted successfully");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const closeModal = () => {
    setIsOpen(false);
    setEditingIndicator(null);
    setKey("");
    setName("");
    setUnit("");
    setCategory("");
  };

  const handleEdit = (ind: Indicator) => {
    setEditingIndicator(ind);
    setKey(ind.key);
    setName(ind.name);
    setUnit(ind.unit);
    setCategory(ind.category);
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = { key, name, unit, category };
    if (editingIndicator) {
      updateMutation.mutate({ id: editingIndicator.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete indicator "${name}"? This deletes all statistical records for all districts referencing this indicator.`)) {
      deleteMutation.mutate(id);
    }
  };

  const filtered = indicatorsQuery.data?.filter(
    (i) =>
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.key.toLowerCase().includes(search.toLowerCase()) ||
      i.category.toLowerCase().includes(search.toLowerCase()),
  ) || [];

  return (
    <Card className="border-border bg-card">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 gap-4">
        <div>
          <CardTitle className="text-lg">Manage Indicators</CardTitle>
          <CardDescription className="text-xs font-medium text-muted-foreground">Add, update, or remove statistical data keys and units.</CardDescription>
        </div>
        <div className="flex gap-2">
          <div className="relative max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search indicators..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 text-xs bg-muted border-border"
            />
          </div>
          <Button onClick={() => setIsOpen(true)} className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> Add Indicator
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {indicatorsQuery.isLoading ? (
          <div className="text-center py-12 text-muted-foreground text-sm">Loading indicators list...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-xs font-medium">
                  <th className="py-3 px-4">Indicator Name</th>
                  <th className="py-3 px-4">Technical Key</th>
                  <th className="py-3 px-4">Unit</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground">
                      No indicators match your query.
                    </td>
                  </tr>
                ) : (
                  filtered.map((ind) => (
                    <tr key={ind.id} className="hover:bg-accent/40 text-foreground transition-colors">
                      <td className="py-3.5 px-4 font-semibold">{ind.name}</td>
                      <td className="py-3.5 px-4 text-muted-foreground font-mono text-xs">{ind.key}</td>
                      <td className="py-3.5 px-4 text-muted-foreground font-mono text-xs">{ind.unit}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded bg-muted text-[10px] text-muted-foreground font-semibold">
                          {ind.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1.5">
                        <button
                          onClick={() => handleEdit(ind)}
                          className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors inline-flex"
                          title="Edit"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(ind.id, ind.name)}
                          className="p-1.5 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors inline-flex"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>

      {/* Add/Edit Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md bg-card border-border shadow-2xl">
            <CardHeader>
              <CardTitle className="text-lg">{editingIndicator ? "Edit Indicator Definition" : "Add Indicator Type"}</CardTitle>
              <CardDescription className="text-xs">
                Set categorization and mapping codes for statistical data feeds.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="ind-name" className="text-xs">Indicator Display Name</Label>
                  <Input id="ind-name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. GDP per capita" className="text-xs bg-muted" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="ind-key" className="text-xs">Unique Technical Key</Label>
                  <Input id="ind-key" value={key} onChange={(e) => setKey(e.target.value)} required placeholder="e.g. gdp_per_capita" className="text-xs bg-muted font-mono" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="ind-unit" className="text-xs">Value Unit</Label>
                    <Input id="ind-unit" value={unit} onChange={(e) => setUnit(e.target.value)} required placeholder="e.g. USD or % or thousands" className="text-xs bg-muted" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="ind-cat" className="text-xs">Category Group</Label>
                    <select
                      id="ind-cat"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      required
                      className="w-full rounded-md border border-input bg-muted px-3 py-2 text-xs focus-visible:outline-none text-foreground"
                    >
                      <option value="">-- Choose Category --</option>
                      <option value="Demographics">Demographics</option>
                      <option value="Economy">Economy</option>
                      <option value="Health">Health</option>
                      <option value="Education">Education</option>
                    </select>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2 border-t border-border pt-4">
                <Button type="button" onClick={closeModal} className="bg-transparent border border-border text-foreground hover:bg-muted text-xs">
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold">
                  {createMutation.isPending || updateMutation.isPending ? "Saving..." : "Save Indicator"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      )}
    </Card>
  );
}

// -------------------------------------------------------------
// NUMBERS MANAGEMENT TAB (DISTRICT INDICATOR VALUES)
// -------------------------------------------------------------
function NumbersTab() {
  const queryClient = useQueryClient();
  const [districtFilter, setDistrictFilter] = useState("");
  const [indicatorFilter, setIndicatorFilter] = useState("");
  const [searchVal, setSearchVal] = useState("");
  const [offset, setOffset] = useState(0);
  const limit = 20;

  const [isOpen, setIsOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<DataNumber | null>(null);

  // Form states
  const [districtId, setDistrictId] = useState("");
  const [indicatorId, setIndicatorId] = useState("");
  const [year, setYear] = useState("");
  const [value, setValue] = useState("");

  // Queries for select dropdowns
  const districtsQuery = useQuery<District[]>({
    queryKey: ["admin-numbers-districts-select"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/admin_districts.php`, { headers: getHeaders() });
      return res.json();
    }
  });

  const indicatorsQuery = useQuery<Indicator[]>({
    queryKey: ["admin-numbers-indicators-select"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/admin_indicators.php`, { headers: getHeaders() });
      return res.json();
    }
  });

  // Core Numbers Query
  const numbersQuery = useQuery({
    queryKey: ["admin-numbers", districtFilter, indicatorFilter, searchVal, limit, offset],
    queryFn: async () => {
      const params = new URLSearchParams({
        district_id: districtFilter,
        indicator_id: indicatorFilter,
        search: searchVal,
        limit: String(limit),
        offset: String(offset)
      });
      const res = await fetch(`${API_BASE_URL}/admin_numbers.php?${params.toString()}`, { headers: getHeaders() });
      if (!res.ok) throw new Error("Failed to load numerical stats");
      return res.json() as Promise<{ data: DataNumber[]; total: number }>;
    }
  });

  // Reset pagination on filter change
  useEffect(() => {
    setOffset(0);
  }, [districtFilter, indicatorFilter, searchVal]);

  // Mutations
  const createUpdateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`${API_BASE_URL}/admin_numbers.php`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to save record");
      return resData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-numbers"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast.success("Statistical value saved successfully");
      closeModal();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateDirectMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`${API_BASE_URL}/admin_numbers.php`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to update record");
      return resData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-numbers"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast.success("Statistical record updated successfully");
      closeModal();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_BASE_URL}/admin_numbers.php?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to delete record");
      return resData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-numbers"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast.success("Statistical record deleted");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const closeModal = () => {
    setIsOpen(false);
    setEditingRecord(null);
    setDistrictId("");
    setIndicatorId("");
    setYear("");
    setValue("");
  };

  const handleEdit = (num: DataNumber) => {
    setEditingRecord(num);
    setDistrictId(num.district_id);
    setIndicatorId(num.indicator_id);
    setYear(String(num.year));
    setValue(String(num.value));
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      district_id: districtId,
      indicator_id: indicatorId,
      year: parseInt(year),
      value: parseFloat(value)
    };

    if (editingRecord) {
      updateDirectMutation.mutate({ id: editingRecord.id, ...data });
    } else {
      createUpdateMutation.mutate(data);
    }
  };

  const handleDelete = (id: string, distName: string, indName: string, year: number) => {
    if (confirm(`Delete record for ${distName} - ${indName} (${year})?`)) {
      deleteMutation.mutate(id);
    }
  };

  const tableData = numbersQuery.data?.data || [];
  const totalRecords = numbersQuery.data?.total || 0;

  return (
    <Card className="border-border bg-card">
      <CardHeader className="flex flex-col gap-4 pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <CardTitle className="text-lg">Manage Statistical Numbers</CardTitle>
            <CardDescription className="text-xs">Create, update, or remove statistical data entries for each district.</CardDescription>
          </div>
          <Button onClick={() => setIsOpen(true)} className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 self-start sm:self-auto">
            <Plus className="w-4 h-4" /> Add Data Entry
          </Button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 bg-muted p-3 rounded-md border border-border">
          <div>
            <Label className="text-[10px] text-muted-foreground flex items-center gap-1"><Filter className="w-3 h-3" /> Filter District</Label>
            <select
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value)}
              className="mt-1 w-full rounded border border-border bg-background px-2.5 py-1 text-xs text-foreground focus-visible:outline-none"
            >
              <option value="">All Districts</option>
              {districtsQuery.data?.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <div>
            <Label className="text-[10px] text-muted-foreground flex items-center gap-1"><Filter className="w-3 h-3" /> Filter Indicator</Label>
            <select
              value={indicatorFilter}
              onChange={(e) => setIndicatorFilter(e.target.value)}
              className="mt-1 w-full rounded border border-border bg-background px-2.5 py-1 text-xs text-foreground focus-visible:outline-none"
            >
              <option value="">All Indicators</option>
              {indicatorsQuery.data?.map((i) => (
                <option key={i.id} value={i.id}>{i.name}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <Label className="text-[10px] text-muted-foreground flex items-center gap-1"><Search className="w-3 h-3" /> Search Year/Value/Keyword</Label>
            <Input
              placeholder="e.g. 2024 or Kigali..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              className="mt-1 h-8 text-xs bg-background border-border"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {numbersQuery.isLoading ? (
          <div className="text-center py-12 text-muted-foreground text-sm">Loading statistical records...</div>
        ) : (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border text-muted-foreground text-xs font-medium">
                    <th className="py-3 px-4">District</th>
                    <th className="py-3 px-4">Indicator</th>
                    <th className="py-3 px-4 font-mono text-center">Year</th>
                    <th className="py-3 px-4 text-right">Value</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {tableData.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-muted-foreground">
                        No records match your query filters.
                      </td>
                    </tr>
                  ) : (
                    tableData.map((ru) => (
                      <tr key={ru.id} className="hover:bg-accent/40 text-foreground transition-colors">
                        <td className="py-2.5 px-4 font-semibold">{ru.district_name}</td>
                        <td className="py-2.5 px-4 text-muted-foreground">{ru.indicator_name}</td>
                        <td className="py-2.5 px-4 text-center font-mono text-xs">{ru.year}</td>
                        <td className="py-2.5 px-4 text-right font-bold font-mono text-xs text-foreground">{ru.value.toLocaleString()}</td>
                        <td className="py-2.5 px-4 text-right space-x-1.5">
                          <button
                            onClick={() => handleEdit(ru)}
                            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors inline-flex"
                            title="Edit"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(ru.id, ru.district_name, ru.indicator_name, ru.year)}
                            className="p-1.5 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors inline-flex"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination controls */}
            {totalRecords > limit && (
              <div className="flex justify-between items-center text-xs text-muted-foreground pt-4 border-t border-border">
                <p>Showing {offset + 1} to {Math.min(offset + limit, totalRecords)} of {totalRecords} records</p>
                <div className="flex items-center gap-1">
                  <Button
                    onClick={() => setOffset(Math.max(0, offset - limit))}
                    disabled={offset === 0}
                    className="h-7 w-7 p-0 bg-transparent border border-border hover:bg-muted text-foreground disabled:opacity-30"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => setOffset(offset + limit)}
                    disabled={offset + limit >= totalRecords}
                    className="h-7 w-7 p-0 bg-transparent border border-border hover:bg-muted text-foreground disabled:opacity-30"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>

      {/* Add/Edit Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md bg-card border-border shadow-2xl">
            <CardHeader>
              <CardTitle className="text-lg">{editingRecord ? "Edit Record Value" : "Add Statistical Value"}</CardTitle>
              <CardDescription className="text-xs">
                Set numerical data record for district-specific indicators. Adding a record with matching District, Indicator and Year will update its value.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="num-dist" className="text-xs">District</Label>
                  <select
                    id="num-dist"
                    value={districtId}
                    onChange={(e) => setDistrictId(e.target.value)}
                    required
                    disabled={!!editingRecord}
                    className="w-full rounded-md border border-input bg-muted px-3 py-2 text-xs focus-visible:outline-none text-foreground disabled:opacity-50"
                  >
                    <option value="">-- Select District --</option>
                    {districtsQuery.data?.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="num-ind" className="text-xs">Indicator</Label>
                  <select
                    id="num-ind"
                    value={indicatorId}
                    onChange={(e) => setIndicatorId(e.target.value)}
                    required
                    disabled={!!editingRecord}
                    className="w-full rounded-md border border-input bg-muted px-3 py-2 text-xs focus-visible:outline-none text-foreground disabled:opacity-50"
                  >
                    <option value="">-- Select Indicator --</option>
                    {indicatorsQuery.data?.map((i) => (
                      <option key={i.id} value={i.id}>{i.name}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="num-year" className="text-xs font-mono">Year</Label>
                    <Input id="num-year" type="number" value={year} onChange={(e) => setYear(e.target.value)} required disabled={!!editingRecord} placeholder="e.g. 2024" className="text-xs bg-muted disabled:opacity-50" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="num-value" className="text-xs">Numerical Value</Label>
                    <Input id="num-value" type="number" step="any" value={value} onChange={(e) => setValue(e.target.value)} required placeholder="e.g. 45.2" className="text-xs bg-muted" />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2 border-t border-border pt-4">
                <Button type="button" onClick={closeModal} className="bg-transparent border border-border text-foreground hover:bg-muted text-xs">
                  Cancel
                </Button>
                <Button type="submit" disabled={createUpdateMutation.isPending || updateDirectMutation.isPending} className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold">
                  {createUpdateMutation.isPending || updateDirectMutation.isPending ? "Saving..." : "Save Record"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      )}
    </Card>
  );
}
