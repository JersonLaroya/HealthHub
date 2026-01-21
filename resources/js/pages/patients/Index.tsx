import { useState } from "react";
import { Head, router } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import SortableHeader from "@/components/custom/sort-table-header";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { usePage } from "@inertiajs/react";

export default function Index({ patients = { data: [] }, filters = {}, courses = [], years = [], offices = [], breadcrumbs = [] }) {
  const { auth } = usePage().props as any;
  console.log("patients: ", patients);

  const role = auth?.user?.user_role?.name?.toLowerCase();
  const prefix = role === "nurse" ? "nurse" : "admin"; 

  // hard safety
  const safePatients =
    patients && typeof patients === "object"
      ? patients
      : { data: [] };

  const safeFilters =
    filters && typeof filters === "object"
      ? filters
      : {};

  // hard-cast values (prevents React internal crash)
  const [search, setSearch] = useState(String(safeFilters.q ?? ""));
  const [course, setCourse] = useState(String(safeFilters.course ?? ""));
  const [year, setYear] = useState(String(safeFilters.year ?? ""));
  const [office, setOffice] = useState(String(safeFilters.office ?? ""));
  const [sort, setSort] = useState(
    typeof safeFilters.sort === "string" ? safeFilters.sort : "created_at"
  );
  const [direction, setDirection] = useState(
    safeFilters.direction === "asc" || safeFilters.direction === "desc"
      ? safeFilters.direction
      : "desc"
  );
  const [isSearching, setIsSearching] = useState(false);

  const handleSort = (column) => {
    const newDirection = sort === column && direction === "asc" ? "desc" : "asc";
    setSort(column);
    setDirection(newDirection);
    router.get(`/${prefix}/patients`, {
      q: search,
      course,
      year,
      office,
      sort: column,
      direction: newDirection,
    }, { preserveState: true });
  };

  const handleSearch = (e) => {
    e.preventDefault();

    setIsSearching(true);

    router.get(`/${prefix}/patients`, {
      q: search,
      course,
      year,
      office,
      sort,
      direction,
      page: 1,
    }, {
      preserveState: true,
      onFinish: () => setIsSearching(false),
    });
  };

  const handleViewConsultation = (patient) => {
    router.get(`/${prefix}/patients/${patient.id}`);
  };

  const handleViewMedicalFiles = (patient) => {
    router.get(`/${prefix}/patients/${patient.id}/files`);
  };

  const isStaffFaculty = (safePatients?.data || []).some(p =>
    ["staff", "faculty"].includes(p.user_role?.name?.toLowerCase())
  );

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Patients" />
      <div className="p-6 space-y-6">

        {/* Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <form onSubmit={handleSearch} className="flex flex-col lg:flex-row gap-2 w-full">
            <Input
              placeholder="Search by name, course, year, or office..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full lg:w-64 dark:bg-neutral-700 dark:text-gray-100"
            />

            {/* COURSE */}
            <select
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              className="border rounded-md px-3 py-2 text-sm dark:bg-neutral-700"
            >
              <option value="">All Courses</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            {/* YEAR */}
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="border rounded-md px-3 py-2 text-sm dark:bg-neutral-700"
            >
              <option value="">All Years</option>
              {years.map((y) => (
                <option key={y.id} value={y.id}>{y.name}</option>
              ))}
            </select>

            {/* OFFICE */}
            <select
              value={office}
              onChange={(e) => setOffice(e.target.value)}
              className="border rounded-md px-3 py-2 text-sm dark:bg-neutral-700"
            >
              <option value="">All Offices</option>
              {offices.map((o) => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>

            <Button
              type="submit"
              disabled={isSearching}
              className={isSearching ? "opacity-50 cursor-not-allowed" : ""}
            >
              {isSearching ? "Filtering..." : "Filter"}
            </Button>
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
                {safePatients.data.length > 0 ? (
                  safePatients.data.map((patient) => (
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
          {safePatients.links && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={!safePatients.prev_page_url}
                onClick={() =>
                  router.get(safePatients.prev_page_url, {
                    q: search,
                    course,
                    year,
                    office,
                    sort,
                    direction,
                  }, { preserveState: true })
                }
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Page {safePatients.current_page} of {safePatients.last_page}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={!safePatients.next_page_url}
                onClick={() =>
                  router.get(safePatients.next_page_url, {
                    q: search,
                    course,
                    year,
                    office,
                    sort,
                    direction,
                  }, { preserveState: true })
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
