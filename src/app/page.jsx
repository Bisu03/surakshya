"use client"

import { HOSPITAL, HOSPITAL_ADDRESS } from "@/lib/hospitalBrand";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  const { data: session } = useSession();

  return (
    <>
      <div className="w-full min-h-screen flex items-center justify-center bg-slate-50 p-4 sm:p-6">
        <div className="w-full max-w-xs sm:max-w-sm md:max-w-2xl lg:max-w-6xl p-6 sm:p-8 bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100">
          {/* Hospital Header */}
          <header className="flex flex-col md:flex-row items-center gap-4 sm:gap-6 mb-8 sm:mb-12">
            <Image
              height={200}
              width={200}
              src={HOSPITAL.logo}
              alt={`${HOSPITAL.name} logo`}
              priority
              className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 object-contain"
            />
            <div className="text-center md:text-left">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-1 sm:mb-2">
                {HOSPITAL.name}
              </h1>
              <p className="text-sm sm:text-base md:text-lg text-gray-600">
                {HOSPITAL_ADDRESS}
              </p>
            </div>
          </header>

          {/* Main Information Grid */}
          <div className="flex w-full justify-between flex-wrap md:flex-nowrap">
            <InfoCard title="Contact Information">
              <InfoItem icon="📞" label="Phone" value={HOSPITAL.phone} />
              <InfoItem icon="📱" label="Mobile" value={HOSPITAL.mobile} />
              <InfoItem icon="📧" label="Email" value={HOSPITAL.email} />
            </InfoCard>
          </div>

          {/* CTA Section */}
          <div className="text-center border-t border-gray-100 pt-6 sm:pt-8">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4">
              Patient Portal Access
            </h3>
            {session?.user ? <Link
              href="/dashboard/menu"
              className="inline-flex items-center gap-2 w-full sm:w-auto justify-center px-4 sm:px-8 py-3 sm:py-4 
            bg-blue-600 hover:bg-blue-700 text-white rounded-lg sm:rounded-xl transition-all 
            transform hover:scale-[1.02] active:scale-95 shadow-sm sm:shadow-lg hover:shadow-blue-200 
            text-sm sm:text-base"
            >
              <span>Go to Patient Dashboard</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
              </svg>
            </Link> : <Link
              href="/signin"
              className="inline-flex items-center gap-2 w-full sm:w-auto justify-center px-4 sm:px-8 py-3 sm:py-4 
            bg-blue-600 hover:bg-blue-700 text-white rounded-lg sm:rounded-xl transition-all 
            transform hover:scale-[1.02] active:scale-95 shadow-sm sm:shadow-lg hover:shadow-blue-200 
            text-sm sm:text-base"
            >
              <span>Login to Patient Portal</span>
            </Link>
            }
          </div>
        </div>
      </div>
    </>
  );
}

const InfoCard = ({ title, children }) => (
  <div className="bg-gray-50 p-4 sm:p-6 rounded-lg sm:rounded-xl border border-gray-200 w-full">
    <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
      <span className="bg-blue-100 text-blue-600 p-1.5 sm:p-2 rounded-md sm:rounded-lg">{title[0]}</span>
      {title.slice(1)}
    </h2>
    <div className="space-y-3 sm:space-y-4">{children}</div>
  </div>
);

const InfoItem = ({ icon, label, value }) => (
  <div className="flex items-start gap-2 sm:gap-3">
    <span className="text-xl sm:text-2xl mt-0.5">{icon}</span>
    <div>
      <dt className="text-xs sm:text-sm font-medium text-gray-500">{label}</dt>
      <dd className="text-gray-900 font-medium text-sm sm:text-base">{value || 'N/A'}</dd>
    </div>
  </div>
);