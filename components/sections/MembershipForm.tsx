"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle, Send, Building2, User, Phone, Mail, MapPin,
  Users, Globe, FileText, Home, Heart, ChevronRight, ChevronLeft,
} from "lucide-react";
import AnimatedSection from "@/components/ui/AnimatedSection";
import { useLocale } from "@/context/LocaleContext";
import { NEPAL_PROVINCES, getDistrictsByProvince } from "@/lib/nepal-geo";

interface FormData {
  venueName: string;
  firmRegNo: string;
  firmType: string;
  location: string;
  capacity: string;
  website: string;
  ownerName: string;
  fatherName: string;
  grandfatherName: string;
  spouseName: string;
  phone: string;
  email: string;
  permWard: string;
  permTole: string;
  permMunicipality: string;
  permDistrict: string;
  permProvince: string;
  tempWard: string;
  tempTole: string;
  tempMunicipality: string;
  tempDistrict: string;
  tempProvince: string;
}

const STEPS = [
  { label: "Venue",   ne: "भेन्यु"  },
  { label: "Owner",   ne: "धनी"     },
  { label: "Address", ne: "ठेगाना"  },
  { label: "Review",  ne: "समीक्षा" },
];

const inputClass =
  "w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent text-sm text-navy-900 placeholder-slate-400 transition-all";

const inputClassNoPad =
  "w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent text-sm text-navy-900 placeholder-slate-400 transition-all appearance-none cursor-pointer";

function FieldLabel({ en, ne, required, optional }: { en: string; ne: string; required?: boolean; optional?: boolean }) {
  return (
    <label className="block mb-1.5">
      <span className="text-xs font-semibold text-navy-800 uppercase tracking-wide">{en}</span>
      <span className="text-xs text-slate-400 ml-1.5 normal-case tracking-normal font-normal">/ {ne}</span>
      {required && <span className="text-amber-500 ml-1">*</span>}
      {optional && <span className="text-slate-400 text-xs font-normal normal-case tracking-normal ml-1">(optional)</span>}
    </label>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-2 py-1.5 border-b border-slate-100 last:border-0">
      <span className="text-xs text-slate-500 flex-shrink-0">{label}</span>
      <span className="text-xs font-medium text-navy-900 text-right">{value}</span>
    </div>
  );
}

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:  (dir: number) => ({ x: dir > 0 ? -40 : 40, opacity: 0 }),
};

export default function MembershipForm({ name = "EVA Nepal" }: { name?: string }) {
  const { t } = useLocale();
  const [step, setStep]         = useState(1);
  const [direction, setDir]     = useState(1);
  const [form, setForm]         = useState<FormData>({
    venueName: "", firmRegNo: "", firmType: "", location: "", capacity: "", website: "",
    ownerName: "", fatherName: "", grandfatherName: "", spouseName: "", phone: "", email: "",
    permWard: "", permTole: "", permMunicipality: "", permDistrict: "", permProvince: "",
    tempWard: "", tempTole: "", tempMunicipality: "", tempDistrict: "", tempProvince: "",
  });
  const [errors,    setErrors]  = useState<Partial<Record<keyof FormData, string>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [submitErr, setSubmitErr] = useState<string | null>(null);

  const set = (key: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((p) => ({ ...p, [key]: e.target.value }));
    setErrors((p) => { const n = { ...p }; delete n[key]; return n; });
  };

  function validate(s: number): boolean {
    const errs: Partial<Record<keyof FormData, string>> = {};
    if (s === 1) {
      if (!form.venueName.trim()) errs.venueName = "Venue name is required.";
      if (!form.location.trim())  errs.location  = "Location is required.";
    }
    if (s === 2) {
      if (!form.ownerName.trim()) errs.ownerName = "Owner name is required.";
      if (!form.phone.trim())     errs.phone     = "Phone number is required.";
      if (!form.email.trim())     errs.email     = "Email is required.";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function goNext() {
    if (!validate(step)) return;
    setDir(1);
    setStep((s) => Math.min(4, s + 1));
  }

  function goBack() {
    setDir(-1);
    setStep((s) => Math.max(1, s - 1));
  }

  const handleSubmit = async () => {
    setLoading(true);
    setSubmitErr(null);
    try {
      const res = await fetch("/api/membership-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json() as { success: boolean; error?: string };
      if (!data.success) throw new Error(data.error ?? "Submission failed");
      setSubmitted(true);
    } catch (err) {
      setSubmitErr(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const permAddr = [form.permWard && `Ward ${form.permWard}`, form.permTole, form.permMunicipality, form.permDistrict, form.permProvince].filter(Boolean).join(", ");
  const tempAddr = [form.tempWard && `Ward ${form.tempWard}`, form.tempTole, form.tempMunicipality, form.tempDistrict, form.tempProvince].filter(Boolean).join(", ");

  return (
    <section id="join" className="section-padding bg-white relative overflow-hidden">
      <div className="absolute inset-0 bg-mesh-light opacity-60" />

      <div className="container-max relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-start">

          {/* Left: Info */}
          <div className="min-w-0">
            <AnimatedSection>
              <span className="section-label">
                <span className="w-8 h-px bg-gold-500" />
                {t.join.label}
              </span>
            </AnimatedSection>
            <AnimatedSection delay={0.1}>
              <h2 className="heading-lg text-navy-900 mt-4 mb-5">{t.join.title}</h2>
            </AnimatedSection>
            <AnimatedSection delay={0.15}>
              <p className="text-body mb-8">{t.join.subtitle}</p>
            </AnimatedSection>

            <div className="space-y-4">
              {[
                { step: "01", title: "Fill the Application / आवेदन भर्नुहोस्", desc: "Complete the membership application form with your firm and personal details." },
                { step: "02", title: "Review Process / समीक्षा प्रक्रिया",      desc: "Our team reviews your application within 3-5 business days." },
                { step: "03", title: `Welcome to ${name.split(" ")[0]} / स्वागत छ`, desc: "Get officially listed in our member directory and start enjoying benefits." },
              ].map((item, i) => (
                <AnimatedSection key={item.step} delay={0.2 + i * 0.1}>
                  <motion.div
                    whileHover={{ x: 4 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    className="flex items-start gap-4 p-4 rounded-xl hover:bg-slate-50 transition-colors group"
                  >
                    <div className="w-11 h-11 rounded-xl bg-navy-900 group-hover:bg-gold-500 flex items-center justify-center text-gold-400 group-hover:text-navy-900 font-bold text-sm flex-shrink-0 transition-all duration-300 font-mono">
                      {item.step}
                    </div>
                    <div>
                      <h4 className="font-semibold text-navy-900 text-sm mb-0.5">{item.title}</h4>
                      <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  </motion.div>
                </AnimatedSection>
              ))}
            </div>
          </div>

          {/* Right: Form */}
          <AnimatedSection direction="up" delay={0.2} className="min-w-0">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-card-md overflow-hidden">
              <AnimatePresence mode="wait">
                {submitted ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-16 px-8"
                  >
                    <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
                      <CheckCircle size={32} className="text-emerald-600" />
                    </div>
                    <h3 className="font-serif font-bold text-navy-900 text-xl mb-3">
                      Application Submitted! / आवेदन पेश भयो!
                    </h3>
                    <p className="text-slate-500 text-sm leading-relaxed">{t.join.success}</p>
                  </motion.div>
                ) : (
                  <motion.div key="form">
                    {/* Progress header */}
                    <div className="px-6 pt-6 pb-4 border-b border-slate-100">
                      <div className="flex items-center justify-between mb-3">
                        {STEPS.map((s, i) => {
                          const n = i + 1;
                          const active = n === step;
                          const done   = n < step;
                          return (
                            <div key={n} className="flex items-center gap-1 flex-1">
                              <div className="flex flex-col items-center flex-shrink-0">
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300
                                  ${done   ? "bg-emerald-500 text-white" :
                                    active ? "bg-navy-900 text-white" :
                                             "bg-slate-100 text-slate-400"}`}>
                                  {done ? <CheckCircle size={14} /> : n}
                                </div>
                                <span className={`text-[10px] mt-1 font-medium leading-tight text-center
                                  ${active ? "text-navy-900" : done ? "text-emerald-600" : "text-slate-400"}`}>
                                  {s.label}
                                  <span className="block text-[9px] font-normal opacity-70">{s.ne}</span>
                                </span>
                              </div>
                              {i < STEPS.length - 1 && (
                                <div className={`h-px flex-1 mx-1 mb-5 transition-all duration-500 ${done ? "bg-emerald-400" : "bg-slate-200"}`} />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Step content */}
                    <div className="relative overflow-hidden">
                      <AnimatePresence initial={false} custom={direction} mode="wait">
                        <motion.div
                          key={step}
                          custom={direction}
                          variants={slideVariants}
                          initial="enter"
                          animate="center"
                          exit="exit"
                          transition={{ duration: 0.22, ease: "easeInOut" }}
                          className="px-6 py-5 space-y-4"
                        >

                          {/* ── STEP 1: Venue / Firm Details ── */}
                          {step === 1 && (
                            <>
                              <div>
                                <p className="text-xs font-bold text-navy-800 uppercase tracking-widest mb-4">
                                  Firm / Venue Details <span className="text-slate-400 font-normal normal-case tracking-normal">/ फर्म / भेन्युको विवरण</span>
                                </p>
                              </div>

                              <div>
                                <FieldLabel en="Venue / Firm Name" ne="फर्म/कम्पनीको नाम" required />
                                <div className="relative">
                                  <Building2 size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                  <input type="text" value={form.venueName} onChange={set("venueName")}
                                    placeholder="e.g. Grand Celebration Hall"
                                    className={`${inputClass} ${errors.venueName ? "border-red-300 focus:ring-red-400" : ""}`} />
                                </div>
                                {errors.venueName && <p className="text-red-500 text-[11px] mt-1">{errors.venueName}</p>}
                              </div>

                              <div className="grid sm:grid-cols-2 gap-4">
                                <div>
                                  <FieldLabel en="Firm Reg. No." ne="फर्म दर्ता नं." optional />
                                  <div className="relative">
                                    <FileText size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input type="text" value={form.firmRegNo} onChange={set("firmRegNo")}
                                      placeholder="e.g. 12345/078-79" className={inputClass} />
                                  </div>
                                </div>
                                <div>
                                  <FieldLabel en="Firm Type" ne="फर्मको किसिम" optional />
                                  <select value={form.firmType} onChange={set("firmType")} className={inputClassNoPad}>
                                    <option value="">Select / छान्नुहोस्</option>
                                    <option value="Individual">Individual / व्यक्तिगत</option>
                                    <option value="Partnership">Partnership / साझेदारी</option>
                                    <option value="Private Limited">Private Limited / प्रा.लि.</option>
                                  </select>
                                </div>
                              </div>

                              <div>
                                <FieldLabel en="Location / Area" ne="ठेगाना / क्षेत्र" required />
                                <div className="relative">
                                  <MapPin size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                  <input type="text" value={form.location} onChange={set("location")}
                                    placeholder="Area, Kathmandu"
                                    className={`${inputClass} ${errors.location ? "border-red-300 focus:ring-red-400" : ""}`} />
                                </div>
                                {errors.location && <p className="text-red-500 text-[11px] mt-1">{errors.location}</p>}
                              </div>

                              <div className="grid sm:grid-cols-2 gap-4">
                                <div>
                                  <FieldLabel en="Capacity" ne="क्षमता" optional />
                                  <div className="relative">
                                    <Users size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input type="number" value={form.capacity} onChange={set("capacity")}
                                      placeholder="e.g. 500" className={inputClass} />
                                  </div>
                                </div>
                                <div>
                                  <FieldLabel en="Website" ne="वेबसाइट" optional />
                                  <div className="relative">
                                    <Globe size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input type="text" value={form.website} onChange={set("website")}
                                      placeholder="yoursite.com" className={inputClass} />
                                  </div>
                                </div>
                              </div>
                            </>
                          )}

                          {/* ── STEP 2: Owner / Personal Details ── */}
                          {step === 2 && (
                            <>
                              <div>
                                <p className="text-xs font-bold text-navy-800 uppercase tracking-widest mb-4">
                                  Owner / Personal Details <span className="text-slate-400 font-normal normal-case tracking-normal">/ फर्मधनी / व्यक्तिगत विवरण</span>
                                </p>
                              </div>

                              <div>
                                <FieldLabel en="Owner / Director Name" ne="फर्मधनी/सञ्चालकको नाम" required />
                                <div className="relative">
                                  <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                  <input type="text" value={form.ownerName} onChange={set("ownerName")}
                                    placeholder="Full name"
                                    className={`${inputClass} ${errors.ownerName ? "border-red-300 focus:ring-red-400" : ""}`} />
                                </div>
                                {errors.ownerName && <p className="text-red-500 text-[11px] mt-1">{errors.ownerName}</p>}
                              </div>

                              <div className="grid sm:grid-cols-2 gap-4">
                                <div>
                                  <FieldLabel en="Father's Name" ne="पिताको नाम" optional />
                                  <div className="relative">
                                    <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input type="text" value={form.fatherName} onChange={set("fatherName")}
                                      placeholder="Father's full name" className={inputClass} />
                                  </div>
                                </div>
                                <div>
                                  <FieldLabel en="Grandfather's Name" ne="बाजेको नाम" optional />
                                  <div className="relative">
                                    <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input type="text" value={form.grandfatherName} onChange={set("grandfatherName")}
                                      placeholder="Grandfather's full name" className={inputClass} />
                                  </div>
                                </div>
                              </div>

                              <div>
                                <FieldLabel en="Spouse Name (Husband / Wife)" ne="पति / पत्नीको नाम" optional />
                                <div className="relative">
                                  <Heart size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                  <input type="text" value={form.spouseName} onChange={set("spouseName")}
                                    placeholder="Spouse's full name" className={inputClass} />
                                </div>
                              </div>

                              <div className="grid sm:grid-cols-2 gap-4">
                                <div>
                                  <FieldLabel en="Phone / Mobile" ne="फोन/मोबाइल नं." required />
                                  <div className="relative">
                                    <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input type="tel" value={form.phone} onChange={set("phone")}
                                      placeholder="98XXXXXXXX"
                                      className={`${inputClass} ${errors.phone ? "border-red-300 focus:ring-red-400" : ""}`} />
                                  </div>
                                  {errors.phone && <p className="text-red-500 text-[11px] mt-1">{errors.phone}</p>}
                                </div>
                                <div>
                                  <FieldLabel en="Email" ne="इमेल" required />
                                  <div className="relative">
                                    <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input type="email" value={form.email} onChange={set("email")}
                                      placeholder="your@email.com"
                                      className={`${inputClass} ${errors.email ? "border-red-300 focus:ring-red-400" : ""}`} />
                                  </div>
                                  {errors.email && <p className="text-red-500 text-[11px] mt-1">{errors.email}</p>}
                                </div>
                              </div>
                            </>
                          )}

                          {/* ── STEP 3: Addresses ── */}
                          {step === 3 && (
                            <>
                              <div>
                                <p className="text-xs font-bold text-navy-800 uppercase tracking-widest mb-1">
                                  Permanent Address <span className="text-slate-400 font-normal normal-case tracking-normal">/ स्थायी ठेगाना</span>
                                </p>
                                <p className="text-[11px] text-slate-400 mb-4">All address fields are optional / सबै ठेगाना फिल्ड वैकल्पिक छन्</p>
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <FieldLabel en="Ward No." ne="वडा नं." optional />
                                  <div className="relative">
                                    <Home size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input type="text" value={form.permWard} onChange={set("permWard")}
                                      placeholder="Ward No." className={inputClass + " pl-9 text-xs"} />
                                  </div>
                                </div>
                                <div>
                                  <FieldLabel en="Tole" ne="टोल" optional />
                                  <div className="relative">
                                    <Home size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input type="text" value={form.permTole} onChange={set("permTole")}
                                      placeholder="Tole name" className={inputClass + " pl-9 text-xs"} />
                                  </div>
                                </div>
                                <div className="col-span-2">
                                  <FieldLabel en="Municipality / VDC" ne="न.पा./गा.वि.स." optional />
                                  <div className="relative">
                                    <Home size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input type="text" value={form.permMunicipality} onChange={set("permMunicipality")}
                                      placeholder="Municipality / VDC" className={inputClass + " pl-9 text-xs"} />
                                  </div>
                                </div>
                                <div>
                                  <FieldLabel en="Province" ne="प्रदेश" optional />
                                  <select value={form.permProvince} onChange={set("permProvince")}
                                    className={inputClassNoPad + " text-xs py-3"}>
                                    <option value="">— Province —</option>
                                    {NEPAL_PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
                                  </select>
                                </div>
                                <div>
                                  <FieldLabel en="District" ne="जिल्ला" optional />
                                  <select value={form.permDistrict} onChange={set("permDistrict")}
                                    className={inputClassNoPad + " text-xs py-3"}>
                                    <option value="">— District —</option>
                                    {getDistrictsByProvince(form.permProvince).map((d) => <option key={d} value={d}>{d}</option>)}
                                  </select>
                                </div>
                              </div>

                              <div className="pt-2">
                                <p className="text-xs font-bold text-navy-800 uppercase tracking-widest mb-3">
                                  Temporary Address <span className="text-slate-400 font-normal normal-case tracking-normal">/ अस्थायी ठेगाना</span>
                                </p>
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <FieldLabel en="Ward No." ne="वडा नं." optional />
                                  <div className="relative">
                                    <Home size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input type="text" value={form.tempWard} onChange={set("tempWard")}
                                      placeholder="Ward No." className={inputClass + " pl-9 text-xs"} />
                                  </div>
                                </div>
                                <div>
                                  <FieldLabel en="Tole" ne="टोल" optional />
                                  <div className="relative">
                                    <Home size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input type="text" value={form.tempTole} onChange={set("tempTole")}
                                      placeholder="Tole name" className={inputClass + " pl-9 text-xs"} />
                                  </div>
                                </div>
                                <div className="col-span-2">
                                  <FieldLabel en="Municipality / VDC" ne="न.पा./गा.वि.स." optional />
                                  <div className="relative">
                                    <Home size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input type="text" value={form.tempMunicipality} onChange={set("tempMunicipality")}
                                      placeholder="Municipality / VDC" className={inputClass + " pl-9 text-xs"} />
                                  </div>
                                </div>
                                <div>
                                  <FieldLabel en="Province" ne="प्रदेश" optional />
                                  <select value={form.tempProvince} onChange={set("tempProvince")}
                                    className={inputClassNoPad + " text-xs py-3"}>
                                    <option value="">— Province —</option>
                                    {NEPAL_PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
                                  </select>
                                </div>
                                <div>
                                  <FieldLabel en="District" ne="जिल्ला" optional />
                                  <select value={form.tempDistrict} onChange={set("tempDistrict")}
                                    className={inputClassNoPad + " text-xs py-3"}>
                                    <option value="">— District —</option>
                                    {getDistrictsByProvince(form.tempProvince).map((d) => <option key={d} value={d}>{d}</option>)}
                                  </select>
                                </div>
                              </div>
                            </>
                          )}

                          {/* ── STEP 4: Review & Submit ── */}
                          {step === 4 && (
                            <>
                              <div>
                                <p className="text-xs font-bold text-navy-800 uppercase tracking-widest mb-4">
                                  Review & Submit <span className="text-slate-400 font-normal normal-case tracking-normal">/ समीक्षा गरी पेश गर्नुहोस्</span>
                                </p>
                              </div>

                              <div className="space-y-4">
                                <div className="bg-slate-50 rounded-xl p-4">
                                  <p className="text-[10px] font-bold text-navy-800 uppercase tracking-widest mb-2">Venue / Firm</p>
                                  <ReviewRow label="Name"      value={form.venueName} />
                                  <ReviewRow label="Reg. No."  value={form.firmRegNo} />
                                  <ReviewRow label="Firm Type" value={form.firmType} />
                                  <ReviewRow label="Location"  value={form.location} />
                                  <ReviewRow label="Capacity"  value={form.capacity} />
                                  <ReviewRow label="Website"   value={form.website} />
                                </div>

                                <div className="bg-slate-50 rounded-xl p-4">
                                  <p className="text-[10px] font-bold text-navy-800 uppercase tracking-widest mb-2">Owner / Personal</p>
                                  <ReviewRow label="Owner"       value={form.ownerName} />
                                  <ReviewRow label="Father"      value={form.fatherName} />
                                  <ReviewRow label="Grandfather" value={form.grandfatherName} />
                                  <ReviewRow label="Spouse"      value={form.spouseName} />
                                  <ReviewRow label="Phone"       value={form.phone} />
                                  <ReviewRow label="Email"       value={form.email} />
                                </div>

                                {(permAddr || tempAddr) && (
                                  <div className="bg-slate-50 rounded-xl p-4">
                                    <p className="text-[10px] font-bold text-navy-800 uppercase tracking-widest mb-2">Addresses</p>
                                    <ReviewRow label="Permanent" value={permAddr} />
                                    <ReviewRow label="Temporary" value={tempAddr} />
                                  </div>
                                )}
                              </div>

                              {submitErr && (
                                <p className="text-red-500 text-xs bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                                  {submitErr}
                                </p>
                              )}

                              <motion.button
                                type="button"
                                onClick={handleSubmit}
                                disabled={loading}
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                className="w-full inline-flex items-center justify-center gap-2 bg-navy-900 hover:bg-navy-800 text-white font-semibold py-4 rounded-xl transition-all duration-200 disabled:opacity-60"
                              >
                                {loading ? (
                                  <>
                                    <motion.div
                                      animate={{ rotate: 360 }}
                                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                      className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white"
                                    />
                                    Submitting... / पेश गर्दै...
                                  </>
                                ) : (
                                  <>
                                    <Send size={16} />
                                    {t.join.submit} / आवेदन पेश गर्नुहोस्
                                  </>
                                )}
                              </motion.button>
                            </>
                          )}

                        </motion.div>
                      </AnimatePresence>
                    </div>

                    {/* Footer nav */}
                    <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={goBack}
                        disabled={step === 1}
                        className="flex items-center gap-1.5 px-4 py-2 text-sm text-slate-500 hover:text-navy-900 hover:bg-white border border-transparent hover:border-slate-200 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft size={15} /> Back
                      </button>

                      <span className="text-xs text-slate-400">{step} / {STEPS.length}</span>

                      {step < 4 ? (
                        <button
                          type="button"
                          onClick={goNext}
                          className="flex items-center gap-1.5 px-5 py-2 text-sm font-semibold bg-navy-900 text-white hover:bg-navy-800 rounded-xl transition-all"
                        >
                          Next <ChevronRight size={15} />
                        </button>
                      ) : (
                        <span />
                      )}
                    </div>

                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
}
