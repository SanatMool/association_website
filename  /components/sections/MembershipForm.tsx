"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Send, Building2, User, Phone, Mail, MapPin, Users, Globe } from "lucide-react";
import AnimatedSection from "@/components/ui/AnimatedSection";
import { useLocale } from "@/context/LocaleContext";

interface FormData {
  venueName: string;
  ownerName: string;
  phone: string;
  email: string;
  location: string;
  capacity: string;
  website: string;
}

export default function MembershipForm() {
  const { t } = useLocale();
  const [form, setForm] = useState<FormData>({
    venueName: "",
    ownerName: "",
    phone: "",
    email: "",
    location: "",
    capacity: "",
    website: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);
    setSubmitted(true);
  };

  const fields = [
    {
      key: "venueName" as const,
      label: t.join.venue_name,
      icon: Building2,
      type: "text",
      placeholder: "e.g. Grand Celebration Hall",
      required: true,
    },
    {
      key: "ownerName" as const,
      label: t.join.owner_name,
      icon: User,
      type: "text",
      placeholder: "Full name",
      required: true,
    },
    {
      key: "phone" as const,
      label: t.join.phone,
      icon: Phone,
      type: "tel",
      placeholder: "98XXXXXXXX",
      required: true,
    },
    {
      key: "email" as const,
      label: t.join.email,
      icon: Mail,
      type: "email",
      placeholder: "your@email.com",
      required: true,
    },
    {
      key: "location" as const,
      label: t.join.location,
      icon: MapPin,
      type: "text",
      placeholder: "Area, Kathmandu",
      required: true,
    },
    {
      key: "capacity" as const,
      label: t.join.capacity,
      icon: Users,
      type: "number",
      placeholder: "e.g. 500",
      required: true,
    },
    {
      key: "website" as const,
      label: t.join.website,
      icon: Globe,
      type: "url",
      placeholder: "yourwebsite.com",
      required: false,
    },
  ];

  return (
    <section id="join" className="section-padding bg-white relative overflow-hidden">
      {/* Subtle background */}
      <div className="absolute inset-0 bg-mesh-light opacity-60" />

      <div className="container-max relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Left: Info */}
          <div>
            <AnimatedSection>
              <span className="section-label">
                <span className="w-8 h-px bg-gold-500" />
                {t.join.label}
              </span>
            </AnimatedSection>
            <AnimatedSection delay={0.1}>
              <h2 className="heading-lg text-navy-900 mt-4 mb-5">
                {t.join.title}
              </h2>
            </AnimatedSection>
            <AnimatedSection delay={0.15}>
              <p className="text-body mb-8">{t.join.subtitle}</p>
            </AnimatedSection>

            {/* Steps */}
            <div className="space-y-4">
              {[
                { step: "01", title: "Fill the Application", desc: "Complete the membership application form with your venue details." },
                { step: "02", title: "Review Process", desc: "Our team reviews your application within 3-5 business days." },
                { step: "03", title: "Welcome to EVA", desc: "Get officially listed in our member directory and start enjoying benefits." },
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
          <AnimatedSection direction="left" delay={0.2}>
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-card-md">
              <AnimatePresence mode="wait">
                {submitted ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-12"
                  >
                    <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
                      <CheckCircle size={32} className="text-emerald-600" />
                    </div>
                    <h3 className="font-serif font-bold text-navy-900 text-xl mb-3">
                      Application Submitted!
                    </h3>
                    <p className="text-slate-500 text-sm leading-relaxed">
                      {t.join.success}
                    </p>
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    onSubmit={handleSubmit}
                    className="space-y-4"
                  >
                    <div className="grid sm:grid-cols-2 gap-4">
                      {fields.slice(0, 2).map((field) => {
                        const Icon = field.icon;
                        return (
                          <div key={field.key}>
                            <label className="block text-xs font-semibold text-navy-800 mb-1.5 uppercase tracking-wide">
                              {field.label}
                              {field.required && (
                                <span className="text-gold-500 ml-1">*</span>
                              )}
                            </label>
                            <div className="relative">
                              <Icon
                                size={15}
                                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                              />
                              <input
                                type={field.type}
                                value={form[field.key]}
                                onChange={(e) =>
                                  setForm((p) => ({
                                    ...p,
                                    [field.key]: e.target.value,
                                  }))
                                }
                                placeholder={field.placeholder}
                                required={field.required}
                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent text-sm text-navy-900 placeholder-slate-400 transition-all"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {fields.slice(2, 6).map((field) => {
                      const Icon = field.icon;
                      return (
                        <div key={field.key}>
                          <label className="block text-xs font-semibold text-navy-800 mb-1.5 uppercase tracking-wide">
                            {field.label}
                            {field.required && (
                              <span className="text-gold-500 ml-1">*</span>
                            )}
                          </label>
                          <div className="relative">
                            <Icon
                              size={15}
                              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                            />
                            <input
                              type={field.type}
                              value={form[field.key]}
                              onChange={(e) =>
                                setForm((p) => ({
                                  ...p,
                                  [field.key]: e.target.value,
                                }))
                              }
                              placeholder={field.placeholder}
                              required={field.required}
                              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent text-sm text-navy-900 placeholder-slate-400 transition-all"
                            />
                          </div>
                        </div>
                      );
                    })}

                    {/* Website field */}
                    <div>
                      <label className="block text-xs font-semibold text-navy-800 mb-1.5 uppercase tracking-wide">
                        {fields[6].label}
                        <span className="text-slate-400 font-normal normal-case tracking-normal ml-1">
                          (optional)
                        </span>
                      </label>
                      <div className="relative">
                        <Globe
                          size={15}
                          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <input
                          type="url"
                          value={form.website}
                          onChange={(e) =>
                            setForm((p) => ({ ...p, website: e.target.value }))
                          }
                          placeholder={fields[6].placeholder}
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent text-sm text-navy-900 placeholder-slate-400 transition-all"
                        />
                      </div>
                    </div>

                    <motion.button
                      type="submit"
                      disabled={loading}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className="w-full inline-flex items-center justify-center gap-2 bg-navy-900 hover:bg-navy-800 text-white font-semibold py-4 rounded-xl transition-all duration-200 mt-2 disabled:opacity-60"
                    >
                      {loading ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{
                              duration: 1,
                              repeat: Infinity,
                              ease: "linear",
                            }}
                            className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white"
                          />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send size={16} />
                          {t.join.submit}
                        </>
                      )}
                    </motion.button>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
}
