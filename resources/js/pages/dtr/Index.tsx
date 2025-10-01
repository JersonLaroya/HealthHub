import { useEffect, useState } from "react";
import { Head, useForm, router } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import { toast } from "sonner";

import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import SortableHeader from "@/components/custom/sort-table-header";

export default function Index({ dtrs = { data: [] }, filters = {}, currentRole, breadcrumbs = [] }: any) {
  const [showModal, setShowModal] = useState(false);
  const [editDtr, setEditDtr] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [dtrToDelete, setDtrToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [search, setSearch] = useState(filters.search || "");
  const [sort, setSort] = useState(filters.sort || "dtr_date");
  const [direction, setDirection] = useState(filters.direction || "desc");

  const [patientQuery, setPatientQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [patientResults, setPatientResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!searchTerm) return;

    const timeout = setTimeout(async () => {
      if (searchTerm.length < 2) {
        setPatientResults([]);
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(`/${currentRole}/patients/search?q=${searchTerm}`);
        const data = await res.json();
        setPatientResults(data);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [searchTerm, currentRole]);

  // Clear patient info when input is empty
  useEffect(() => {
    if (patientQuery === "") {
      setData({
        ...data,
        name: "",
        age: "",
        sex: "",
        course_year_office: "",
      });
      setPatientResults([]);
    }
  }, [patientQuery]);

  const calculateAge = (birthdate: string) => {
  const birth = new Date(birthdate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age;
  };

  const getTodayDate = () => new Date().toISOString().split("T")[0];
  const getCurrentTime = () => new Date().toTimeString().slice(0, 5);

  const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString(undefined, options); // e.g., September 28, 2025
  };

  const formatTime = (timeStr: string) => {
    const [hour, minute] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hour, minute);
    return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true }); // e.g., 4:23 PM
  };


  const { data, setData, post, put, reset, errors, processing } = useForm({
    name: "",
    sex: "",
    age: "",
    course_year_office: "",
    purpose: "",
    management: "",
    dtr_date: getTodayDate(),
    dtr_time: getCurrentTime(),
    status: currentRole === "user" ? "pending" : "accepted",
  });

  const handleSort = (column: string) => {
    const newDirection = sort === column && direction === "asc" ? "desc" : "asc";
    setSort(column);
    setDirection(newDirection);

    router.get(`/${currentRole}/dtr`, { search, sort: column, direction: newDirection }, { preserveState: true });
  };

  const handleAdd = () => {
    reset();
    setData({
      ...data,
      dtr_date: getTodayDate(),
      dtr_time: getCurrentTime(),
    });
    setEditDtr(null);
    setPatientQuery("");
    setPatientResults([]);
    setShowModal(true);
  };

  const handleEdit = (dtr: any) => {
    setData({
      name: dtr.name,
      sex: dtr.sex,
      age: dtr.age,
      course_year_office: dtr.course_year_office,
      purpose: dtr.purpose,
      management: dtr.management,
      dtr_date: dtr.dtr_date,
      dtr_time: dtr.dtr_time,
      status: dtr.status,
    });
    setPatientQuery(dtr.name);
    setEditDtr(dtr);
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!data.name) {
      toast.error("Please enter a name.");
      return;
    }

    if (editDtr) {
      put(`/${currentRole}/dtr/${editDtr.id}`, {
        onSuccess: () => {
          reset();
          setShowModal(false);
          toast.success("DTR updated successfully.");
        },
      });
    } else {
      post(`/${currentRole}/dtr`, {
        onSuccess: () => {
          reset();
          setShowModal(false);
          toast.success("DTR added successfully.");
        },
      });
    }
  };

  const handleDelete = () => {
    if (!dtrToDelete) return;
    setDeleting(true);

    router.delete(`/${currentRole}/dtr/${dtrToDelete.id}`, {
      onSuccess: () => {
        toast.error("DTR deleted.");
        setShowDeleteModal(false);
        setDtrToDelete(null);
      },
      onFinish: () => setDeleting(false),
    });
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="DTRs" />
      <div className="p-6 space-y-6">
        {/* Search + Add */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              router.get(`/${currentRole}/dtr`, { search, sort, direction }, { preserveState: true });
            }}
            className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full md:w-auto"
          >
            <Input
              placeholder="Search by name or purpose..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-64 dark:bg-neutral-700 dark:text-gray-100"
            />
            <Button type="submit" className="w-full sm:w-auto">Search</Button>
          </form>
          <Button onClick={handleAdd} className="w-full md:w-auto">+ Add DTR</Button>
        </div>

        {/* Table */}
        <Card className="p-4 shadow-md bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-gray-50 dark:bg-neutral-700 text-left">
                  <SortableHeader column="dtr_date" label="Date" sortBy={sort} sortDirection={direction} onSort={handleSort} />
                  <SortableHeader column="dtr_time" label="Time" sortBy={sort} sortDirection={direction} onSort={handleSort} />
                  <SortableHeader column="name" label="Name" sortBy={sort} sortDirection={direction} onSort={handleSort} />
                  <SortableHeader column="age" label="Age" sortBy={sort} sortDirection={direction} onSort={handleSort} />
                  <SortableHeader column="sex" label="Sex" sortBy={sort} sortDirection={direction} onSort={handleSort} />
                  <SortableHeader column="course_year_office" label="Course & Year / Office" sortBy={sort} sortDirection={direction} onSort={handleSort} />
                  <SortableHeader column="purpose" label="Purpose" sortBy={sort} sortDirection={direction} onSort={handleSort} />
                  <SortableHeader column="management" label="Management" sortBy={sort} sortDirection={direction} onSort={handleSort} />
                  <th className="p-2 border-b">Status</th>
                  <th className="p-2 border-b">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(dtrs.data || []).length > 0 ? (
                  dtrs.data.map((dtr: any) => (
                    <tr key={dtr.id} className="hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors">
                      <td className="p-2 border-b">{formatDate(dtr.dtr_date)}</td>
                      <td className="p-2 border-b">{formatTime(dtr.dtr_time)}</td>
                      <td className="p-2 border-b">{dtr.name}</td>
                      <td className="p-2 border-b">{dtr.age}</td>
                      <td className="p-2 border-b">{dtr.sex}</td>
                      <td className="p-2 border-b">{dtr.course_year_office}</td>
                      <td className="p-2 border-b break-words">{dtr.purpose}</td>
                      <td className="p-2 border-b">{dtr.management}</td>
                      <td className="p-2 border-b">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            dtr.status === "accepted" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {dtr.status}
                        </span>
                      </td>
                      <td className="p-2 border-b space-x-2">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(dtr)}>Edit</Button>
                        {['admin', 'headnurse'].includes(currentRole) && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => { setDtrToDelete(dtr); setShowDeleteModal(true); }}
                          >
                            Delete
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="p-4 text-center text-gray-500 dark:text-gray-400">No DTRs found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Delete Modal */}
        <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
          <DialogContent className="sm:max-w-md bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md">
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
            </DialogHeader>
            <p className="text-gray-600 dark:text-gray-300">
              Are you sure you want to delete this DTR for <span className="font-semibold">{dtrToDelete?.name}</span>?
            </p>
            <DialogFooter className="flex gap-2">
              <Button variant="outline" disabled={deleting} onClick={() => setShowDeleteModal(false)}>Cancel</Button>
              <Button variant="destructive" disabled={deleting} onClick={handleDelete}>{deleting ? "Deleting..." : "Delete"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add/Edit Modal */}
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent className="sm:max-w-lg bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md">
            <DialogHeader>
              <DialogTitle>{editDtr ? "Edit DTR" : "Add DTR"}</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Patient Name Search */}
                <div className="sm:col-span-2 relative">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Patient Name</label>
                    <Popover open={patientResults.length > 0}>
                      <PopoverTrigger asChild>
                        <div className="relative w-full">
                          <Input
                            type="text"
                            value={patientQuery}
                            onChange={(e) => {
                              const value = e.target.value;
                              setPatientQuery(value);
                              setSearchTerm(value);
                              setData({ ...data, name: value });
                            }}
                            placeholder="Search patient..."
                          />

                          {/* Clear button */}
                          {patientQuery && !loading && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPatientQuery("");
                                setPatientResults([]);
                                setData({
                                  ...data,
                                  name: "",
                                  age: "",
                                  sex: "",
                                  course_year_office: "",
                                });
                              }}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 z-10"
                            >
                              ✕
                            </button>
                          )}

                          {/* Loading spinner */}
                          {loading && (
                            <div className="absolute right-8 top-1/2 -translate-y-1/2">
                              <svg className="animate-spin h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                              </svg>
                            </div>
                          )}
                        </div>
                      </PopoverTrigger>

                      <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] max-h-60 overflow-y-auto p-0">
                        {patientResults.map((patient) => (
                          <button
                            key={patient.id}
                            type="button"
                            onClick={() => {
                              setData({
                                ...data,
                                name: patient.name,
                                sex: patient.sex,
                                age: calculateAge(patient.birthdate),
                                course_year_office: patient.course ? `${patient.course} ${patient.yearLevel}` : patient.office,
                              });
                              setPatientQuery(patient.name);
                              setSearchTerm("");
                              setPatientResults([]);
                            }}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-neutral-700"
                          >
                            {patient.name}
                          </button>
                        ))}
                        {/* Clear link at the bottom right */}
                        <div className="flex justify-end mb-1 pr-4">
                          <button
                            type="button"
                            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            onClick={() => setPatientResults([])}
                          >
                            Clear
                          </button>
                        </div>
                      </PopoverContent>
                    </Popover>
                </div>

                <div className="sm:col-span-2 grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Age</label>
                    <Input type="text" value={data.age || ""} 
                    onChange={(e) => setData({ ...data, age: e.target.value })}
                      placeholder="Age"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Sex</label>
                    <Input
                      value={data.sex}
                      onChange={(e) => setData({ ...data, sex: e.target.value })}
                      placeholder="Sex"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Course & Year / Office</label>
                    <Input
                      value={data.course_year_office}
                      onChange={(e) => setData({ ...data, course_year_office: e.target.value })}
                      placeholder="Course & Year / Office"
                    />
                  </div>
                </div>

                {/* Date, Time, Purpose, Management */}
                <div>
                  <label>Date</label>
                  <Input type="date" value={data.dtr_date} onChange={(e) => setData({ ...data, dtr_date: e.target.value })} required />
                  {errors.dtr_date && <p className="text-red-500 text-sm">{errors.dtr_date}</p>}
                </div>
                <div>
                  <label>Time</label>
                  <Input type="time" value={data.dtr_time} onChange={(e) => setData({ ...data, dtr_time: e.target.value })} required />
                  {errors.dtr_time && <p className="text-red-500 text-sm">{errors.dtr_time}</p>}
                </div>
                <div className="sm:col-span-2">
                  <label>Purpose</label>
                  <Input value={data.purpose} onChange={(e) => setData("purpose", e.target.value)} required />
                  {errors.purpose && <p className="text-red-500 text-sm">{errors.purpose}</p>}
                </div>
                <div className="sm:col-span-2">
                  <label>Management</label>
                  <Input value={data.management} onChange={(e) => setData("management", e.target.value)} required />
                  {errors.management && <p className="text-red-500 text-sm">{errors.management}</p>}
                </div>
              </div>

              {!['user'].includes(currentRole) && (
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Status</label>
                  <select
                    value={data.status}
                    onChange={(e) => setData({ ...data, status: e.target.value })}
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white dark:bg-neutral-700 dark:text-gray-100 text-gray-900 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 px-3 py-2"
                  >
                    <option value="accepted">Accepted</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
              )}

              <DialogFooter className="flex justify-end gap-2 mt-2">
                <Button type="button" variant="outline" disabled={processing} onClick={() => setShowModal(false)}>Cancel</Button>
                <Button type="submit" disabled={processing}>{editDtr ? "Update" : "Add"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
