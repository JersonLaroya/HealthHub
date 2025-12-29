import { useState } from "react";
import { Head, useForm, router } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import { toast } from "sonner";

// shadcn components
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import SortableHeader from "@/components/custom/sort-table-header";
import { DialogDescription } from "@radix-ui/react-dialog";

export default function Index({ events, filters, breadcrumbs, currentRole}) {
  
  const [showModal, setShowModal] = useState(false);
  const [editEvent, setEditEvent] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [search, setSearch] = useState(filters.search || "");
  const [sort, setSort] = useState(filters.sort || "start_at");
  const [direction, setDirection] = useState(filters.direction || "asc");

  const [startDate, setStartDate] = useState(filters.start_date || "");
  const [endDate, setEndDate] = useState(filters.end_date || "");
  
  const role = currentRole;

  const rolePrefix = role.toLowerCase().replace(" ", ""); 
  const baseUrl = `/${rolePrefix}/events`;

  const indexUrl = baseUrl;
  const storeUrl = baseUrl;
  const updateUrl = (id: number) => `${baseUrl}/${id}`;
  const deleteUrl = (id: number) => `${baseUrl}/${id}`;

  const clearForm = () => {
    setData({
      title: "",
      description: "",
      start_at: "",
      end_at: "",
    });
    setEditEvent(null);
  };


  const { data, setData, post, put, reset, errors, processing } = useForm({
    title: "",
    description: "",
    start_at: "",
    end_at: "",
    image: null,
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Add modal
  const handleAdd = () => {
    clearForm();
    setEditEvent(null);
    setShowModal(true);
  };

  const formatDateTimeLocal = (date: string | null) => {
  if (!date) return "";
    return new Date(date).toISOString().slice(0, 16);
  };

  // Edit modal
  const handleEdit = (event: any) => {
    setData({
      title: event.title || "",
      description: event.description || "",
      start_at: formatDateTimeLocal(event.start_at),
      end_at: formatDateTimeLocal(event.end_at),
      image: null,
    });

    setEditEvent(event);
    setShowModal(true);
    setImagePreview(event.image ? `/storage/${event.image}` : null);
  };

    // Sorting
  const handleSort = (column: string) => {
    const newDirection = sort === column && direction === "asc" ? "desc" : "asc";
    setSort(column);
    setDirection(newDirection);

    router.get(
      indexUrl,
      { search, sort: column, direction: newDirection },
      { preserveState: true, replace: true }
    );
  };


// Search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.get(
      indexUrl,
      { search, start_date: filters.start_date, end_date: filters.end_date },
      { preserveState: true, replace: true }
    );
  };

  // Submit Add/Edit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editEvent) {
      put(updateUrl(editEvent.id), {
        onSuccess: () => {
          clearForm();
          setShowModal(false);
          toast.success("Event updated", {
            description: `${data.title} updated successfully.`,
          });
        },
      });
    } else {
      post(storeUrl, {
        onSuccess: () => {
          clearForm();
          setShowModal(false);
          toast.success("Event added", {
            description: `${data.title} created successfully.`,
          });
        },
      });
    }
  };

  // Pagination
  const goToPage = (url: string | null) => {
    if (!url) return;
    router.get(url, { search, sort, direction }, { preserveState: true });
  };

//For See More / See Less  
function EventDescription({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const maxLength = 50; // number of characters to show initially

  if (text.length <= maxLength) return <span>{text}</span>;

  return (
    <span>
      {expanded ? text : text.slice(0, maxLength) + "..."}{" "}
      <button
        className="ml-1 underline text-gray-600 dark:text-gray-400"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? "See Less" : "See More"}
      </button>
    </span>
  );
}


  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Events" />
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Events
        </h1>

        {/* Search + Add + Filters */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 w-full">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              router.get(
                indexUrl,
                { search, start_date: startDate, end_date: endDate },
                { preserveState: true, replace: true }
              );
            }}
            className="flex flex-col lg:flex-row items-start lg:items-center gap-2 w-full"
          >
            {/* Search */}
            <Input
              placeholder="Search events..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 min-w-[200px] md:min-w-[300px] dark:bg-neutral-700 dark:text-gray-100"
            />
            
            {/* Start Date */}
            <div className="flex flex-col sm:flex-row sm:items-center md:ml-2 w-full md:w-auto">
              <span className="text-sm text-gray-700 dark:text-gray-300 sm:mr-1 mb-1 sm:mb-0">
                Start At
              </span>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="min-w-[140px] w-full sm:w-36 h-8 dark:bg-neutral-700 dark:text-gray-100"
              />
            </div>

            {/* End Date */}
            <div className="flex flex-col sm:flex-row sm:items-center md:ml-2 md:mr-2 w-full md:w-auto">
              <span className="text-sm text-gray-700 dark:text-gray-300 sm:mr-1 mb-1 sm:mb-0">
                End At
              </span>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="min-w-[140px] w-full sm:w-36 h-8 dark:bg-neutral-700 dark:text-gray-100"
              />
            </div>

            {/* Search Button */}
            <Button type="submit" className="h-8 w-full lg:w-auto">
              Search
            </Button>

            {/* Reset Button */}
            <Button
              type="button"
              variant="outline"
              className="w-full lg:w-auto"
              onClick={() => {
                setSearch("");
                setStartDate("");
                setEndDate("");
                router.get(indexUrl, {}, { preserveState: true, replace: true });
              }}
            >
              Reset
            </Button>
          </form>

          <Button onClick={handleAdd} className="w-full md:w-auto">
            + Add Event
          </Button>
        </div>

        {/* Table */}
        <Card className="p-4 shadow-md bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-gray-50 dark:bg-neutral-700 text-left">
                  <SortableHeader
                    column="title"
                    label="Title"
                    sortBy={sort}
                    sortDirection={direction}
                    onSort={handleSort}
                  />
                  <th className="p-2 border-b">Image</th>
                  <th className="p-2 border-b">Description</th>
                  <SortableHeader
                    column="start_at"
                    label="Start At"
                    sortBy={sort}
                    sortDirection={direction}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    column="end_at"
                    label="End At"
                    sortBy={sort}
                    sortDirection={direction}
                    onSort={handleSort}
                  />
                  <th className="p-2 border-b">Created By</th>
                  <th className="p-2 border-b">Edited By</th>
                  <th className="p-2 border-b">Created At</th>
                  <th className="p-2 border-b">Updated At</th>
                  <th className="p-2 border-b">Actions</th>
                </tr>
              </thead>
              <tbody>
                {events && events.data && events.data.length > 0 ? (
                  events.data.map((event: any) => (
                    <tr
                      key={event.id}
                      className="hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors"
                    >
                      <td className="p-2 border-b">{event.title}</td>
                      <td className="p-2 border-b">
                        {event.image ? (
                          <img
                            src={`/storage/${event.image}`}
                            alt={event.title}
                            className="max-h-20 object-contain"
                          />
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="p-2 border-b">
                        <EventDescription text={event.description || ""} />
                      </td>
                      <td className="p-2 border-b">
                        {new Date(event.start_at).toLocaleString()}
                      </td>
                      <td className="p-2 border-b">
                        {event.end_at ? new Date(event.end_at).toLocaleString() : "—"}
                      </td>
                      <td className="p-2 border-b">
                        {event.creator?.first_name} {event.creator?.last_name}
                      </td>
                      <td className="p-2 border-b">
                        {event.editor ? `${event.editor.first_name} ${event.editor.last_name}` : "—"}
                      </td>
                      <td className="p-2 border-b">
                        {new Date(event.created_at).toLocaleString()}
                      </td>
                      <td className="p-2 border-b">
                        {new Date(event.updated_at).toLocaleString()}
                      </td>
                      <td className="p-2 border-b space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(event)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            setEventToDelete(event);  // set the specific event
                            setShowDeleteModal(true); // show modal
                          }}
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={9}
                      className="p-4 text-center text-gray-500 dark:text-gray-400"
                    >
                      No events found.
                    </td>
                  </tr>
                )}
              </tbody>

            </table>
          </div>

          {/* Pagination */}
          {events.links && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={!events.prev_page_url}
                onClick={() =>
                  router.get(
                    events.prev_page_url,
                    { search, sort, direction },
                    { preserveState: true }
                  )
                }
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Page {events.current_page} of {events.last_page}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={!events.next_page_url}
                onClick={() =>
                  router.get(
                    events.next_page_url,
                    { search, sort, direction },
                    { preserveState: true }
                  )
                }
              >
                Next
              </Button>
            </div>
          )}
        </Card>

        {/* Delete Modal */}
        <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
          <DialogContent className="sm:max-w-md bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md">
            <DialogDescription />
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
            </DialogHeader>
            <p className="text-gray-600 dark:text-gray-300">
              Are you sure you want to delete{" "}
              <span className="font-semibold">{eventToDelete?.title}</span>?
            </p>
            <DialogFooter>
              <Button
                variant="outline"
                disabled={deleting}
                 onClick={() => {
                  clearForm();
                  setShowModal(false);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={deleting}
                onClick={() => {
                  if (!eventToDelete) return;

                  setDeleting(true);

                  router.delete(`${baseUrl}/${eventToDelete.id}`, { // use baseUrl + id
                    onSuccess: () => {
                      toast.error("Event deleted", {
                        description: `${eventToDelete.title} removed.`,
                      });
                      setShowDeleteModal(false);
                      setEventToDelete(null);
                    },
                    onFinish: () => setDeleting(false),
                  });
                }}
              >
                {deleting ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add/Edit Modal */}
        <Dialog open={showModal} 
          onOpenChange={(open) => {
            setShowModal(open);
            if (!open) {
              clearForm();
            }
          }}>
          <DialogContent className="sm:max-w-lg bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md">
          <DialogDescription />
            <DialogHeader>
              <DialogTitle>{editEvent ? "Edit Event" : "Add Event"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input
                  value={data.title}
                  onChange={(e) => setData("title", e.target.value)}
                />
                {errors.title && (
                  <p className="text-sm text-red-600">{errors.title}</p>
                )}
              </div>

              <div>
                <Label>Event Image</Label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setData("image", file);
                      setImagePreview(URL.createObjectURL(file));
                    }
                  }}
                  className="mt-1 block w-full"
                />
                {imagePreview && (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="mt-2 max-h-40 object-contain"
                  />
                )}
                {errors.image && (
                  <p className="text-sm text-red-600">{errors.image}</p>
                )}
              </div>

              <div>
                <Label>Description</Label>
                <Input
                  value={data.description}
                  onChange={(e) => setData("description", e.target.value)}
                />
              </div>

              <div>
                <Label>Start At</Label>
                <Input
                  type="datetime-local"
                  value={data.start_at}
                  onChange={(e) => setData("start_at", e.target.value)}
                />
                {errors.start_at && (
                  <p className="text-sm text-red-600">{errors.start_at}</p>
                )}
              </div>

              <div>
                <Label>End At</Label>
                <Input
                  type="datetime-local"
                  value={data.end_at}
                  onChange={(e) => setData("end_at", e.target.value)}
                />
                {errors.end_at && (
                  <p className="text-sm text-red-600">{errors.end_at}</p>
                )}
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  disabled={processing}
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={processing}>
                  {processing
                    ? editEvent
                      ? "Updating..."
                      : "Adding..."
                    : editEvent
                    ? "Update"
                    : "Add"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
