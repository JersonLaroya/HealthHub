import { Head, useForm } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import { useRef, useLayoutEffect, useState, useEffect } from "react";
import { toast } from "sonner";
import SignaturePad from "signature_pad";
import PhoneInput from "react-phone-input-2";

// shadcn components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface PersonalInfoProps {
  personalInfo: {
    first_name?: string;
    middle_name?: string;
    last_name?: string;
    suffix?: string;
    contact_no?: string;
    birthdate?: string;
    sex?: string;
    homeAddress?: {
      purok?: string;
      barangay?: string;
      barangayCode?: string;
      town?: string;
      municipalityCode?: string;
      province?: string;
      provinceCode?: string;
    };

    presentAddress?: {
      purok?: string;
      barangay?: string;
      barangayCode?: string;
      town?: string;
      municipalityCode?: string;
      province?: string;
      provinceCode?: string;
    };
    guardian?: {
      name?: string;
      contact_no?: string;
    };
    signature?: string;
  } | null;
  breadcrumbs: any;
}

export default function Edit({ personalInfo, breadcrumbs }: PersonalInfoProps) {
  const signatureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const signaturePadRef = useRef<SignaturePad | null>(null);

  const signatureUrl = personalInfo?.signature
    ? personalInfo.signature.startsWith("data:")
      ? personalInfo.signature
      : personalInfo.signature.replace(/^signatures\//, "/storage/signatures/")
    : null;

  const [drawnSignature, setDrawnSignature] = useState<string | null>(signatureUrl);
  const [uploadedSignature, setUploadedSignature] = useState<string | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(signatureUrl);
  const [activeTab, setActiveTab] = useState("draw");
  const hasSelectedSignature = Boolean(signaturePreview);

  const formatDate = (isoString: string | undefined) => {
    if (!isoString) return "";
    return isoString.split("T")[0]; // "2025-12-18"
  };

  const defaultProvince = {
    name: "Bohol",
    code: "071200000",
  };

  const { data, setData, put, processing, errors } = useForm({
    first_name: personalInfo?.first_name || "",
    middle_name: personalInfo?.middle_name || "",
    last_name: personalInfo?.last_name || "",
    suffix: personalInfo?.suffix || "",
    contact_no: personalInfo?.contact_no || "",
    birthdate: formatDate(personalInfo?.birthdate),
    sex: personalInfo?.sex || "",

    home_province_name: personalInfo?.homeAddress?.province || defaultProvince.name,
    home_province_code: personalInfo?.homeAddress?.provinceCode || defaultProvince.code,
    home_municipality_name: personalInfo?.homeAddress?.town || "",
    home_municipality_code: personalInfo?.homeAddress?.municipalityCode || "",
    home_barangay_name: personalInfo?.homeAddress?.barangay || "",
    home_barangay_code: personalInfo?.homeAddress?.barangayCode || "",
    home_purok: personalInfo?.homeAddress?.purok || "",

    present_province_name: personalInfo?.presentAddress?.province || defaultProvince.name,
    present_province_code: personalInfo?.presentAddress?.provinceCode || defaultProvince.code,
    present_municipality_name: personalInfo?.presentAddress?.town || "",
    present_municipality_code: personalInfo?.presentAddress?.municipalityCode || "",
    present_barangay_name: personalInfo?.presentAddress?.barangay || "",
    present_barangay_code: personalInfo?.presentAddress?.barangayCode || "",
    present_purok: personalInfo?.presentAddress?.purok || "",

    guardian_name: personalInfo?.guardian?.name || "",
    guardian_contact_no: personalInfo?.guardian?.contact_no || "",

    signature: personalInfo?.signature || "",
  });
  console.log("Initial form data:", data);

  const [provinces, setProvinces] = useState<any[]>([]);
  const [homeMunicipalities, setHomeMunicipalities] = useState<any[]>([]);
  const [homeBarangays, setHomeBarangays] = useState<any[]>([]);
  const [presentMunicipalities, setPresentMunicipalities] = useState<any[]>([]);
  const [presentBarangays, setPresentBarangays] = useState<any[]>([]);

  // Store selected codes
  const [homeProvinceCode, setHomeProvinceCode] = useState(personalInfo?.homeAddress?.provinceCode || defaultProvince.code);
  const [homeMunicipalityCode, setHomeMunicipalityCode] = useState(personalInfo?.homeAddress?.municipalityCode || "");
  const [presentProvinceCode, setPresentProvinceCode] = useState(personalInfo?.presentAddress?.provinceCode || defaultProvince.code);
  const [presentMunicipalityCode, setPresentMunicipalityCode] = useState(personalInfo?.presentAddress?.municipalityCode || "");

  const isAlreadyComplete = Boolean(
    personalInfo?.first_name &&
    personalInfo?.last_name &&
    personalInfo?.birthdate &&
    personalInfo?.sex &&
    personalInfo?.contact_no &&
    personalInfo?.signature &&
    personalInfo?.homeAddress &&
    personalInfo?.presentAddress
  );

  // Load provinces
  useLayoutEffect(() => {
    fetch("https://psgc.gitlab.io/api/provinces/")
      .then(res => res.json())
      .then(setProvinces);
  }, []);
  
  // Preload home address municipalities & barangays
  useEffect(() => {
    if (!homeProvinceCode) return;

    fetch(`https://psgc.gitlab.io/api/provinces/${homeProvinceCode}/municipalities/`)
      .then(res => res.json())
      .then((municipalities) => {
        setHomeMunicipalities(municipalities);

        if (homeMunicipalityCode) {
          fetch(`https://psgc.gitlab.io/api/municipalities/${homeMunicipalityCode}/barangays/`)
            .then(res => res.json())
            .then(setHomeBarangays);
        }
      });
  }, [homeProvinceCode, homeMunicipalityCode]);

  // Preload present address municipalities & barangays
  useEffect(() => {
    if (!presentProvinceCode) return;

    fetch(`https://psgc.gitlab.io/api/provinces/${presentProvinceCode}/municipalities/`)
      .then(res => res.json())
      .then((municipalities) => {
        setPresentMunicipalities(municipalities);

        if (presentMunicipalityCode) {
          fetch(`https://psgc.gitlab.io/api/municipalities/${presentMunicipalityCode}/barangays/`)
            .then(res => res.json())
            .then(setPresentBarangays);
        }
      });
  }, [presentProvinceCode, presentMunicipalityCode]);

  // Signature pad setup
  useLayoutEffect(() => {
    if (activeTab !== "draw") return;
    const timer = setTimeout(() => {
      const canvas = signatureCanvasRef.current;
      if (!canvas) return;

      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      canvas.width = canvas.offsetWidth * ratio;
      canvas.height = canvas.offsetHeight * ratio;
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.scale(ratio, ratio);

      signaturePadRef.current?.off();
      const signaturePad = new SignaturePad(canvas);
      signaturePadRef.current = signaturePad;

      if (drawnSignature) {
        const img = new Image();
        img.onload = () => {
          signaturePad.clear();
          const scale = Math.min(canvas.width / img.width / ratio, canvas.height / img.height / ratio);
          const x = (canvas.width / ratio - img.width * scale) / 2;
          const y = (canvas.height / ratio - img.height * scale) / 2;
          ctx?.drawImage(img, x, y, img.width * scale, img.height * scale);
        };
        img.src = drawnSignature;
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [activeTab, drawnSignature]);

  const clearSignature = () => {
    signaturePadRef.current?.clear();
    setDrawnSignature(null);
    setUploadedSignature(null);
    setSignaturePreview(null);
    setData("signature", "");
  };

  const handleUploadSignature = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file.");
      return;
    }

    const img = new Image();
    const reader = new FileReader();

    reader.onload = () => {
      img.src = reader.result as string;
    };

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");

      if (!ctx) return;

      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

      let hasTransparency = false;

      // check alpha channel
      for (let i = 3; i < imageData.length; i += 4) {
        if (imageData[i] < 255) {
          hasTransparency = true;
          break;
        }
      }

      if (!hasTransparency) {
        toast.error("Signature must have a transparent background (PNG with transparency).");
        return;
      }

      // ✅ valid transparent image
      const base64 = canvas.toDataURL("image/png");
      setUploadedSignature(base64);
      setSignaturePreview(base64);
      setData("signature", base64);
    };

    reader.readAsDataURL(file);
  };

  useEffect(() => {
    console.log("Form data changed:", data);
  }, [data]);

  const normalizePurok = (value: string) => {
    if (!value) return "";

    let v = value.trim();

    // Remove existing "purok" word (any case)
    v = v.replace(/^purok\s*/i, "");

    // Capitalize and add "Purok "
    return v ? `Purok ${v}` : "";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!hasSelectedSignature) {
      toast.error("Please select or draw a signature before saving.");
      return;
    }

    // normalize purok before sending
    const normalizedHomePurok = normalizePurok(data.home_purok);
    const normalizedPresentPurok = normalizePurok(data.present_purok);

    setData("home_purok", normalizedHomePurok);
    setData("present_purok", normalizedPresentPurok);

    if (signaturePadRef.current && !signaturePadRef.current.isEmpty()) {
      setData("signature", signaturePadRef.current.toDataURL());
    }

    console.log("Submitting personal info:", data);

    put("/user/personal-info", {
      onSuccess: () => {
        toast.success("Personal info updated", {
          description: "Your personal details were saved successfully.",
        });

        window.dispatchEvent(new Event("notifications-updated"));
      },
      onError: () => {
        toast.error("Update failed", {
          description: "Fill up all fields.",
        });
      },
    });
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Personal Info" />
      <div className="p-6 flex justify-center">
        <div className="w-full max-w-3xl space-y-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Personal Information
          </h1>
          <Card className="p-6 bg-white dark:bg-neutral-800 shadow rounded-lg">
            {!isAlreadyComplete && (
              <div className="p-4 rounded-lg border border-blue-300 bg-blue-50 text-blue-800 text-sm">
                ℹ️ This form can only be submitted <strong>once</strong>.  
                Please make sure all information is correct before saving.
              </div>
            )}
            {isAlreadyComplete && (
              <div className="p-4 rounded-lg border border-yellow-400 bg-yellow-50 text-yellow-800 text-sm">
                ⚠️ Your personal information has already been submitted and can no longer be edited.
                If you believe there is a mistake, please contact the clinic administrator.
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4 opacity-90">
              <fieldset disabled={isAlreadyComplete || processing} className="space-y-4">
              {/* Name Fields */}
              <div>
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  value={data.first_name}
                  onChange={(e) => setData("first_name", e.target.value)}
                />
                {errors.first_name && <p className="text-sm text-red-600">{errors.first_name}</p>}
              </div>
              <div>
                <Label htmlFor="middle_name">Middle Name</Label>
                <Input
                  id="middle_name"
                  value={data.middle_name}
                  onChange={(e) => setData("middle_name", e.target.value)}
                  placeholder="Optional"
                />
              </div>
              <div>
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  value={data.last_name}
                  onChange={(e) => setData("last_name", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="suffix">Suffix</Label>
                <Input
                  id="suffix"
                  value={data.suffix}
                  onChange={(e) => setData("suffix", e.target.value)}
                  placeholder="Optional"
                />
              </div>
              {/* Contact Info */}
              <div>
                <Label htmlFor="contact_no">Contact No</Label>

                <PhoneInput
                  country={"ph"}
                  value={data.contact_no}
                  onChange={(value, country) => {
                    // value will be like: 639171234567
                    setData("contact_no", "+" + value);
                  }}
                  inputClass="!w-full !h-10 !text-sm !dark:bg-neutral-800 !dark:text-white"
                  containerClass="!w-full"
                  specialLabel=""
                  placeholder="+63 9XX XXX XXXX"
                />

                {errors.contact_no && (
                  <p className="text-sm text-red-600">{errors.contact_no}</p>
                )}
              </div>
              <div>
                <Label htmlFor="birthdate">Birthdate</Label>
                <Input
                  id="birthdate"
                  type="date"
                  value={data.birthdate}
                  onChange={(e) => setData("birthdate", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="sex">Sex</Label>
                <select
                  id="sex"
                  value={data.sex}
                  onChange={(e) => setData("sex", e.target.value)}
                  className="mt-1 block w-full border rounded p-2 bg-white dark:bg-neutral-700"
                >
                  <option value="">Select Sex</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              {/* Home Address */}
              <h2 className="font-semibold mt-4">Home Address</h2>
              <Label>Province</Label>
              <select
                className="w-full border p-2 rounded"
                value={data.home_province_code}
                onChange={(e) => {
                  const selectedProvince = provinces.find(p => p.code === e.target.value);
                  //setHomeProvinceName(selectedProvince?.code || "");
                  setData("home_province_name", selectedProvince?.name || "");
                  setData("home_province_code", selectedProvince?.code || "");

                  // RESET municipality & barangay
                  setData("home_municipality_name", "");
                  setData("home_municipality_code", "");
                  setData("home_barangay_name", "");
                  setData("home_barangay_code", "");
                  setHomeMunicipalities([]);
                  setHomeBarangays([]);
                  fetch(`https://psgc.gitlab.io/api/provinces/${e.target.value}/municipalities/`)
                    .then(res => res.json())
                    .then(setHomeMunicipalities);
                }}
              >
                <option value="">Select Province</option>
                {provinces.map(p => (
                  <option key={p.code} value={p.code}>{p.name}</option>
                ))}
              </select>
              <Label className="mt-2 block">Municipality</Label>
              <select
                className="w-full border p-2 rounded"
                value={data.home_municipality_code}
                onChange={(e) => {
                  const selectedMunicipality = homeMunicipalities.find(m => m.code === e.target.value);
                  //setHomeMunicipalityName(selectedMunicipality?.code || "");
                  setData("home_municipality_name", selectedMunicipality?.name || "");
                  setData("home_municipality_code", selectedMunicipality?.code || "");
                  if (selectedMunicipality) {
                    fetch(`https://psgc.gitlab.io/api/municipalities/${selectedMunicipality.code}/barangays/`)
                      .then(res => res.json())
                      .then(setHomeBarangays);
                  }
                }}
              >
                <option value="">Select Municipality</option>
                {homeMunicipalities.map(m => (
                  <option key={m.code} value={m.code}>{m.name}</option>
                ))}
              </select>
              
              <Label className="mt-2 block">Barangay</Label>
              <select
                className="w-full border p-2 rounded"
                value={data.home_barangay_code}
                onChange={(e) => {
                  const selectedBarangay = homeBarangays.find(b => b.code === e.target.value);
                  setData("home_barangay_name", selectedBarangay?.name || "");
                  setData("home_barangay_code", selectedBarangay?.code || "");
                }}
              >
                <option value="">Select Barangay</option>
                {homeBarangays.map(b => (
                  <option key={b.code} value={b.code}>{b.name}</option>
                ))}
              </select>

              <Label className="mt-2 block">Purok</Label>
              <Input
                placeholder="ex. Purok 1"
                value={data.home_purok}
                onChange={(e) => setData("home_purok", e.target.value)}
              />


              {/* Present Address */}
              <h2 className="font-semibold mt-4">Present Address</h2>
              <Label>Province</Label>
              <select
                className="w-full border p-2 rounded"
                value={data.present_province_code}
                onChange={(e) => {
                  const selectedProvince = provinces.find(p => p.code === e.target.value);
                  setPresentProvinceCode(selectedProvince?.code || "");
                  setData("present_province_name", selectedProvince?.name || "");
                  setData("present_province_code", selectedProvince?.code || "");

                  // RESET municipality & barangay
                  setData("present_municipality_name", "");
                  setData("present_municipality_code", "");
                  setData("present_barangay_name", "");
                  setData("present_barangay_code", "");
                  setPresentMunicipalities([]);
                  setPresentBarangays([]);
                  fetch(`https://psgc.gitlab.io/api/provinces/${e.target.value}/municipalities/`)
                    .then(res => res.json())
                    .then(setPresentMunicipalities);
                }}
              >
                <option value="">Select Province</option>
                {provinces.map(p => (
                  <option key={p.code} value={p.code}>{p.name}</option>
                ))}
              </select>
              <Label className="mt-2 block">Municipality</Label>
              <select
                className="w-full border p-2 rounded"
                value={data.present_municipality_code}
                onChange={(e) => {
                  const selectedMunicipality = presentMunicipalities.find(m => m.code === e.target.value);
                  //setPresentMunicipalityName(selectedMunicipality?.code || "");
                  setData("present_municipality_name", selectedMunicipality?.name || "");
                  setData("present_municipality_code", selectedMunicipality?.code || "");
                  fetch(`https://psgc.gitlab.io/api/municipalities/${e.target.value}/barangays/`)
                    .then(res => res.json())
                    .then(setPresentBarangays);
                }}
              >
                <option value="">Select Municipality</option>
                {presentMunicipalities.map(m => (
                  <option key={m.code} value={m.code}>{m.name}</option>
                ))}
              </select>
              <Label className="mt-2 block">Barangay</Label>
              <select
                className="w-full border p-2 rounded"
                value={data.present_barangay_code}
                onChange={(e) => {
                  const selectedBarangay = presentBarangays.find(b => b.code === e.target.value);
                  setData("present_barangay_name", selectedBarangay?.name || "");
                  setData("present_barangay_code", selectedBarangay?.code || "");
                }}
              >
                <option value="">Select Barangay</option>
                {presentBarangays.map(b => (
                  <option key={b.code} value={b.code}>{b.name}</option>
                ))}
              </select>

              <Label className="mt-2 block">Purok</Label>
              <Input
                placeholder="ex. Purok 1"
                value={data.present_purok}
                onChange={(e) => setData("present_purok", e.target.value)}
              />


              {/* Guardian */}
              <div>
                <h2 className="font-semibold mt-4 mb-2">Parent/Guardian/Spouse</h2>
                <Input
                  placeholder="Name"
                  value={data.guardian_name}
                  onChange={(e) => setData("guardian_name", e.target.value)}
                  className="mb-2"
                />
                <PhoneInput
                  country={"ph"}
                  value={data.guardian_contact_no}
                  onChange={(value) => setData("guardian_contact_no", "+" + value)}
                  inputClass="!w-full !h-10 !text-sm !dark:bg-neutral-800 !dark:text-white"
                  containerClass="!w-full"
                  specialLabel=""
                  placeholder="+63 9XX XXX XXXX"
                />
              </div>

              {/* Signature */}
              <div>
                <Label>Signature</Label>
                {signaturePreview && activeTab === "" && (
                  <div className="mt-3 border rounded bg-white p-2 flex flex-col items-center gap-2">
                    <img src={signaturePreview} alt="Signature preview" className="max-h-40 object-contain" />
                    <Button type="button" variant="outline" onClick={() => setActiveTab("draw")}>Change</Button>
                  </div>
                )}

                {activeTab !== "" && (
                  <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue="draw" className="mt-3">
                    <TabsList className="w-full mb-2">
                      <TabsTrigger value="draw" className="w-1/2">Draw</TabsTrigger>
                      <TabsTrigger value="upload" className="w-1/2">Upload</TabsTrigger>
                    </TabsList>
                    {activeTab === "draw" && (
                      <TabsContent value="draw" forceMount>
                        <div className="border rounded-md bg-white">
                          <canvas ref={signatureCanvasRef} className="w-full h-40 border" style={{ touchAction: "none" }} />
                        </div>
                        <div className="flex justify-end gap-2 mt-2">
                          <Button type="button" variant="outline" onClick={clearSignature}>Clear</Button>
                          <Button type="button" onClick={() => {
                            if (signaturePadRef.current && !signaturePadRef.current.isEmpty()) {
                              const sig = signaturePadRef.current.toDataURL();
                              setDrawnSignature(sig);
                              setSignaturePreview(sig);
                              setData("signature", sig);
                            }
                            setActiveTab("");
                          }}>Select</Button>
                        </div>
                      </TabsContent>
                    )}
                    {activeTab === "upload" && (
                      <TabsContent value="upload" forceMount>
                        <div className="mb-2 p-3 rounded-md border border-blue-300 bg-blue-50 text-blue-800 text-sm">
                          ℹ️ Please upload a <strong>signature image with transparent background</strong> (preferably PNG).
                          Make sure it is clear and cropped to the signature only.
                        </div>

                        <input
                          type="file"
                          accept="image/png,image/jpeg"
                          onChange={handleUploadSignature}
                          className="mt-2"
                        />

                        <div className="flex justify-end gap-2 mt-2">
                          <Button
                            type="button"
                            onClick={() => {
                              if (uploadedSignature) {
                                setSignaturePreview(uploadedSignature);
                                setData("signature", uploadedSignature);
                              }
                              setActiveTab("");
                            }}
                          >
                            Select
                          </Button>
                        </div>
                      </TabsContent>
                    )}
                  </Tabs>
                )}
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <Button type="submit" disabled={processing || isAlreadyComplete || (!hasSelectedSignature && activeTab !== "")}>
                  {isAlreadyComplete ? "Locked" : processing ? "Saving..." : "Save"}
                </Button>
              </div>
               </fieldset>
            </form>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
