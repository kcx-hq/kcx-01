import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { motion } from "framer-motion";
import {
  Calendar,
  Clock,
  MapPin,
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  User,
  Mail,
} from "lucide-react";
import toast from "react-hot-toast";
import { DateTime } from "luxon";
import { apiGet, apiPost } from "../../services/http";
import { getApiErrorMessageWithRequestId } from "../../services/apiError";

interface SlotApiItem {
  start: string;
  end: string;
}

interface SlotsByDateResponse {
  slots: SlotApiItem[];
  businessTimezone: string;
}

interface SlotTimeRange {
  start: string;
  end: string;
}

interface InquirySubmitPayload {
  name: string;
  email: string;
  message: string;
  preferred_datetime: string | null;
  timezone: string;
}

export default function SlotBookingPage() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const inquiry = state?.inquiry;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  };

  const slideUpVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  const formItemVariants = {
    hidden: { y: 15, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.4 } },
  };

  // Redirect if inquiry data missing
  useEffect(() => {
    if (!inquiry) navigate("/");
  }, [inquiry, navigate]);

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [slots, setSlots] = useState<SlotTimeRange[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<SlotTimeRange | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  useEffect(() => {
    if (!selectedDate) return;

    async function fetchSlots() {
      setLoadingSlots(true);
      setSelectedSlot(null);

      try {
        const formattedDate = DateTime.fromJSDate(selectedDate).toFormat(
          "yyyy-MM-dd"
        );

        const response = await apiGet<SlotsByDateResponse>("/api/inquiry/slots/by-date", {
          params: {
            date: formattedDate,
            timezone: userTimezone,
          },
        });

        const localSlots = response.slots.map((slot) => ({
          start: DateTime.fromFormat(slot.start, "yyyy-MM-dd HH:mm", {
            zone: response.businessTimezone,
          })
            .setZone(userTimezone)
            .toFormat("HH:mm"),
          end: DateTime.fromFormat(slot.end, "yyyy-MM-dd HH:mm", {
            zone: response.businessTimezone,
          })
            .setZone(userTimezone)
            .toFormat("HH:mm"),
        }));

        setSlots(localSlots);
      } catch (err: unknown) {
        console.error("Failed to fetch slots", err);
        setSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    }

    fetchSlots();
  }, [selectedDate, userTimezone]);

  const handleSubmit = async () => {
    if (!selectedSlot) {
      toast("Please select a slot");
      return;
    }
    if (!selectedDate || !inquiry) {
      return;
    }

    setSubmitting(true);

    try {
      const preferredDateTime = DateTime.fromJSDate(selectedDate)
        .set({
          hour: Number(selectedSlot.start.split(":")[0]),
          minute: Number(selectedSlot.start.split(":")[1]),
          second: 0,
          millisecond: 0,
        })
        .setZone(userTimezone, { keepLocalTime: true });

      const payload: InquirySubmitPayload = {
        name: inquiry.name,
        email: inquiry.email,
        message: inquiry.message,
        preferred_datetime: preferredDateTime.toISO(),
        timezone: userTimezone,
      };

      await apiPost("/api/inquiry/submit", payload);

      toast("Inquiry submitted successfully");
      navigate("/");
    } catch (err: unknown) {
      console.error("Failed to submit inquiry", err);
      toast(getApiErrorMessageWithRequestId(err, "Failed to submit inquiry"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-soft)] text-[var(--text-primary)] px-6 py-12 relative overflow-hidden flex flex-col items-center">
      {/* Background ambience */}
      <motion.div
        aria-hidden
        animate={{ opacity: [0.14, 0.28, 0.14], scale: [1, 1.12, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-24 -right-24 w-[520px] h-[520px] rounded-full blur-[120px] pointer-events-none"
        style={{ backgroundColor: "rgba(35,162,130,0.24)" }}
      />
      <motion.div
        aria-hidden
        animate={{ opacity: [0.08, 0.18, 0.08], scale: [1.1, 1, 1.1] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute -bottom-24 -left-24 w-[640px] h-[640px] rounded-full blur-[140px] pointer-events-none"
        style={{ backgroundColor: "rgba(25,38,48,0.1)" }}
      />

      {/* --- BACK BUTTON --- */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => navigate(-1)}
        className="absolute top-8 left-8 flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-[var(--text-secondary)] shadow-sm transition-all hover:border-[var(--brand-primary)] hover:text-[var(--text-primary)] z-20"
      >
        <ChevronLeft size={20} />
        <span className="text-sm font-medium">Back</span>
      </motion.button>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-2xl w-full relative z-10 mt-10"
      >
        {/* Header */}
        <motion.div variants={slideUpVariants} className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 text-[var(--bg-dark)] text-xs font-bold uppercase tracking-widest mb-6 shadow-sm">
            <Calendar size={12} /> Book Your Audit
          </div>

          <h1 className="text-3xl md:text-5xl font-bold text-[var(--text-primary)] mb-4 leading-tight">
            Finalize Your <span className="text-[var(--brand-primary)]">Slot</span>
          </h1>

          <p className="text-[var(--text-secondary)] text-base md:text-lg max-w-lg mx-auto">
            Choose a time that works best for you. We&apos;ll send a calendar
            invite shortly.
          </p>
        </motion.div>

        {/* Main Card */}
        <motion.div
          variants={slideUpVariants}
          className="bg-white border border-slate-200 rounded-[var(--radius-lg)] shadow-[0_24px_60px_-32px_rgba(15,23,42,0.45)] overflow-hidden"
        >
          {/* Summary Header */}
          {inquiry && (
            <div className="bg-[var(--bg-soft)]/70 border-b border-slate-200 p-6">
              <div className="flex items-center gap-2 text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wide mb-4">
                <CheckCircle2 size={14} className="text-[var(--brand-primary)]" />{" "}
                Inquiry Details
              </div>

              <div className="flex flex-col sm:flex-row gap-4 sm:gap-8">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[var(--text-secondary)] border border-[var(--border-light)] shadow-sm">
                    <User size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] text-[var(--text-disabled)] font-bold uppercase">
                      Name
                    </p>
                    <p className="text-[var(--text-primary)] font-medium">
                      {inquiry.name}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[var(--text-secondary)] border border-[var(--border-light)] shadow-sm">
                    <Mail size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] text-[var(--text-disabled)] font-bold uppercase">
                      Email
                    </p>
                    <p className="text-[var(--text-primary)] font-medium">
                      {inquiry.email}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="p-6 md:p-8 space-y-8">
            {/* 1. Configuration (Date & Timezone) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Date Picker */}
              <motion.div variants={formItemVariants} className="space-y-2">
                <label className="text-[11px] font-semibold text-[var(--text-disabled)] uppercase tracking-wide block">
                  Select Date
                </label>

                <div className="relative">
                  <DatePicker
                    selected={selectedDate}
                    onChange={(date: Date | null) => setSelectedDate(date)}
                    minDate={new Date()}
                    dateFormat="MMMM d, yyyy"
                    className="w-full bg-white border border-[var(--border-light)] rounded-[var(--radius-md)] p-3.5 pl-4 text-[var(--text-primary)] text-sm outline-none transition-colors cursor-pointer shadow-sm focus:border-[var(--brand-primary)] focus:ring-4 focus:ring-[var(--brand-primary)]/20"
                    placeholderText="Choose a date..."
                    wrapperClassName="w-full"
                  />
                  <Calendar
                    className="absolute right-3.5 top-3.5 text-[var(--text-disabled)] pointer-events-none"
                    size={16}
                  />
                </div>
              </motion.div>

              {/* Timezone */}
              <motion.div variants={formItemVariants} className="space-y-2">
                <label className="text-[11px] font-semibold text-[var(--text-disabled)] uppercase tracking-wide block">
                  Your Timezone
                </label>

                <div className="relative">
                  <input
                    disabled
                    value={userTimezone}
                    className="w-full bg-white border border-[var(--border-light)] rounded-[var(--radius-md)] p-3.5 pl-10 text-[var(--text-secondary)] text-sm cursor-not-allowed shadow-sm"
                  />
                  <MapPin
                    className="absolute left-3.5 top-3.5 text-[var(--text-disabled)]"
                    size={16}
                  />
                </div>
              </motion.div>
            </div>

            {/* 2. Slot Selection */}
            <motion.div variants={formItemVariants} className="space-y-4">
              <div className="flex justify-between items-end">
                <label className="text-[11px] font-semibold text-[var(--text-disabled)] uppercase tracking-wide">
                  Available Slots
                </label>

                {selectedDate && (
                  <span className="text-xs font-semibold text-[var(--brand-primary)]">
                    {selectedDate.toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                )}
              </div>

              <div className="min-h-[120px]">
                {loadingSlots && (
                  <div className="flex items-center justify-center h-32 border border-[var(--border-light)] rounded-[var(--radius-md)] bg-white">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--brand-primary)]" />
                  </div>
                )}

                {!loadingSlots && slots.length === 0 && selectedDate && (
                  <div className="flex flex-col items-center justify-center h-32 border border-dashed border-[var(--border-light)] rounded-[var(--radius-md)] bg-white text-center">
                    <Clock className="mb-2 text-[var(--text-disabled)]" size={24} />
                    <p className="text-[var(--text-secondary)] text-sm">
                      No slots available.
                    </p>
                    <p className="text-[var(--text-disabled)] text-xs">
                      Try selecting another date.
                    </p>
                  </div>
                )}

                {!loadingSlots && !selectedDate && (
                  <div className="flex flex-col items-center justify-center h-32 border border-dashed border-[var(--border-light)] rounded-[var(--radius-md)] bg-white text-center">
                    <Calendar className="mb-2 text-[var(--text-disabled)]" size={24} />
                    <p className="text-[var(--text-secondary)] text-sm">
                      Please select a date above
                    </p>
                  </div>
                )}

                {!loadingSlots && slots.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {slots.map((slot: SlotTimeRange, idx: number) => {
                      const isActive = selectedSlot?.start === slot.start;

                      return (
                        <button
                          key={idx}
                          onClick={() => setSelectedSlot(slot)}
                          className={`px-4 py-3 rounded-[var(--radius-md)] border text-sm font-medium transition-colors flex flex-col items-center gap-1 ${
                            isActive
                              ? "bg-[var(--brand-primary)] border-[var(--brand-primary)] text-white shadow-[0_10px_20px_-12px_rgba(35,162,130,0.7)]"
                              : "bg-white border-[var(--border-light)] text-[var(--text-secondary)] hover:border-[var(--brand-primary)] hover:text-[var(--text-primary)]"
                          }`}
                        >
                          <span className="font-bold tracking-wide">
                            {slot.start}
                          </span>
                          <span
                            className={`text-[10px] ${
                              isActive ? "text-white/80" : "text-[var(--text-disabled)]"
                            }`}
                          >
                            - {slot.end}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>

            {/* 3. Action Button */}
            <motion.div
              variants={formItemVariants}
              className="pt-4 border-t border-slate-200"
            >
              <button
                onClick={handleSubmit}
                disabled={!selectedSlot || submitting}
                className={`w-full py-4 rounded-[var(--radius-md)] font-bold flex items-center justify-center gap-3 transition-colors ${
                  !selectedSlot || submitting
                    ? "bg-slate-100 text-[var(--text-disabled)] cursor-not-allowed border border-[var(--border-light)]"
                    : "bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white shadow-[0_18px_30px_-18px_rgba(35,162,130,0.65)]"
                }`}
              >
                {submitting ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5 text-white/80"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    <span>Confirming Booking...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm Booking</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>

      {/* --- CUSTOM CSS FOR DATEPICKER --- */}
      <style>{`
        .react-datepicker {
          background-color: white !important;
          border: 1px solid var(--border-light) !important;
          font-family: inherit !important;
          color: var(--text-primary) !important;
          border-radius: 12px !important;
          overflow: hidden !important;
          box-shadow: 0 22px 48px -30px rgba(15, 23, 42, 0.55) !important;
        }

        .react-datepicker__header {
          background-color: var(--bg-soft) !important;
          border-bottom: 1px solid var(--border-light) !important;
        }

        .react-datepicker__current-month,
        .react-datepicker-time__header,
        .react-datepicker-year-header {
          color: var(--text-primary) !important;
          font-weight: 700 !important;
          font-size: 0.9rem !important;
          padding-bottom: 5px !important;
        }

        .react-datepicker__day-name {
          color: var(--bg-dark) !important;
          font-weight: 700 !important;
        }

        .react-datepicker__day {
          color: var(--text-primary) !important;
          border-radius: 8px !important;
          transition: background-color 0.15s ease, color 0.15s ease !important;
        }

        .react-datepicker__day:hover {
          background-color: var(--bg-main) !important;
          color: var(--text-primary) !important;
        }

        .react-datepicker__day--selected,
        .react-datepicker__day--keyboard-selected {
          background-color: var(--brand-primary) !important;
          color: white !important;
          font-weight: 700 !important;
          box-shadow: 0 8px 16px -10px rgba(35,162,130,0.8) !important;
        }

        .react-datepicker__day--today {
          border: 1px solid var(--brand-primary) !important;
          border-radius: 8px !important;
        }

        .react-datepicker__day--disabled {
          color: var(--text-disabled) !important;
          opacity: 0.6 !important;
        }

        .react-datepicker__navigation-icon::before {
          border-color: var(--text-disabled) !important;
        }

        .react-datepicker__triangle {
          display: none !important;
        }
      `}</style>
    </div>
  );
}
