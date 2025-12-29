import { useState } from "react";
import { Head, router } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

interface Role {
  id: number;
  name: string;
}

interface PositionsProps {
  positions: Role[];
  breadcrumbs: any;
}

export default function Positions({ positions: initialPositions, breadcrumbs }: PositionsProps) {
  const [positions, setPositions] = useState(initialPositions || []);

  const [openModal, setOpenModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const [openDelete, setOpenDelete] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  const [deleting, setDeleting] = useState(false);

  const openAddModal = () => {
    setEditingRole(null);
    setName("");
    setOpenModal(true);
  };

  const openEditModal = (role: Role) => {
    setEditingRole(role);
    setName(role.name);
    setOpenModal(true);
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("Name required", { description: "Please enter a role name." });
      return;
    }

    const payload = { name, category: "rcy" };
    setSaving(true);

    if (editingRole) {
      // Update role
      router.put(`/admin/rcy/positions/${editingRole.id}`, payload, {
        onSuccess: (page) => {
          if (page.props.positions) setPositions(page.props.positions);
          toast.success("Position updated");
          setOpenModal(false);
        },
        onError: (errs) => {
          const firstError = Object.values(errs)[0] as string;
          toast.error("Error updating position", { description: firstError || "Check the form." });
        },
        onFinish: () => setSaving(false),
      });
    } else {
      // Add role
      router.post("/admin/rcy/positions", payload, {
        onSuccess: (page) => {
          if (page.props.positions) setPositions(page.props.positions);
          toast.success("Position added");
          setOpenModal(false);
        },
        onError: (errs) => {
          const firstError = Object.values(errs)[0] as string;
          toast.error("Error adding position", { description: firstError || "Check the form." });
        },
        onFinish: () => setSaving(false),
      });
    }
  };

  const handleDelete = () => {
    if (!roleToDelete) return;
    setDeleting(true);

    router.delete(`/admin/rcy/positions/${roleToDelete.id}`, {
      onSuccess: (page) => {
        if (page.props.positions) setPositions(page.props.positions);
        toast.success("Position deleted");
        setOpenDelete(false);
        setRoleToDelete(null);
      },
      onFinish: () => setDeleting(false),
    });
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="RCY Positions" />
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">RCY Positions</h1>
          <Button onClick={openAddModal}>+ Add Position</Button>
        </div>

        <Card className="p-4 shadow-md bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100 mt-4">
          <table className="w-full text-sm border-collapse min-w-[400px]">
            <thead>
              <tr className="bg-gray-50 dark:bg-neutral-700 text-left">
                <th className="p-2 border-b">Name</th>
                <th className="p-2 border-b text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {positions.length > 0 ? (
                positions.map((pos) => (
                  <tr
                    key={pos.id}
                    className="hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors"
                  >
                    <td className="p-2 border-b">{pos.name}</td>
                    <td className="p-2 border-b flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => openEditModal(pos)}
                        disabled={editingRole?.id === pos.id && saving}
                      >
                        {editingRole?.id === pos.id && saving ? "Updating..." : "Edit"}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => { setRoleToDelete(pos); setOpenDelete(true); }}
                        disabled={deleting && roleToDelete?.id === pos.id}
                      >
                        {deleting && roleToDelete?.id === pos.id ? "Deleting..." : "Delete"}
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={2} className="p-4 text-center text-gray-500 dark:text-gray-400">
                    No positions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>

        {/* Add/Edit Modal */}
        <Dialog open={openModal} onOpenChange={setOpenModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingRole ? "Edit Position" : "Add Position"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Position name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={saving}
                onKeyDown={(e) => {
                    if (e.key === "Enter") {
                    e.preventDefault();
                    handleSave();
                    }
                }}
              />
              <DialogFooter className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setOpenModal(false)} disabled={saving}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (editingRole ? "Updating..." : "Adding...") : editingRole ? "Update" : "Add"}
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <Dialog open={openDelete} onOpenChange={setOpenDelete}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
            </DialogHeader>
            <p className="text-gray-600 dark:text-gray-300">
              Are you sure you want to delete <span className="font-semibold">{roleToDelete?.name}</span>?
            </p>
            <DialogFooter className="flex justify-end gap-2">
              <Button variant="outline" disabled={deleting} onClick={() => setOpenDelete(false)}>Cancel</Button>
              <Button variant="destructive" disabled={deleting} onClick={handleDelete}>
                {deleting ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
