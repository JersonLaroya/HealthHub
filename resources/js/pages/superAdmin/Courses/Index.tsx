import { useState, useEffect } from "react";
import { Head, router, useForm, usePage } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { toast } from "sonner";

export default function Index({ courses, offices, filters }: any) {
  const { flash } = usePage().props as any;

  const [open, setOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data, setData, post, put, reset, processing } = useForm({
    office_id: "",
    name: "",
    code: "",
  });

  const [search, setSearch] = useState(filters?.search || "");
  const [officeFilter, setOfficeFilter] = useState(filters?.office_id || "all");
  const [searching, setSearching] = useState(false);

  function applySearch(e?: React.FormEvent) {
    if (e) e.preventDefault();

    setSearching(true);

    router.get(
      "/superadmin/courses",
      {
        search,
        office_id: officeFilter === "all" ? undefined : officeFilter,
      },
      {
        preserveState: true,
        replace: true,
        onFinish: () => setSearching(false),
      }
    );
  }

  useEffect(() => {
    if (flash?.success) toast.success(flash.success);
    if (flash?.error) toast.error(flash.error);
  }, [flash]);

  function openCreate() {
    reset();
    setEditingCourse(null);
    setOpen(true);
  }

  function openEdit(course: any) {
    setEditingCourse(course);
    setData({
      office_id: String(course.office_id),
      name: course.name,
      code: course.code,
    });
    setOpen(true);
  }

  function openDeleteModal(course: any) {
    setEditingCourse(course);
    setDeleteOpen(true);
  }

  function goToPage(url: string | null) {
    if (!url) return;

    router.get(
      url,
      {
        search,
        office_id: officeFilter === "all" ? undefined : officeFilter,
      },
      { preserveState: true }
    );
  }

  return (
    <AppLayout>
      <Head title="Courses" />

      <div className="w-full p-4 sm:p-6 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h1 className="text-2xl font-bold">Courses</h1>
          <Button onClick={openCreate} className="w-full sm:w-auto">
            Add Course
          </Button>
        </div>

        {/* SEARCH + FILTER */}
        <form onSubmit={applySearch} className="flex flex-col md:flex-row gap-2">
          <Input
            placeholder="Search course or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-72"
          />

          <Select value={officeFilter} onValueChange={setOfficeFilter}>
            <SelectTrigger className="w-full md:w-64">
              <SelectValue placeholder="Filter by office" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All offices</SelectItem>
              {offices.map((o: any) => (
                <SelectItem key={o.id} value={String(o.id)}>
                  {o.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button type="submit" disabled={searching} className="w-full md:w-auto">
            {searching ? "Searching..." : "Search"}
          </Button>
        </form>

        {/* TABLE */}
        <Card className="p-4 shadow-md bg-white dark:bg-neutral-800">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse min-w-[640px]">
              <thead>
                <tr className="bg-gray-50 dark:bg-neutral-700 text-left">
                  <th className="p-2 border-b">Code</th>
                  <th className="p-2 border-b">Name</th>
                  <th className="p-2 border-b">Office</th>
                  <th className="p-2 border-b w-40">Actions</th>
                </tr>
              </thead>

              <tbody>
                {courses.data.length ? (
                  courses.data.map((c: any) => (
                    <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-neutral-700">
                      <td className="p-2 border-b font-medium">{c.code}</td>
                      <td className="p-2 border-b">{c.name}</td>
                      <td className="p-2 border-b">{c.office?.name}</td>
                      <td className="p-2 border-b flex flex-col sm:flex-row gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEdit(c)}>
                          Edit
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => openDeleteModal(c)}>
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-gray-500">
                      No courses found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
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
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="w-[95vw] sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingCourse ? "Edit Course" : "Add Course"}</DialogTitle>
            </DialogHeader>

            <form
              onSubmit={(e) => {
                e.preventDefault();

                if (editingCourse) {
                  put(`/superadmin/courses/${editingCourse.id}`, {
                    onSuccess: () => {
                      toast.success("Course updated successfully");
                      reset();
                      setEditingCourse(null);
                      setOpen(false);
                    },
                    onError: () => toast.error("Failed to update course"),
                  });
                } else {
                  post("/superadmin/courses", {
                    onSuccess: () => {
                      toast.success("Course added successfully");
                      reset();
                      setOpen(false);
                    },
                    onError: () => toast.error("Failed to add course"),
                  });
                }
              }}
              className="space-y-3 sm:space-y-4"
            >
              <div>
                <Label>Office</Label>
                <Select
                  value={data.office_id}
                  onValueChange={(v) => setData("office_id", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select office" />
                  </SelectTrigger>
                  <SelectContent>
                    {offices.map((o: any) => (
                      <SelectItem key={o.id} value={String(o.id)}>
                        {o.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Course code</Label>
                <Input
                  value={data.code}
                  onChange={(e) => setData("code", e.target.value)}
                />
              </div>

              <div>
                <Label>Course name</Label>
                <Input
                  value={data.name}
                  onChange={(e) => setData("name", e.target.value)}
                />
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
          <DialogContent className="w-[95vw] sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-red-600">Delete Course</DialogTitle>
            </DialogHeader>

            <p className="text-sm text-gray-600 dark:text-gray-300">
              Are you sure you want to delete{" "}
              <span className="font-semibold">{editingCourse?.name}</span>?
            </p>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteOpen(false)}>
                Cancel
              </Button>

              <Button
                variant="destructive"
                disabled={isDeleting}
                onClick={() => {
                  setIsDeleting(true);

                  router.delete(`/superadmin/courses/${editingCourse.id}`, {
                    onFinish: () => setIsDeleting(false),
                    onSuccess: () => {
                      toast.success("Course deleted successfully");
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
