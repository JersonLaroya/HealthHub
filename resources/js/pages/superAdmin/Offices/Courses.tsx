import { useEffect, useState } from "react";
import { Head, router, useForm, usePage } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function Courses({ office, courses, filters }: any) {
  const { flash } = usePage().props as any;

  const [open, setOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data, setData, post, put, reset, processing } = useForm({
    name: "",
    code: "",
  });

  const [search, setSearch] = useState(filters?.search || "");
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (flash?.success) toast.success(flash.success);
    if (flash?.error) toast.error(flash.error);
  }, [flash]);

  function applySearch(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setSearching(true);

    router.get(
      `/superadmin/offices/${office.id}/courses`,
      { search },
      { preserveState: true, replace: true, onFinish: () => setSearching(false) }
    );
  }

  function openCreate() {
    reset();
    setEditingCourse(null);
    setData({ name: "", code: "" });
    setOpen(true);
  }

  function openEdit(course: any) {
    setEditingCourse(course);
    setData({ name: course.name, code: course.code || "" });
    setOpen(true);
  }

  function openDeleteModal(course: any) {
    setEditingCourse(course);
    setDeleteOpen(true);
  }

  function goToPage(url: string | null) {
    if (!url) return;
    router.get(url, {}, { preserveState: true });
  }

  return (
    <AppLayout>
      <Head title={`Courses / Departments - ${office.name}`} />

      <div className="w-full p-4 sm:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Courses / Departments</h1>
            <p className="text-sm text-muted-foreground">
              Office / College: <span className="font-medium text-foreground">{office.name}</span>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={() => router.get("/superadmin/offices")} className="w-full sm:w-auto">
              Back
            </Button>
            <Button onClick={openCreate} className="w-full sm:w-auto">
              Add Course / Department
            </Button>
          </div>
        </div>

        <form onSubmit={applySearch} className="flex flex-col sm:flex-row gap-2">
          <Input
            placeholder="Search course/department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-72"
          />
          <Button type="submit" disabled={searching} className="w-full sm:w-auto">
            {searching ? "Searching..." : "Search"}
          </Button>
        </form>

        <Card className="p-4 shadow-md bg-white dark:bg-neutral-800">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse min-w-[420px]">
              <thead>
                <tr className="bg-gray-50 dark:bg-neutral-700 text-left">
                  <th className="p-2 border-b">Code</th>
                  <th className="p-2 border-b">Course / Department</th>
                  <th className="p-2 border-b w-[220px]">Actions</th>
                </tr>
              </thead>

              <tbody>
                {courses.data.length ? (
                  courses.data.map((c: any) => (
                    <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-neutral-700">
                      <td className="p-2 border-b">
                        {c.code ? <span className="font-medium">{c.code}</span> : <span className="text-gray-400 italic">—</span>}
                      </td>
                      <td className="p-2 border-b font-medium">{c.name}</td>
                      <td className="p-2 border-b">
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button size="sm" variant="outline" onClick={() => openEdit(c)}>
                            Edit
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => openDeleteModal(c)}>
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="p-4 text-center text-gray-500">
                      No courses found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
              disabled={!courses.prev_page_url}
              onClick={() => goToPage(courses.prev_page_url)}
            >
              Previous
            </Button>

            <span className="text-sm text-gray-600 dark:text-gray-400">
              Page {courses.current_page} of {courses.last_page}
            </span>

            <Button
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
              disabled={!courses.next_page_url}
              onClick={() => goToPage(courses.next_page_url)}
            >
              Next
            </Button>
          </div>
        </Card>

        {/* ADD / EDIT */}
        <Dialog
          open={open}
          onOpenChange={(v) => {
            setOpen(v);
            if (!v) {
              reset();
              setEditingCourse(null);
            }
          }}
        >
          <DialogContent key={editingCourse ? editingCourse.id : "create"}>
            <DialogHeader>
              <DialogTitle>{editingCourse ? "Edit Course / Department" : "Add Course / Department"}</DialogTitle>
            </DialogHeader>

            <form
              onSubmit={(e) => {
                e.preventDefault();

                if (editingCourse) {
                    put(`/superadmin/offices/${office.id}/courses/${editingCourse.id}`, {
                        onSuccess: () => {
                        reset();
                        setEditingCourse(null);
                        setOpen(false);
                        },
                        onError: () => toast.error("Failed to update course"),
                    });setDeleteOpen(false);
                } else {
                    post(`/superadmin/offices/${office.id}/courses`, {
                        onSuccess: () => {
                        reset();
                        setOpen(false);
                        },
                        onError: () => toast.error("Failed to add course"),
                    });
                }
              }}
              className="space-y-4"
            >
              <div className="space-y-3">
                <div>
                  <Label>Code (optional)</Label>
                  <Input value={data.code} onChange={(e) => setData("code", e.target.value)} placeholder="e.g. BSIT, HRM, ENG" />
                </div>

                <div>
                  <Label>Course / Department name</Label>
                  <Input value={data.name} onChange={(e) => setData("name", e.target.value)} />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>

                <Button type="submit" disabled={processing}>
                  {processing ? "Saving..." : "Save"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* DELETE */}
        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-red-600">Delete Course / Department</DialogTitle>
            </DialogHeader>

            <p className="text-sm text-gray-600 dark:text-gray-300">
              Are you sure you want to delete <span className="font-semibold">{editingCourse?.name}</span>? This action cannot be undone.
            </p>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteOpen(false)}>
                Cancel
              </Button>

              <Button
                variant="destructive"
                disabled={isDeleting}
                className={isDeleting ? "opacity-60 cursor-not-allowed" : ""}
                onClick={() => {
                  setIsDeleting(true);

                  router.delete(`/superadmin/offices/${office.id}/courses/${editingCourse.id}`, {
                    onFinish: () => setIsDeleting(false),
                    onSuccess: () => {
                      setDeleteOpen(false);
                    },
                    onError: () => toast.error("Failed to delete course"),
                  });
                }}
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