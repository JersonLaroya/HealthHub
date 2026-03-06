import { usePage } from "@inertiajs/react";
import { Mail, Facebook } from "lucide-react";

const contactIcons: Record<string, any> = {
  Facebook,
  Email: Mail,
};

export default function GuestFooter() {
  const { system } = usePage().props as any;

  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <h3 className="text-lg font-semibold text-white">
              {system?.footer_content?.campus_name || "BISU Candijay Campus"}
            </h3>
            <p className="mt-2 text-sm text-slate-400">
              {system?.footer_content?.department || "University Health Services"}
            </p>
            {system?.footer_content?.address && (
              <p className="mt-3 text-sm text-slate-400">
                {system.footer_content.address}
              </p>
            )}
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white">
              System
            </h4>
            <p className="text-sm">{system?.app_name || "HealthHub"}</p>
            <p className="mt-1 text-sm text-slate-400">
              School Year: {system?.school_year || "—"}
            </p>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white">
              Contacts
            </h4>

            <div className="space-y-3">
              {system?.footer_content?.contacts?.map((contact: any, i: number) => {
                const Icon = contactIcons[contact.label];

                return contact.href ? (
                  <a
                    key={i}
                    href={contact.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center">
                      {Icon ? (
                        <Icon className={contact.label === "Facebook" ? "h-5 w-5" : "h-4 w-4"} />
                      ) : null}
                    </span>
                    <span>{contact.value}</span>
                  </a>
                ) : (
                  <div
                    key={i}
                    className="flex items-center gap-2 text-sm text-slate-400"
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center">
                      {Icon ? (
                        <Icon className={contact.label === "Facebook" ? "h-5 w-5" : "h-4 w-4"} />
                      ) : null}
                    </span>
                    <span>{contact.value}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white">
              Information
            </h4>
            <p className="text-sm">
              © {new Date().getFullYear()} BISU Candijay Campus
            </p>
            <p className="mt-1 text-sm text-slate-400">
              All rights reserved.
            </p>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6">
          <h4 className="text-sm font-semibold text-white">
            Guidelines on Data Collection & Privacy
          </h4>
          <p className="mt-2 text-sm leading-7 text-slate-400">
            HealthHub collects and processes personal health information solely
            for clinic consultation, medical documentation, and healthcare
            service delivery at BISU Candijay Campus. All submitted data is
            handled confidentially and accessed only by authorized clinic
            personnel. By using this system, users acknowledge and consent to
            the collection and processing of their information in accordance
            with institutional health service policies.
          </p>
        </div>

        {/* BOTTOM COPYRIGHT BAR */}
        <div className="border-t border-white/10 mt-10 pt-6 text-center">
            <p className="text-sm text-slate-400">
                © {new Date().getFullYear()} BISU Candijay Campus
            </p>
            <p className="text-sm text-slate-500">
                All rights reserved.
            </p>
        </div>
      </div>
    </footer>
  );
}