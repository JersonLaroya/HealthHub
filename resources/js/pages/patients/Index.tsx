import { useState } from "react";
import { Head, router } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import SortableHeader from "@/components/custom/sort-table-header";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { usePage } from "@inertiajs/react";

export default function Index({ patients = { data: [] }, filters = {}, breadcrumbs = [] }) {
  const { auth } = usePage().props as any;

  const role = auth?.user?.user_role?.name?.toLowerCase();
  const prefix = role === "nurse" ? "nurse" : "admin"; 

  const [search, setSearch] = useState(filters.q || "");
  const [sort, setSort] = useState(filters.sort || "created_at");
  const [direction, setDirection] = useState(filters.direction || "desc");

  const handleSort = (column) => {
    const newDirection = sort === column && direction === "asc" ? "desc" : "asc";
    setSort(column);
    setDirection(newDirection);
    router.get(`/${prefix}/patients`, { q: search, sort: column, direction: newDirection }, { preserveState: true });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    router.get(`/${prefix}/patients`, { q: search, sort, direction }, { preserveState: true });
  };

  const handleViewConsultation = (patient) => {
    router.get(`/${prefix}/patients/${patient.id}`);
  };

  const handleViewMedicalFiles = (patient) => {
    router.get(`/${prefix}/patients/${patient.id}/files`);
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Patients" />
      <div className="p-6 space-y-6">

        {/* Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full md:w-auto">
            <Input
              placeholder="Search patient by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-64 dark:bg-neutral-700 dark:text-gray-100"
            />
            <Button type="submit" className="w-full sm:w-auto">Search</Button>
          </form>
        </div>

        {/* Table */}
        <Card className="p-4 shadow-md bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-gray-50 dark:bg-neutral-700 text-left">
                  <SortableHeader column="name" label="Name" sortBy={sort} sortDirection={direction} onSort={handleSort} />
                  <SortableHeader column="sex" label="Sex" sortBy={sort} sortDirection={direction} onSort={handleSort} />
                  <SortableHeader column="birthdate" label="Birthdate" sortBy={sort} sortDirection={direction} onSort={handleSort} />
                  <SortableHeader column="course_year_or_office" label="Course & Year / Office" sortBy={sort} sortDirection={direction} onSort={handleSort} />
                  <th className="p-2 border-b text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {patients.data.length > 0 ? (
                  patients.data.map((patient) => (
                    <tr
                      key={patient.id}
                      className="hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
                    >
                      <td className="p-2 border-b">
                        {patient.first_name} {patient.last_name}
                      </td>
                      <td className="p-2 border-b">{patient.sex || "-"}</td>
                      <td className="p-2 border-b">
                        {patient.birthdate
                          ? new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                              .format(new Date(patient.birthdate))
                          : "-"}
                      </td>
                      <td className="p-2 border-b">
                        {patient.course
                          ? `${patient.course.name} ${patient.year_level?.name || ""}`
                          : patient.office?.name || "-"}
                      </td>
                      <td className="p-2 border-b">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              View
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewConsultation(patient)}>
                              Consultation Records
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleViewMedicalFiles(patient)}>
                              Medical Files
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-gray-500 dark:text-gray-400">
                      No patients found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {patients.links && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={!patients.prev_page_url}
                onClick={() =>
                  router.get(patients.prev_page_url, { q: search, sort, direction }, { preserveState: true })
                }
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Page {patients.current_page} of {patients.last_page}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={!patients.next_page_url}
                onClick={() =>
                  router.get(patients.next_page_url, { q: search, sort, direction }, { preserveState: true })
                }
              >
                Next
              </Button>
            </div>
          )}
        </Card>
      </div>
    </AppLayout>
  );
}
