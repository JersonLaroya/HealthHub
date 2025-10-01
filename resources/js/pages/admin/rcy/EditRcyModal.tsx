import { useForm } from "@inertiajs/react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function EditRcyModal({ open, onClose, positions, rcy }) {
  const { data, setData, put, processing, errors, reset } = useForm({
    position_id: rcy?.position_id || "",
    school_year: rcy?.school_year || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    put(`/admin/rcy/${rcy.id}`, {
      onSuccess: () => {
        toast.success("RCY updated", {
          description: `${rcy.user?.user_info?.first_name} ${rcy.user?.user_info?.last_name} updated successfully.`,
        });
        reset();
        onClose();
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-neutral-900">
        <DialogHeader>
          <DialogTitle>Edit RCY Member</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Position Select */}
          <div>
            <label className="block text-sm font-medium">Position</label>
            <select
              value={data.position_id}
              onChange={(e) => setData("position_id", e.target.value)}
              className="w-full border rounded p-2 dark:bg-neutral-800 dark:text-white"
            >
              <option value="">-- Select Position --</option>
              {positions.map((pos) => (
                <option key={pos.id} value={pos.id}>
                  {pos.name}
                </option>
              ))}
            </select>
            {errors.position_id && (
              <p className="text-sm text-red-600">{errors.position_id}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={processing}>
              {processing ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
