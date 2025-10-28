import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface UserWithRole {
  id: string;
  email: string;
  created_at: string;
  role: "admin" | "applicant" | null;
}

export default function UserManagement() {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchBy, setSearchBy] = useState<"email" | "id">("email");
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(
    new Set()
  );
  const { signOut, user } = useAuth();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);

    const { data: usersData, error: usersError } = await supabase
      .from("app_users")
      .select("id, email, created_at")
      .order("created_at", { ascending: false });

    if (usersError) {
      toast.error("Failed to fetch users");
      setLoading(false);
      return;
    }

    const { data: rolesData } = await supabase
      .from("user_roles")
      .select("user_id, role");

    const usersWithRoles: UserWithRole[] = usersData.map((user) => {
      const userRole = rolesData?.find((r) => r.user_id === user.id);
      return {
        ...user,
        role: userRole?.role || null,
      };
    });

    setUsers(usersWithRoles);
    setSelectedUserIds(new Set());
    setLoading(false);
  };

  const updateUserRole = async (
    userId: string,
    newRole: "admin" | "applicant"
  ) => {
    await supabase.from("user_roles").delete().eq("user_id", userId);

    const { error } = await supabase
      .from("user_roles")
      .insert({ user_id: userId, role: newRole });

    if (error) {
      toast.error("Failed to update user role");
    } else {
      toast.success("User role updated successfully");
      fetchUsers();
    }
  };

  const handleSelectUser = (userId: string, checked: boolean) => {
    setSelectedUserIds((prev) => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(userId);
      } else {
        newSet.delete(userId);
      }
      return newSet;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(filteredUsers.map((u) => u.id));
      setSelectedUserIds(allIds);
    } else {
      setSelectedUserIds(new Set());
    }
  };

  const deleteSelectedUsers = async () => {
    if (selectedUserIds.size === 0) return;

    if (
      !confirm(
        `Are you sure you want to delete ${selectedUserIds.size} user(s)? This cannot be undone.`
      )
    ) {
      return;
    }

    const idsToDelete = Array.from(selectedUserIds);

    try {
      await supabase.from("user_roles").delete().in("user_id", idsToDelete);

      await supabase.from("app_users").delete().in("id", idsToDelete);

      toast.success(`${idsToDelete.length} user(s) deleted successfully`);
      fetchUsers();
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete users");
    }
  };

  const filteredUsers = users.filter((u) => {
    const query = searchQuery.toLowerCase();
    if (searchBy === "email") {
      return u.email.toLowerCase().includes(query);
    } else {
      return u.id.toLowerCase().includes(query);
    }
  });

  const isAllSelected =
    filteredUsers.length > 0 && selectedUserIds.size === filteredUsers.length;
  const isSomeSelected = selectedUserIds.size > 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-2xl font-bold">Users</h1>
            <nav className="flex gap-4">
              <Button variant="ghost" size="sm" asChild>
                <a href="/admin/jobs">Jobs</a>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <a href="/admin/users">Users</a>
              </Button>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user?.email}</span>
            <Button variant="outline" size="sm" onClick={signOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <Select
            value={searchBy}
            onValueChange={(val) => setSearchBy(val as "email" | "id")}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="id">User ID</SelectItem>
              <SelectItem value="email">Email</SelectItem>
            </SelectContent>
          </Select>

          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={`Search by ${
                searchBy === "email" ? "Email" : "User ID"
              }`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Button variant="outline" size="sm" onClick={fetchUsers}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>

          {isSomeSelected && (
            <Button
              variant="destructive"
              size="sm"
              onClick={deleteSelectedUsers}
              className="flex items-center gap-1"
            >
              <Trash2 className="w-4 h-4" />
              Delete ({selectedUserIds.size})
            </Button>
          )}
        </div>

        <div className="border rounded-lg bg-card overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    className="rounded border-input"
                    checked={isAllSelected}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </TableHead>
                <TableHead>UID</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Created at</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((userItem) => (
                <TableRow key={userItem.id}>
                  <TableCell>
                    <input
                      type="checkbox"
                      className="rounded border-input"
                      checked={selectedUserIds.has(userItem.id)}
                      onChange={(e) =>
                        handleSelectUser(userItem.id, e.target.checked)
                      }
                    />
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {userItem.id}
                  </TableCell>
                  <TableCell>{userItem.email}</TableCell>
                  <TableCell>
                    {userItem.role ? (
                      <Badge
                        variant={
                          userItem.role === "admin" ? "default" : "secondary"
                        }
                        className="capitalize"
                      >
                        {userItem.role}
                      </Badge>
                    ) : (
                      <Badge className="capitalize border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
                        Applicant
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(userItem.created_at).toLocaleString("en-US", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                      timeZoneName: "short",
                    })}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={userItem.role || "applicant"}
                      onValueChange={(val) =>
                        updateUserRole(
                          userItem.id,
                          val as "admin" | "applicant"
                        )
                      }
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="applicant">Applicant</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No users found matching your search.
            </div>
          )}
        </div>

        <div className="mt-4 text-sm text-muted-foreground">
          Showing {filteredUsers.length} of {users.length} users
        </div>
      </main>
    </div>
  );
}
