import React from 'react';
import { Printer, X, ShieldCheck, Award } from 'lucide-react';
import Modal from './Modal';

interface CertificateData {
  id: number;
  establishment_id: number;
  certificate_type: string;
  certificate_number: string;
  issue_date: string;
  expiry_date: string;
  status: string;
  establishments?: {
    business_name: string;
    owner_name?: string;
    address?: string;
    barangay?: string;
    occupancy_type?: string;
  } | null;
}

interface PrintCertificateModalProps {
  certificate: CertificateData | null;
  onClose: () => void;
}

export default function PrintCertificateModal({
  certificate,
  onClose,
}: PrintCertificateModalProps) {
  if (!certificate) return null;

  const est = certificate.establishments;

  function handlePrint() {
    window.print();
  }

  return (
    <Modal
      title="BFP Official Certificate Preview"
      onClose={onClose}
      wide={true}
    >
      <div className="space-y-4">
        {/* Top actions bar */}
        <div className="no-print flex items-center justify-between rounded-xl bg-slate-100 p-3 dark:bg-white/5">
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Form is formatted for standard Letter / A4 paper printout.
          </p>
          <button
            onClick={handlePrint}
            className="btn-primary flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold"
          >
            <Printer size={14} /> Print Certificate
          </button>
        </div>

        {/* Printable Official Document Container */}
        <div className="printable-document rounded-2xl border border-slate-300 bg-white p-8 text-navy-950 shadow-inner dark:border-slate-700 dark:bg-white dark:text-slate-900">
          {/* Header */}
          <div className="text-center border-b-2 border-red-800 pb-4">
            <div className="flex items-center justify-center gap-3 mb-1">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-700 text-white shadow">
                <ShieldCheck size={28} />
              </div>
            </div>
            <p className="text-[11px] uppercase tracking-widest font-semibold text-slate-600">
              Republic of the Philippines
            </p>
            <p className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Department of the Interior and Local Government
            </p>
            <p className="text-lg font-black text-red-700 uppercase tracking-tight font-display">
              Bureau of Fire Protection
            </p>
            <p className="text-xs font-semibold text-slate-700">
              National Capital Region • Quezon City Fire District
            </p>
            <p className="text-[11px] font-medium text-slate-500">
              Culiat Sub-Station / Fire Safety Enforcement Section, Tandang Sora Ave., QC
            </p>
          </div>

          {/* Certificate Title */}
          <div className="my-6 text-center">
            <h2 className="font-display text-xl font-extrabold uppercase tracking-wide text-red-800 underline underline-offset-4">
              {certificate.certificate_type.includes('FSEC')
                ? 'Fire Safety Evaluation Clearance'
                : 'Fire Safety Inspection Certificate'}
            </h2>
            <p className="mt-1 text-xs font-bold text-slate-600 uppercase tracking-wider">
              Control No.: <span className="font-mono text-slate-900">{certificate.certificate_number}</span>
            </p>
          </div>

          {/* Body Content */}
          <div className="space-y-4 text-xs leading-relaxed text-slate-800">
            <p className="font-semibold">TO WHOM IT MAY CONCERN:</p>
            <p className="text-justify indent-6">
              By virtue of the provisions of <strong>Republic Act No. 9514</strong>, otherwise known as the{' '}
              <em>Comprehensive Fire Code of the Philippines of 2008</em> and its Implementing Rules and Regulations,
              this Certificate is hereby granted to:
            </p>

            {/* Establishment Detail Box */}
            <div className="rounded-xl border border-slate-300 bg-slate-50/70 p-4 space-y-1.5">
              <div className="grid grid-cols-3 gap-2">
                <span className="font-bold text-slate-600">Name of Establishment:</span>
                <span className="col-span-2 font-bold text-slate-900 uppercase">
                  {est?.business_name ?? `Establishment #${certificate.establishment_id}`}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="font-bold text-slate-600">Owner / Representative:</span>
                <span className="col-span-2 text-slate-900">{est?.owner_name ?? 'Authorized Signatory'}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="font-bold text-slate-600">Location / Address:</span>
                <span className="col-span-2 text-slate-900">
                  {est?.address ?? 'Brgy. Culiat'}, {est?.barangay ?? 'Quezon City'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="font-bold text-slate-600">Occupancy Type:</span>
                <span className="col-span-2 font-semibold text-slate-900">
                  {est?.occupancy_type ?? 'Commercial / Mercantile'}
                </span>
              </div>
            </div>

            <p className="text-justify indent-6">
              after a satisfactory inspection was conducted on the premises and that the building / structure
              substantially complies with the mandatory fire safety requirements prescribed by law.
            </p>

            <p className="text-justify indent-6">
              Violation of any provision of RA 9514 and its IRR shall be sufficient ground for the immediate suspension,
              revocation, or cancellation of this certificate without prejudice to the imposition of other administrative
              fines and penal sanctions.
            </p>

            {/* Validity metadata */}
            <div className="mt-4 grid grid-cols-2 gap-4 rounded-lg border border-dashed border-slate-300 p-3 text-[11px]">
              <div>
                <p className="text-slate-500 font-medium">Date Issued:</p>
                <p className="font-bold text-slate-900">
                  {new Date(certificate.issue_date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
              <div>
                <p className="text-slate-500 font-medium">Valid Until (Expiry):</p>
                <p className="font-bold text-red-700">
                  {new Date(certificate.expiry_date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Signatures & Seal */}
          <div className="mt-10 grid grid-cols-2 items-end gap-8 pt-6 border-t border-slate-200">
            <div className="text-center">
              <div className="mx-auto mb-1 h-12 w-28 border-b border-slate-400"></div>
              <p className="font-bold text-xs uppercase text-slate-900">SINSP JUAN C. DELA CRUZ, BFP</p>
              <p className="text-[10px] text-slate-500">Chief, Fire Safety Enforcement Section</p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-1 h-12 w-28 border-b border-slate-400"></div>
              <p className="font-bold text-xs uppercase text-slate-900">SUPT ROBERTO M. SANTOS, BFP</p>
              <p className="text-[10px] text-slate-500">City Fire Marshal, QC Fire District</p>
            </div>
          </div>

          {/* Barcode & Security mark */}
          <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-3 text-[10px] text-slate-400">
            <span className="font-mono tracking-widest">VERIFIED-BFP-QC-CULIAT-{certificate.id}</span>
            <span>OFFICIAL DOCUMENT • NOT VALID WITHOUT EMBOSSED SEAL</span>
          </div>
        </div>

        {/* Modal footer close */}
        <div className="no-print flex justify-end">
          <button onClick={onClose} className="btn-outline px-4 py-2 text-xs">
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}
