import Image from "next/image";
import {
  FaBuilding,
  FaPhone,
  FaEnvelope,
  FaHashtag,
  FaFileAlt,
  FaDollarSign,
} from "react-icons/fa";
import { MdFoodBank } from "react-icons/md";

export const InfoItem = ({ icon, label, value }) => {
  return (
    <div className="flex items-center">
      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <p className="text-sm text-gray-600">{value}</p>
      </div>
    </div>
  );
};

export default function PharmacyInfoCard(props) {
  const {
    storeName,
    address,
    dist,
    pin,
    phone,
    email,
    hospitalCode,
    gstNumber,
    regNumber,
    licenceNumber,
    pan,
    bank,
    branch,
    account,
    ifsc,
    logo,
    language,
    timezone,
    currency,
    currencySymbol,
  } = props;


  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="w-20 h-20 mr-4 relative">
            {/* <Image
              src={logo || "./vercel.svg"}
              alt={`${storeName} logo`}
              width={80}
              height={80}
              className="rounded-full"
            /> */}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{storeName}</h1>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-gray-900">{language}</p>
          <p className="text-sm text-gray-600">{timezone}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <InfoItem icon={<FaBuilding className="w-5 h-5" />} label="Address" value={address} />
          <InfoItem icon={<FaBuilding className="w-5 h-5" />} label="District" value={dist} />
          <InfoItem icon={<FaBuilding className="w-5 h-5" />} label="Pin" value={pin} />
          <InfoItem icon={<FaPhone className="w-5 h-5" />} label="Phone" value={phone} />
          <InfoItem icon={<FaEnvelope className="w-5 h-5" />} label="Email" value={email} />
          <InfoItem icon={<FaHashtag className="w-5 h-5" />} label="Store Code" value={hospitalCode} />
        </div>
        <div className="space-y-3">
          <InfoItem icon={<FaFileAlt className="w-5 h-5" />} label="GST Number" value={gstNumber} />
          <InfoItem icon={<FaFileAlt className="w-5 h-5" />} label="Registration Number" value={regNumber} />
          <InfoItem icon={<FaFileAlt className="w-5 h-5" />} label="Drug Licence Number" value={licenceNumber} />
          <InfoItem icon={<FaFileAlt className="w-5 h-5" />} label="Pan Number" value={pan} />
          <InfoItem icon={<FaDollarSign className="w-5 h-5" />} label="Currency" value={`${currency} (${currencySymbol})`} />
        </div>
        <div className="space-y-3">
          <InfoItem icon={<MdFoodBank className="w-5 h-5" />} label="Bank Account" value={bank} />
          <InfoItem icon={<MdFoodBank className="w-5 h-5" />} label="Branch" value={branch} />
          <InfoItem icon={<MdFoodBank className="w-5 h-5" />} label="Account" value={account} />
          <InfoItem icon={<MdFoodBank className="w-5 h-5" />} label="IFS Code" value={ifsc} />
        </div>
      </div>
    </div>
  );
}
