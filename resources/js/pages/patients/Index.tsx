import { useState, useEffect } from "react";
import { Head, router } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import SortableHeader from "@/components/custom/sort-table-header";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { usePage } from "@inertiajs/react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const [course, setCourse] = useState(String(safeFilters.course ?? "all"));
  const [year, setYear] = useState(String(safeFilters.year ?? "all"));
  const [office, setOffice] = useState(String(safeFilters.office ?? "all"));
  const [isSearching, setIsSearching] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const filteredCourses =
    office === "all"
      ? courses
      : courses.filter(c => String(c.office_id) === office);

  const hasCoursesForOffice = filteredCourses.length > 0;

  useEffect(() => {
    // reset course and year when office changes
    setCourse("all");
    setYear("all");
  }, [office]);

  const handleSearch = (e) => {
    e.preventDefault();

    setIsSearching(true);

    router.get(`/${prefix}/patients`, {
      q: search,
      course: course === "all" ? "" : course,
      year: year === "all" ? "" : year,
      office: office === "all" ? "" : office,
      page: 1,
    }, {
      preserveState: true,
      onFinish: () => setIsSearching(false),
    });
  };

  const handleReset = () => {
    setIsResetting(true);

    setSearch("");
    setOffice("all");
    setCourse("all");
    setYear("all");

    router.get(`/${prefix}/patients`, {}, {
      preserveState: false,
      replace: true,
      onFinish: () => setIsResetting(false),
    });
  };


  const handleViewConsultation = (patient) => {
    router.get(`/${prefix}/patients/${patient.id}`);
  };

  const handleViewInquiries = (patient) => {
    router.get(`/${prefix}/patients/${patient.id}/inquiries`);
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
          <form
            onSubmit={handleSearch}
            className="
              grid grid-cols-1
              sm:grid-cols-2
              lg:grid-cols-4
              xl:grid-cols-[1fr_auto_auto_auto_auto]
              gap-2 w-full
            "
          >
            <Input
              placeholder="Search by name, ISMIS ID, course, year, or office..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full min-w-[220px] md:col-span-4 xl:col-span-1"
            />

            {/* OFFICE */}
            <Select value={office} onValueChange={setOffice}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All Offices" />
              </SelectTrigger>

              <SelectContent className="max-h-60 overflow-y-auto">
                <SelectItem value="all">All Offices</SelectItem>
                {offices.map((o) => (
                  <SelectItem key={o.id} value={String(o.id)}>
                    {o.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* COURSE */}
            {(office === "all" || hasCoursesForOffice) && (
              <Select value={course} onValueChange={setCourse}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All Courses" />
                </SelectTrigger>

                <SelectContent
                  position="popper"
                  sideOffset={4}
                  className="max-h-[60vh] max-w-[95vw] overflow-y-auto"
                >
                  <SelectItem value="all">All Courses</SelectItem>

                  {filteredCourses.map((c) => (
                    <SelectItem
                      key={c.id}
                      value={String(c.id)}
                      className="truncate"
                      title={c.name}
                    >
                      {c.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* YEAR */}
            {hasCoursesForOffice && (
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All Years" />
                </SelectTrigger>

                <SelectContent className="max-h-60 overflow-y-auto">
                  <SelectItem value="all">All Years</SelectItem>
                  {years.map((y) => (
                    <SelectItem key={y.id} value={String(y.id)}>
                      {y.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Button
              type="submit"
              disabled={isSearching}
              className={isSearching ? "opacity-50 cursor-not-allowed" : ""}
            >
              {isSearching ? "Filtering..." : "Filter"}
            </Button>

            <Button
              type="button"
              variant="outline"
              disabled={isResetting || isSearching}
              className={isResetting ? "opacity-50 cursor-not-allowed" : ""}
              onClick={handleReset}
            >
              {isResetting ? "Resetting..." : "Reset"}
            </Button>
          </form>
        </div>

        {/* Table */}
        <Card className="p-4 shadow-md bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-gray-50 dark:bg-neutral-700 text-left">
                  <th className="p-2 border-b text-sm font-semibold">ISMIS ID</th>
                  <th className="p-2 border-b text-sm font-semibold">Name</th>
                  <th className="p-2 border-b text-sm font-semibold">Sex</th>
                  <th className="p-2 border-b text-sm font-semibold">Birthdate</th>
                  <th className="p-2 border-b text-sm font-semibold">Course & Year / Office</th>
                  <th className="p-2 border-b text-sm font-semibold">Actions</th>
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
                        {patient.ismis_id || "-"}
                      </td>
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

                            <DropdownMenuItem onClick={() => handleViewInquiries(patient)}>
                              Inquiries
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
