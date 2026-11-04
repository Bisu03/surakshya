import Image from "next/image";
import { HOSPITAL, HOSPITAL_CONTACT } from "@/lib/hospitalBrand";

// Letterhead shared by every printed receipt, bill and report: logo on the
// left, the nursing home's fixed name, address and contact numbers centred.
export default function HospitalHeader({ className = "" }) {
  return (
    <header
      className={`flex items-center gap-4 border-b-2 border-black px-6 py-2 ${className}`}
    >
      <Image
        src={HOSPITAL.logo}
        alt={`${HOSPITAL.name} logo`}
        width={88}
        height={88}
        priority
        className="h-[88px] w-[88px] shrink-0 object-contain"
      />
      <div className="flex-1 text-center leading-tight">
        <h1 className="font-serif text-3xl font-bold tracking-wide text-blue-900">
          {HOSPITAL.name}
        </h1>
        <p className="mt-1 text-sm font-semibold text-blue-900">
          {HOSPITAL.places.join(" ★ ")} ★ PIN - {HOSPITAL.pin}
        </p>
        <p className="text-sm text-gray-800">{HOSPITAL_CONTACT}</p>
        <p className="text-xs text-gray-700">Email : {HOSPITAL.email}</p>
      </div>
      {/* Balances the logo so the name stays centred on the page. */}
      <div className="w-[88px] shrink-0" aria-hidden="true" />
    </header>
  );
}
