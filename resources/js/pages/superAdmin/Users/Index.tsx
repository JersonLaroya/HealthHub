import { useState, useEffect } from "react";
import { Head, router, useForm } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";

// shadcn
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { usePage } from "@inertiajs/react";

interface Props {
  users: any;
  roles: string[];
  yearLevels: { id: number; name: string }[];
  courses: { id: number; code: string }[];
  offices: { id: number; name: string; code?: string | null }[];
  filters: {
    role?: string;
    search?: string;
    year_level?: number;
  };
}

export default function SuperAdminUsers({ users, roles, yearLevels, courses, offices, filters }: Props) {
  const [role, setRole] = useState(filters.role || "all");
  const [search, setSearch] = useState(filters.search || "");
  const [course, setCourse] = useState("all");
  const [office, setOffice] = useState("all");
  const [yearLevel, setYearLevel] = useState(filters.year_level || "all");

  const [searching, setSearching] = useState(false);
  const [resetting, setResetting] = useState(false);

  const [open, setOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { flash } = usePage().props as any;

  useEffect(() => {
    if (flash?.success) {
        toast.success(flash.success);
    }

    if (flash?.error) {
        toast.error(flash.error);
    }
    }, [flash]);

    const { data, setData, put, processing, errors, reset } = useForm({
    first_name: "",
    middle_name: "",
    last_name: "",
    email: "",
    ismis_id: "",
    password: "",
    course_id: "",
    year_level_id: "",
    office_id: "",
  });

  const indexUrl = "/superadmin/users";

  /* =========================
     Filters
  ========================= */

  function applyFilters() {
    setSearching(true);

    router.get(
        indexUrl,
        {
        role: role === "all" ? undefined : role,
        search,
        year_level: yearLevel === "all" ? undefined : yearLevel,
        course_id: course === "all" ? undefined : course,
        office_id: office === "all" ? undefined : office,
        },
        {
        preserveState: true,
        replace: true,
        onFinish: () => setSearching(false),
        }
    );
    }

    function handleRoleChange(value: string) {
    setRole(value);

    // clear dependent filters
    setCourse("all");
    setYearLevel("all");
    setOffice("all");
    }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    applyFilters();
    }

  /* =========================
     Pagination
  ========================= */

  function goToPage(url: string | null) {
    if (!url) return;

    router.get(
        url,
        {
        role: role === "all" ? undefined : role,
        search,
        year_level: yearLevel === "all" ? undefined : yearLevel,
        course_id: course === "all" ? undefined : course,
        office_id: office === "all" ? undefined : office,
        },
        { preserveState: true }
    );
    }

    function openEdit(user: any) {
    setEditingUser(user);

    setData({
        first_name: user.first_name || "",
        middle_name: user.middle_name || "",
        last_name: user.last_name || "",
        email: user.email || "",
        ismis_id: user.ismis_id || "",
        password: "",
        course_id: user.course?.id || "",
        year_level_id: user.year_level?.id || "",
        office_id: user.office?.id || "",
    });

    setOpen(true);
    }

    function openDelete(user: any) {
        setDeletingUser(user);
        setDeleteOpen(true);
    }

    function confirmDelete() {
        if (!deletingUser) return;

        setIsDeleting(true);

        router.delete(`/superadmin/users/${deletingUser.id}`, {
            onSuccess: () => {
            setDeleteOpen(false);
            setDeletingUser(null);
            },
            onError: () => {
            toast.error("Failed to delete user");
            },
            onFinish: () => {
            setIsDeleting(false);
            },
        });
    }

  return (
    <AppLayout>
      <Head title="User Management" />

      <div className="p-4 sm:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                User Management
            </h1>

            <div className="flex gap-2 justify-end">
                <Button onClick={() => router.get("/superadmin/users/create")}>
                Add User
                </Button>

                <Button variant="outline" onClick={() => router.get("/superadmin/users/bulk")}>
                Bulk Add
                </Button>
            </div>
        </div>

        {/* Search + Filters */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 w-full">
          <form
            onSubmit={handleSearch}
            className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full"
          >
            {/* Search */}
            <Input
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 min-w-[220px] dark:bg-neutral-700 dark:text-gray-100"
            />

            {/* Role filter */}
            <Select value={role} onValueChange={handleRoleChange}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                {roles.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* STUDENT FILTERS */}
            {role === "Student" && (
            <>
                <Select value={course} onValueChange={setCourse}>
                <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Filter by course" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All courses</SelectItem>
                    {courses.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                        {c.code}
                    </SelectItem>
                    ))}
                </SelectContent>
                </Select>

                <Select value={String(yearLevel)} onValueChange={setYearLevel}>
                <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Filter by year" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All year levels</SelectItem>
                    {yearLevels.map((y) => (
                    <SelectItem key={y.id} value={String(y.id)}>
                        {y.name}
                    </SelectItem>
                    ))}
                </SelectContent>
                </Select>
            </>
            )}

            {/* OFFICE FILTER */}
            {role !== "Student" && (
            <Select value={office} onValueChange={setOffice}>
                <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by office" />
                </SelectTrigger>
                <SelectContent>
                <SelectItem value="all">All offices</SelectItem>
                {offices.map((o) => (
                    <SelectItem key={o.id} value={String(o.id)}>
                        {o.code ?? o.name}
                    </SelectItem>
                ))}
                </SelectContent>
            </Select>
            )}

            <Button
            type="submit"
            disabled={searching}
            className={`w-full sm:w-auto h-9 ${searching ? "opacity-60 cursor-not-allowed" : ""}`}
            >
            {searching ? "Searching..." : "Search"}
            </Button>

            <Button
                type="button"
                variant="outline"
                disabled={resetting}
                className={`w-full sm:w-auto h-9 ${resetting ? "opacity-60 cursor-not-allowed" : ""}`}
                onClick={() => {
                    setResetting(true);

                    setSearch("");
                    setRole("all");
                    setYearLevel("all");
                    setCourse("all");
                    setOffice("all");

                    router.get(indexUrl, {}, {
                    replace: true,
                    onFinish: () => setResetting(false),
                    });
                }}
                >
                {resetting ? "Resetting..." : "Reset"}
            </Button>
          </form>
        </div>

        {/* Table */}
        <Card className="p-4 shadow-md bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse min-w-[520px]">
              <thead>
                <tr className="bg-gray-50 dark:bg-neutral-700 text-left">
                    <th className="p-2 border-b">ISMIS ID</th>
                    <th className="p-2 border-b">Name</th>
                    <th className="p-2 border-b">Email</th>
                    <th className="p-2 border-b">Role</th>
                    <th className="p-2 border-b">Course / Office</th>
                    <th className="p-2 border-b">Year</th>
                    <th className="p-2 border-b">Joined</th>
                    <th className="p-2 border-b">Actions</th>
                </tr>
               </thead>

              <tbody>
                {users.data.length > 0 ? (
                  users.data.map((u: any) => (
                    <tr
                    key={u.id}
                    className="hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors"
                    >
                    <td className="p-2 border-b">
                        {u.ismis_id ?? "—"}
                    </td>
                    <td className="p-2 border-b font-medium">{u.name}</td>
                    <td className="p-2 border-b">{u.email}</td>
                    <td className="p-2 border-b">
                    {u.user_role?.category === "rcy" ? "Student" : u.user_role?.name}
                    </td>

                    {/* Course or Office */}
                    <td className="p-2 border-b">
                        {u.course
                            ? u.course.code
                            : u.office
                            ? (u.office.code ?? u.office.name)
                            : "—"}
                    </td>

                    {/* Year level (students only usually) */}
                    <td className="p-2 border-b">
                        {u.year_level?.name ?? "—"}
                    </td>

                    <td className="p-2 border-b">
                        {new Date(u.created_at).toLocaleDateString()}
                    </td>

                    <td className="p-2 border-b flex flex-col sm:flex-row gap-2">
                    <Button size="sm" variant="outline" className="w-full sm:w-auto" onClick={() => openEdit(u)}>
                        Edit
                    </Button>

                    <Button
                        size="sm"
                        variant="destructive"
                        className="w-full sm:w-auto"
                        onClick={() => openDelete(u)}
                    >
                        Delete
                    </Button>
                    </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="p-4 text-center text-gray-500 dark:text-gray-400"
                    >
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
              disabled={!users.prev_page_url}
              onClick={() => goToPage(users.prev_page_url)}
            >
              Previous
            </Button>

            <span className="text-sm text-gray-600 dark:text-gray-400">
              Page {users.current_page} of {users.last_page}
            </span>

            <Button
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
              disabled={!users.next_page_url}
              onClick={() => goToPage(users.next_page_url)}
            >
              Next
            </Button>
          </div>
        </Card>

        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                <DialogTitle>Edit User</DialogTitle>
                </DialogHeader>

                <form
                autoComplete="off"
                onSubmit={(e) => {
                    e.preventDefault();

                    put(`/superadmin/users/${editingUser.id}`, {
                    onSuccess: () => {
                        reset();
                        setOpen(false);
                    },
                    onError: () => {
                        toast.error("Failed to update user");
                    },
                    });
                }}
                className="space-y-4"
                >
                <div className="space-y-3">
                    <div>
                        <Label>ISMIS ID</Label>
                        <Input
                            value={data.ismis_id}
                            onChange={(e) => setData("ismis_id", e.target.value)}
                            autoComplete="off"
                        />
                    </div>

                    <div>
                        <Label>First name</Label>
                        <Input
                        value={data.first_name}
                        onChange={(e) => setData("first_name", e.target.value)}
                        />
                    </div>

                    <div>
                        <Label>Middle name</Label>
                        <Input
                        value={data.middle_name}
                        onChange={(e) => setData("middle_name", e.target.value)}
                        />
                    </div>

                    <div>
                        <Label>Last name</Label>
                        <Input
                        value={data.last_name}
                        onChange={(e) => setData("last_name", e.target.value)}
                        />
                    </div>
                    </div>

                <div>
                    <Label>Email</Label>
                    <Input value={data.email} onChange={e => setData("email", e.target.value)} />
                </div>

                <div>
                    <Label>New password (optional)</Label>
                    <Input
                        type="password"
                        value={data.password}
                        onChange={e => setData("password", e.target.value)}
                        autoComplete="new-password"
                    />
                </div>

                {/* STUDENT / RCY */}
                {editingUser?.user_role?.name === "Student" || editingUser?.user_role?.category === "rcy" ? (
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <Label>Course</Label>
                            <Select
                            value={String(data.course_id || "")}
                            onValueChange={(v) => setData("course_id", v)}
                            >
                            <SelectTrigger>
                                <SelectValue placeholder="Select course" />
                            </SelectTrigger>
                            <SelectContent>
                                {courses.map((c) => (
                                <SelectItem key={c.id} value={String(c.id)}>
                                    {c.code}
                                </SelectItem>
                                ))}
                            </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label>Year level</Label>
                            <Select
                            value={String(data.year_level_id || "")}
                            onValueChange={(v) => setData("year_level_id", v)}
                            >
                            <SelectTrigger>
                                <SelectValue placeholder="Select year" />
                            </SelectTrigger>
                            <SelectContent>
                                {yearLevels.map((y) => (
                                <SelectItem key={y.id} value={String(y.id)}>
                                    {y.name}
                                </SelectItem>
                                ))}
                            </SelectContent>
                            </Select>
                        </div>
                    </div>
                ) : (
                    <div>
                        <Label>Office</Label>
                        <Select
                            value={String(data.office_id || "")}
                            onValueChange={(v) => setData("office_id", v)}
                        >
                            <SelectTrigger>
                            <SelectValue placeholder="Select office" />
                            </SelectTrigger>
                            <SelectContent>
                            {offices.map((o) => (
                                <SelectItem key={o.id} value={String(o.id)}>
                                    {o.code ?? o.name}
                                </SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                    </Button>
                    <Button type="submit" disabled={processing}>
                    {processing ? "Saving..." : "Save changes"}
                    </Button>
                </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
        
        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                <DialogTitle>Delete User</DialogTitle>
                </DialogHeader>

                <p className="text-sm text-gray-600 dark:text-gray-300">
                Are you sure you want to delete{" "}
                <span className="font-semibold">{deletingUser?.name}</span>?  
                This action cannot be undone.
                </p>

                <DialogFooter>
                <Button
                    variant="outline"
                    onClick={() => setDeleteOpen(false)}
                >
                    Cancel
                </Button>

                <Button
                    variant="destructive"
                    onClick={confirmDelete}
                    disabled={isDeleting}
                    className={isDeleting ? "opacity-60 cursor-not-allowed" : ""}
                >
                    {isDeleting ? "Deleting..." : "Delete"}
                </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>   
      </div>
    </AppLayout>
  );
}
