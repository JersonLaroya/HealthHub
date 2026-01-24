import { useState, useEffect } from "react";
import { Head, router, useForm, usePage } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function Index({ offices, filters }: any) {
  const { flash } = usePage().props as any;

  const [open, setOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingOffice, setEditingOffice] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data, setData, post, put, reset, processing } = useForm({
    name: "",
  });

  const [search, setSearch] = useState(filters?.search || "");
  const [searching, setSearching] = useState(false);

  function applySearch(e?: React.FormEvent) {
    if (e) e.preventDefault();

    setSearching(true);

    router.get(
        "/superadmin/offices",
        { search },
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
    setEditingOffice(null);
    setData("name", "");
    setOpen(true);
  }

  function openEdit(office: any) {
    setEditingOffice(office);
    setData("name", office.name);
    setOpen(true);
  }

  function openDeleteModal(office: any) {
    setEditingOffice(office);
    setDeleteOpen(true);
  }

  function goToPage(url: string | null) {
    if (!url) return;
    router.get(url, {}, { preserveState: true });
  }

  return (
    <AppLayout>
      <Head title="Offices" />

      <div className="w-full p-4 sm:p-6 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h1 className="text-2xl font-bold">Offices</h1>
          <Button onClick={openCreate} className="w-full sm:w-auto">
            Add Office
          </Button>
        </div>

        <form onSubmit={applySearch} className="flex flex-col sm:flex-row gap-2">
            <Input
                placeholder="Search office..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full sm:w-72"
            />

            <Button
                type="submit"
                disabled={searching}
                className="w-full sm:w-auto"
            >
                {searching ? "Searching..." : "Search"}
            </Button>
        </form>

        <Card className="p-4 shadow-md bg-white dark:bg-neutral-800">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse min-w-[360px]">
              <thead>
                <tr className="bg-gray-50 dark:bg-neutral-700 text-left">
                  <th className="p-2 border-b">Office Name</th>
                  <th className="p-2 border-b w-40">Actions</th>
                </tr>
              </thead>

              <tbody>
                {offices.data.length ? (
                  offices.data.map((o: any) => (
                    <tr key={o.id} className="hover:bg-gray-50 dark:hover:bg-neutral-700">
                      <td className="p-2 border-b font-medium">{o.name}</td>
                      <td className="p-2 border-b flex flex-col sm:flex-row gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEdit(o)}>
                          Edit
                        </Button>

                        <Button size="sm" variant="destructive" onClick={() => openDeleteModal(o)}>
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2} className="p-4 text-center text-gray-500">
                      No offices found.
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
              disabled={!offices.prev_page_url}
              onClick={() => goToPage(offices.prev_page_url)}
            >
              Previous
            </Button>

            <span className="text-sm text-gray-600 dark:text-gray-400">
              Page {offices.current_page} of {offices.last_page}
            </span>

            <Button
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
              disabled={!offices.next_page_url}
              onClick={() => goToPage(offices.next_page_url)}
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
                setEditingOffice(null);
                }
            }}
        >
          <DialogContent key={editingOffice ? editingOffice.id : "create"}>
            <DialogHeader>
              <DialogTitle>{editingOffice ? "Edit Office" : "Add Office"}</DialogTitle>
            </DialogHeader>

            <form
              onSubmit={(e) => {
                e.preventDefault();

                if (editingOffice) {
                    put(`/superadmin/offices/${editingOffice.id}`, {
                        onSuccess: () => {
                        toast.success("Office updated successfully");
                        reset();
                        setEditingOffice(null);
                        setOpen(false);
                        },
                        onError: () => toast.error("Failed to update office"),
                    });
                    } else {
                    post("/superadmin/offices", {
                        onSuccess: () => {
                        toast.success("Office added successfully");
                        reset();
                        setOpen(false);
                        },
                        onError: () => toast.error("Failed to add office"),
                    });
                }
              }}
              className="space-y-4"
            >
              <div>
                <Label>Office name</Label>
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
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-red-600">Delete Office</DialogTitle>
            </DialogHeader>

            <p className="text-sm text-gray-600 dark:text-gray-300">
              Are you sure you want to delete{" "}
              <span className="font-semibold">{editingOffice?.name}</span>?
              This action cannot be undone.
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

                  router.delete(`/superadmin/offices/${editingOffice.id}`, {
                    onFinish: () => setIsDeleting(false),
                    onSuccess: () => {
                        toast.success("Office deleted successfully");
                        setDeleteOpen(false);
                    },
                    onError: () => toast.error("Failed to delete office"),
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
