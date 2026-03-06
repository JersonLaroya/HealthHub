import { useForm, Head } from "@inertiajs/react";
import { useEffect, useState } from "react";
import AppLayout from "@/layouts/app-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import {
  FileText,
  Stethoscope,
  Activity,
  CalendarDays,
  Heart,
  HeartPulse,
  Syringe,
  Users,
  Smile,
  Mail,
  Facebook,
} from "lucide-react";

function SectionCard({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card className="rounded-2xl border border-slate-200/80 shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-200/70 p-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">
            {title}
          </h2>
          {description && (
            <p className="text-sm text-slate-500">{description}</p>
          )}
        </div>
        {action}
      </div>

      <div className="p-5">{children}</div>
    </Card>
  );
}

export default function Index({ settings }: any) {
  const initialAccomplishments = settings?.clinic_accomplishments?.length
    ? settings.clinic_accomplishments.map((item: any) => ({
        title: item.title || "",
        description: item.description || "",
        cover_image: null as File | null,
        cover_image_path: item.cover_image || "",
        images: [] as File[],
        existing_images: item.images || [],
      }))
    : [
        {
          title: "",
          description: "",
          cover_image: null as File | null,
          cover_image_path: "",
          images: [] as File[],
          existing_images: [] as string[],
        },
      ];

  const initialProfessionals = settings?.healthcare_professionals?.length
    ? settings.healthcare_professionals.map((item: any) => ({
        name: item.name || "",
        position: item.position || "",
        image: null as File | null,
        image_path: item.image || "",
        description: item.description || "",
      }))
    : [
        {
          name: "",
          position: "",
          image: null as File | null,
          image_path: "",
          description: "",
        },
      ];

  const initialTour = settings?.healthhub_tour?.length
    ? settings.healthhub_tour.map((item: any) => ({
        title: item.title || "",
        description: item.description || "",
        image: null as File | null,
        image_path: item.image || "",
      }))
    : [
        {
          title: "",
          description: "",
          image: null as File | null,
          image_path: "",
        },
      ];

  const { data, setData, post, processing, transform } = useForm({
    app_name: settings?.app_name || "",
    school_year: settings?.school_year || "",
    app_logo: null as File | null,
    clinic_logo: null as File | null,

    clinic_accomplishments: initialAccomplishments,

    homepage_services: settings?.homepage_services || [
      {
        title: "",
        description: "",
        icon: "",
      },
    ],

    healthcare_professionals: initialProfessionals,

    healthhub_tour: initialTour,

    footer_content: {
      campus_name: settings?.footer_content?.campus_name || "",
      department: settings?.footer_content?.department || "",
      address: settings?.footer_content?.address || "",
      contacts:
        settings?.footer_content?.contacts?.length
          ? settings.footer_content.contacts
          : [
              { label: "Facebook", value: "", href: "" },
              { label: "Email", value: "", href: "" },
            ],
    },
  });

  const [appLogoPreview, setAppLogoPreview] = useState<string | null>(
    settings?.app_logo ? `/storage/${settings.app_logo}` : null
  );

  const [clinicLogoPreview, setClinicLogoPreview] = useState<string | null>(
    settings?.clinic_logo ? `/storage/${settings.clinic_logo}` : null
  );

  function revokeIfBlob(url: string | null) {
    if (url && url.startsWith("blob:")) {
      URL.revokeObjectURL(url);
    }
  }

  useEffect(() => {
    return () => {
      revokeIfBlob(appLogoPreview);
      revokeIfBlob(clinicLogoPreview);
    };
  }, []);

  function updateArrayItem(
    key:
      | "clinic_accomplishments"
      | "homepage_services"
      | "healthcare_professionals"
      | "healthhub_tour",
    index: number,
    field: string,
    value: any
  ) {
    const updated = [...(data[key] as any[])];
    updated[index] = { ...updated[index], [field]: value };
    setData(key, updated);
  }

  function addArrayItem(
    key:
      | "clinic_accomplishments"
      | "homepage_services"
      | "healthcare_professionals"
      | "healthhub_tour"
  ) {
    const current = [...(data[key] as any[])];

    if (key === "clinic_accomplishments") {
      current.push({
        title: "",
        description: "",
        cover_image: null,
        cover_image_path: "",
        images: [],
        existing_images: [],
      });
    }

    if (key === "homepage_services") {
      current.push({
        title: "",
        description: "",
        icon: "",
      });
    }

    if (key === "healthcare_professionals") {
      current.push({
        name: "",
        position: "",
        image: null,
        image_path: "",
        description: "",
      });
    }

    if (key === "healthhub_tour") {
      current.push({
        title: "",
        description: "",
        image: null,
        image_path: "",
      });
    }

    setData(key, current);
  }

  function removeArrayItem(
    key:
      | "clinic_accomplishments"
      | "homepage_services"
      | "healthcare_professionals"
      | "healthhub_tour",
    index: number
  ) {
    const updated = [...(data[key] as any[])];
    updated.splice(index, 1);
    setData(key, updated);
  }

  function setAccomplishmentCoverImage(index: number, file: File | null) {
    const updated = [...(data.clinic_accomplishments as any[])];
    updated[index] = {
      ...updated[index],
      cover_image: file,
    };
    setData("clinic_accomplishments", updated);
  }

  function addAccomplishmentGalleryImages(index: number, files: File[]) {
    const updated = [...(data.clinic_accomplishments as any[])];
    updated[index] = {
      ...updated[index],
      images: [...(updated[index].images || []), ...files],
    };
    setData("clinic_accomplishments", updated);
  }

  function removeNewAccomplishmentGalleryImage(
    index: number,
    imageIndex: number
  ) {
    const updated = [...(data.clinic_accomplishments as any[])];
    const images = [...(updated[index].images || [])];
    images.splice(imageIndex, 1);

    updated[index] = {
      ...updated[index],
      images,
    };

    setData("clinic_accomplishments", updated);
  }

  function removeExistingAccomplishmentGalleryImage(
    index: number,
    imageIndex: number
  ) {
    const updated = [...(data.clinic_accomplishments as any[])];
    const existingImages = [...(updated[index].existing_images || [])];
    existingImages.splice(imageIndex, 1);

    updated[index] = {
      ...updated[index],
      existing_images: existingImages,
    };

    setData("clinic_accomplishments", updated);
  }

  function setProfessionalImage(index: number, file: File | null) {
    const updated = [...(data.healthcare_professionals as any[])];
    updated[index] = {
      ...updated[index],
      image: file,
    };
    setData("healthcare_professionals", updated);
  }

  function setTourImage(index: number, file: File | null) {
    const updated = [...(data.healthhub_tour as any[])];
    updated[index] = {
      ...updated[index],
      image: file,
    };
    setData("healthhub_tour", updated);
  }

  function updateFooter(field: string, value: string) {
    setData("footer_content", {
      ...(data.footer_content as any),
      [field]: value,
    });
  }

  function updateFooterContact(index: number, field: string, value: string) {
    const contacts = [...(((data.footer_content as any)?.contacts || []) as any[])];
    contacts[index] = {
      ...contacts[index],
      [field]: value,
    };

    setData("footer_content", {
      ...(data.footer_content as any),
      contacts,
    });
  }

  const serviceIcons: any = {
    FileText,
    Stethoscope,
    Activity,
    CalendarDays,
    Heart,
    HeartPulse,
    Syringe,
    Users,
  };

  const contactIcons: any = {
    Facebook,
    Email: Mail,
  };

  return (
    <AppLayout>
      <Head title="System Settings" />

      <div className="min-h-screen">
        <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                System Settings
              </h1>
              <p className="text-sm text-slate-500">
                Manage homepage content, branding, and footer information.
              </p>
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();

              transform((formData) => ({
                ...formData,
                clinic_accomplishments_payload: JSON.stringify(
                  (formData.clinic_accomplishments || []).map((item: any) => ({
                    title: item.title,
                    description: item.description,
                    cover_image_path: item.cover_image_path || "",
                    existing_images: item.existing_images || [],
                  }))
                ),
                homepage_services: JSON.stringify(formData.homepage_services || []),
                healthcare_professionals_payload: JSON.stringify(
                  (formData.healthcare_professionals || []).map((item: any) => ({
                    name: item.name,
                    position: item.position,
                    image_path: item.image_path || "",
                    description: item.description,
                  }))
                ),
                healthhub_tour_payload: JSON.stringify(
                  (formData.healthhub_tour || []).map((item: any) => ({
                    title: item.title,
                    description: item.description,
                    image_path: item.image_path || "",
                  }))
                ),
                footer_content: JSON.stringify(formData.footer_content || {}),
              }));

              post("/superadmin/settings", {
                forceFormData: true,
                onSuccess: (page) => {
                  toast.success("System settings updated successfully");

                  const newSettings = (page.props as any).settings;

                  revokeIfBlob(appLogoPreview);
                  revokeIfBlob(clinicLogoPreview);

                  setAppLogoPreview(
                    newSettings?.app_logo
                      ? `/storage/${newSettings.app_logo}`
                      : null
                  );

                  setClinicLogoPreview(
                    newSettings?.clinic_logo
                      ? `/storage/${newSettings.clinic_logo}`
                      : null
                  );
                },
                onError: () => {
                  toast.error("Failed to update system settings");
                },
              });
            }}
            className="space-y-6"
          >
            <SectionCard
              title="Basic Information"
              description="Set the application name, school year, and logos."
            >
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <div className="space-y-2">
                  <Label>App name</Label>
                  <Input
                    value={data.app_name}
                    onChange={(e) => setData("app_name", e.target.value)}
                    placeholder="HealthHub"
                  />
                </div>

                <div className="space-y-2">
                  <Label>School year</Label>
                  <Input
                    placeholder="2025 - 2026"
                    value={data.school_year}
                    onChange={(e) => setData("school_year", e.target.value)}
                  />
                </div>

                <div className="space-y-3">
                  <Label>App logo</Label>
                  <div className="rounded-xl border border-dashed border-slate-300 bg-white p-4">
                    {appLogoPreview ? (
                      <img
                        src={appLogoPreview}
                        alt="App logo"
                        className="mb-3 h-24 w-full rounded-md border bg-white object-contain p-2"
                      />
                    ) : (
                      <div className="mb-3 flex h-24 items-center justify-center rounded-md border border-dashed text-sm text-slate-400">
                        No logo selected
                      </div>
                    )}

                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setData("app_logo", file);

                        if (file) {
                          revokeIfBlob(appLogoPreview);
                          setAppLogoPreview(URL.createObjectURL(file));
                        }
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Clinic logo</Label>
                  <div className="rounded-xl border border-dashed border-slate-300 bg-white p-4">
                    {clinicLogoPreview ? (
                      <img
                        src={clinicLogoPreview}
                        alt="Clinic logo"
                        className="mb-3 h-24 w-full rounded-md border bg-white object-contain p-2"
                      />
                    ) : (
                      <div className="mb-3 flex h-24 items-center justify-center rounded-md border border-dashed text-sm text-slate-400">
                        No logo selected
                      </div>
                    )}

                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setData("clinic_logo", file);

                        if (file) {
                          revokeIfBlob(clinicLogoPreview);
                          setClinicLogoPreview(URL.createObjectURL(file));
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title="Clinic Accomplishments"
              description="Manage the accomplishment cards and gallery images shown on the homepage."
              action={
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => addArrayItem("clinic_accomplishments")}
                >
                  Add Accomplishment
                </Button>
              }
            >
              <div className="space-y-4">
                {(data.clinic_accomplishments as any[]).map((item, index) => (
                  <div
                    key={index}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                          {index + 1}
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900">
                            Accomplishment #{index + 1}
                          </h3>
                          <p className="text-sm text-slate-500">
                            Title, description, cover image, and gallery
                          </p>
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() =>
                          removeArrayItem("clinic_accomplishments", index)
                        }
                      >
                        Remove
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Title</Label>
                        <Input
                          value={item.title}
                          onChange={(e) =>
                            updateArrayItem(
                              "clinic_accomplishments",
                              index,
                              "title",
                              e.target.value
                            )
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Cover image</Label>

                        {item.cover_image_path && !item.cover_image && (
                          <img
                            src={`/storage/${item.cover_image_path}`}
                            alt="Cover"
                            className="h-24 w-full rounded-md border object-cover"
                          />
                        )}

                        {item.cover_image && (
                          <img
                            src={URL.createObjectURL(item.cover_image)}
                            alt="Cover preview"
                            className="h-24 w-full rounded-md border object-cover"
                          />
                        )}

                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            setAccomplishmentCoverImage(index, file);
                          }}
                        />
                      </div>

                      <div className="space-y-2 lg:col-span-2">
                        <Label>Description</Label>
                        <Textarea
                          rows={4}
                          value={item.description}
                          onChange={(e) =>
                            updateArrayItem(
                              "clinic_accomplishments",
                              index,
                              "description",
                              e.target.value
                            )
                          }
                        />
                      </div>
                    </div>

                    <div className="mt-5 space-y-3 rounded-xl bg-slate-50 p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <Label className="text-sm font-medium">
                            Gallery images
                          </Label>
                          <p className="text-xs text-slate-500">
                            Add multiple images for this accomplishment.
                          </p>
                        </div>

                        <Input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            addAccomplishmentGalleryImages(index, files);
                          }}
                        />
                      </div>

                      {!!item.existing_images?.length && (
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-slate-500">
                            Saved images
                          </p>
                          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                            {item.existing_images.map(
                              (img: string, imageIndex: number) => (
                                <div key={imageIndex} className="space-y-2">
                                  <img
                                    src={`/storage/${img}`}
                                    alt="Saved gallery"
                                    className="h-24 w-full rounded-md border object-cover"
                                  />
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    className="w-full"
                                    onClick={() =>
                                      removeExistingAccomplishmentGalleryImage(
                                        index,
                                        imageIndex
                                      )
                                    }
                                  >
                                    Remove
                                  </Button>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}

                      {!!item.images?.length && (
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-slate-500">
                            New images
                          </p>
                          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                            {item.images.map((file: File, imageIndex: number) => (
                              <div key={imageIndex} className="space-y-2">
                                <img
                                  src={URL.createObjectURL(file)}
                                  alt="New gallery"
                                  className="h-24 w-full rounded-md border object-cover"
                                />
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  className="w-full"
                                  onClick={() =>
                                    removeNewAccomplishmentGalleryImage(
                                      index,
                                      imageIndex
                                    )
                                  }
                                >
                                  Remove
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard
              title="Homepage Services"
              description="Edit the services displayed on the homepage."
              action={
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => addArrayItem("homepage_services")}
                >
                  Add Service
                </Button>
              }
            >
              <div className="space-y-4">
                {(data.homepage_services as any[]).map((item, index) => (
                  <div
                    key={index}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <h3 className="font-semibold text-slate-900">
                        Service #{index + 1}
                      </h3>
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => removeArrayItem("homepage_services", index)}
                      >
                        Remove
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Title</Label>
                        <Input
                          value={item.title}
                          onChange={(e) =>
                            updateArrayItem(
                              "homepage_services",
                              index,
                              "title",
                              e.target.value
                            )
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Icon</Label>

                        <select
                          className="w-full rounded-md border border-slate-300 p-2 text-sm"
                          value={item.icon}
                          onChange={(e) =>
                            updateArrayItem(
                              "homepage_services",
                              index,
                              "icon",
                              e.target.value
                            )
                          }
                        >
                          <option value="">Select icon</option>
                          {Object.keys(serviceIcons).map((iconName) => (
                            <option key={iconName} value={iconName}>
                              {iconName}
                            </option>
                          ))}
                        </select>

                        {item.icon && serviceIcons[item.icon] && (
                          <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                            Preview:
                            {(() => {
                              const Icon = serviceIcons[item.icon];
                              return <Icon className="h-5 w-5 text-blue-600" />;
                            })()}
                          </div>
                        )}
                      </div>

                      <div className="space-y-2 lg:col-span-2">
                        <Label>Description</Label>
                        <Textarea
                          rows={4}
                          value={item.description}
                          onChange={(e) =>
                            updateArrayItem(
                              "homepage_services",
                              index,
                              "description",
                              e.target.value
                            )
                          }
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard
              title="Healthcare Professionals"
              description="Manage the staff members shown on the homepage."
              action={
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => addArrayItem("healthcare_professionals")}
                >
                  Add Professional
                </Button>
              }
            >
              <div className="space-y-4">
                {(data.healthcare_professionals as any[]).map((item, index) => (
                  <div
                    key={index}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <h3 className="font-semibold text-slate-900">
                        Professional #{index + 1}
                      </h3>
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() =>
                          removeArrayItem("healthcare_professionals", index)
                        }
                      >
                        Remove
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Name</Label>
                        <Input
                          value={item.name}
                          onChange={(e) =>
                            updateArrayItem(
                              "healthcare_professionals",
                              index,
                              "name",
                              e.target.value
                            )
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Position</Label>
                        <Input
                          value={item.position}
                          onChange={(e) =>
                            updateArrayItem(
                              "healthcare_professionals",
                              index,
                              "position",
                              e.target.value
                            )
                          }
                        />
                      </div>

                      <div className="space-y-2 lg:col-span-2">
                        <Label>Image</Label>

                        {item.image_path && !item.image && (
                          <img
                            src={`/storage/${item.image_path}`}
                            alt="Professional"
                            className="h-24 w-24 rounded-xl border object-cover"
                          />
                        )}

                        {item.image && (
                          <img
                            src={URL.createObjectURL(item.image)}
                            alt="Professional preview"
                            className="h-24 w-24 rounded-xl border object-cover"
                          />
                        )}

                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            setProfessionalImage(index, file);
                          }}
                        />
                      </div>

                      <div className="space-y-2 lg:col-span-2">
                        <Label>Description</Label>
                        <Textarea
                          rows={4}
                          value={item.description}
                          onChange={(e) =>
                            updateArrayItem(
                              "healthcare_professionals",
                              index,
                              "description",
                              e.target.value
                            )
                          }
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard
              title="HealthHub Tour"
              description="Edit the slides used for the guided homepage tour."
              action={
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => addArrayItem("healthhub_tour")}
                >
                  Add Tour Slide
                </Button>
              }
            >
              <div className="space-y-4">
                {(data.healthhub_tour as any[]).map((item, index) => (
                  <div
                    key={index}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <h3 className="font-semibold text-slate-900">
                        Tour Slide #{index + 1}
                      </h3>
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => removeArrayItem("healthhub_tour", index)}
                      >
                        Remove
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Title</Label>
                        <Input
                          value={item.title}
                          onChange={(e) =>
                            updateArrayItem(
                              "healthhub_tour",
                              index,
                              "title",
                              e.target.value
                            )
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Image</Label>

                        {item.image_path && !item.image && (
                          <img
                            src={`/storage/${item.image_path}`}
                            alt="Tour"
                            className="h-24 w-full rounded-md border object-cover"
                          />
                        )}

                        {item.image && (
                          <img
                            src={URL.createObjectURL(item.image)}
                            alt="Tour preview"
                            className="h-24 w-full rounded-md border object-cover"
                          />
                        )}

                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            setTourImage(index, file);
                          }}
                        />
                      </div>

                      <div className="space-y-2 lg:col-span-2">
                        <Label>Description</Label>
                        <Textarea
                          rows={4}
                          value={item.description}
                          onChange={(e) =>
                            updateArrayItem(
                              "healthhub_tour",
                              index,
                              "description",
                              e.target.value
                            )
                          }
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard
              title="Footer Content"
              description="Update the footer information, privacy notice, and clickable contact links."
            >
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Campus name</Label>
                    <Input
                      value={(data.footer_content as any)?.campus_name || ""}
                      onChange={(e) => updateFooter("campus_name", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Department</Label>
                    <Input
                      value={(data.footer_content as any)?.department || ""}
                      onChange={(e) => updateFooter("department", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2 lg:col-span-2">
                    <Label>Address</Label>
                    <Input
                      value={(data.footer_content as any)?.address || ""}
                      onChange={(e) => updateFooter("address", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-base font-semibold text-slate-900">
                      Contact links
                    </Label>
                    <p className="mt-1 text-sm text-slate-500">
                      These will be clickable on the footer for Facebook and email.
                    </p>
                  </div>

                  {(((data.footer_content as any)?.contacts || []) as any[]).map(
                    (contact, index) => {
                      const Icon = contactIcons[contact.label];

                      return (
                        <div
                          key={index}
                          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                        >
                          <div className="mb-4 flex items-center gap-2">
                            {Icon ? <Icon className="h-4 w-4 text-blue-600" /> : null}
                            <h4 className="font-medium text-slate-900">
                              {contact.label}
                            </h4>
                          </div>

                          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                            <div className="space-y-2">
                              <Label>Displayed text</Label>
                              <Input
                                placeholder={
                                  contact.label === "Facebook"
                                    ? "BISU Candijay Clinic"
                                    : "clinic@bisu.edu.ph"
                                }
                                value={contact.value || ""}
                                onChange={(e) =>
                                  updateFooterContact(index, "value", e.target.value)
                                }
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>Link / href</Label>
                              <Input
                                placeholder={
                                  contact.label === "Facebook"
                                    ? "https://facebook.com/yourpage"
                                    : "mailto:clinic@bisu.edu.ph"
                                }
                                value={contact.href || ""}
                                onChange={(e) =>
                                  updateFooterContact(index, "href", e.target.value)
                                }
                              />
                            </div>
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>
            </SectionCard>

            <div className="sticky bottom-4 z-10">
              <div className="flex justify-end rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-lg backdrop-blur">
                <Button size="lg" disabled={processing}>
                  {processing ? "Saving..." : "Save Settings"}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}