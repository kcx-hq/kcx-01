import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { motion, AnimatePresence } from "framer-motion";
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

const API_URL = import.meta.env.VITE_API_URL;

export default function SlotBookingPage() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const inquiry = state?.inquiry;

  // Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
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
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.4 },
    },
  };

  // Redirect if inquiry data missing
  useEffect(() => {
    if (!inquiry) navigate("/");
  }, [inquiry, navigate]);

  const [selectedDate, setSelectedDate] = useState(null);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Detect user timezone automatically
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Fetch slots when date changes
  useEffect(() => {
    if (!selectedDate) return;

    async function fetchSlots() {
      setLoadingSlots(true);
      setSelectedSlot(null);

      try {
        // Format selectedDate as YYYY-MM-DD
        const formattedDate =
          DateTime.fromJSDate(selectedDate).toFormat("yyyy-MM-dd");

        const res = await axios.get(
          `${API_URL}/inquiry/slots/by-date?date=${formattedDate}&timezone=${userTimezone}`
        );

        // Convert returned slots from business timezone → user local timezone
        const localSlots = res.data.slots.map((slot) => {
          return {
            start: DateTime.fromFormat(slot.start, "yyyy-MM-dd HH:mm", {
              zone: res.data.businessTimezone,
            })
              .setZone(userTimezone)
              .toFormat("HH:mm"),
            end: DateTime.fromFormat(slot.end, "yyyy-MM-dd HH:mm", {
              zone: res.data.businessTimezone,
            })
              .setZone(userTimezone)
              .toFormat("HH:mm"),
          };
        });

        setSlots(localSlots);
      } catch (err) {
        console.error("Failed to fetch slots", err);
        setSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    }

    fetchSlots();
  }, [selectedDate, userTimezone]);

  // Submit inquiry
  const handleSubmit = async () => {
    if (!selectedSlot) {
      alert("Please select a slot");
      return;
    }

    setSubmitting(true);

    try {
      // Build datetime in USER timezone (NO UTC conversion here)
      const preferredDateTime = DateTime.fromJSDate(selectedDate)
        .set({
          hour: Number(selectedSlot.start.split(":")[0]),
          minute: Number(selectedSlot.start.split(":")[1]),
          second: 0,
          millisecond: 0,
        })
        .setZone(userTimezone, { keepLocalTime: true });

        
      const payload = {
        name: inquiry.name,
        email: inquiry.email,
        message: inquiry.message,
        preferred_datetime: preferredDateTime.toISO(),
        timezone: userTimezone,
      };

      await axios.post(`${API_URL}/inquiry/submit`, payload);

      toast("Inquiry submitted successfully");
      navigate("/");
    } catch (err) {
      console.error("Failed to submit inquiry", err);
      toast("Failed to submit inquiry");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f11] text-white px-6 py-12 relative overflow-hidden flex flex-col items-center">
      {/* --- BACKGROUND EFFECTS --- */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#8B2FC9]/10 rounded-full blur-[120px] pointer-events-none"
      />
      <motion.div
        animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.3, 0.1] }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
        className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"
      />

      {/* --- BACK BUTTON --- */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => navigate(-1)}
        className="absolute top-8 left-8 text-gray-400 hover:text-white flex items-center gap-2 transition-colors z-20 group"
      >
        <ChevronLeft
          size={20}
          className="group-hover:-translate-x-1 transition-transform"
        />
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#8B2FC9]/10 border border-[#8B2FC9]/20 text-[#8B2FC9] text-xs font-bold uppercase tracking-widest mb-6 shadow-[0_0_15px_rgba(139,47,201,0.2)]">
            <Calendar size={12} /> Book Your Audit
          </div>

          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight">
            Finalize Your{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8B2FC9] to-blue-500">
              Slot
            </span>
          </h1>
          <p className="text-gray-400 text-base md:text-lg max-w-lg mx-auto">
            Choose a time that works best for you. We'll send a calendar invite
            shortly.
          </p>
        </motion.div>

        {/* Main Card */}
        <motion.div
          variants={slideUpVariants}
          className="bg-[#121214] border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
        >
          {/* Summary Header */}
          {inquiry && (
            <div className="bg-white/[0.02] border-b border-white/5 p-6">
              <div className="flex items-center gap-2 text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">
                <CheckCircle2 size={14} className="text-[#8B2FC9]" /> Inquiry
                Details
              </div>
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-8">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400">
                    <User size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase">
                      Name
                    </p>
                    <p className="text-white font-medium">{inquiry.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400">
                    <Mail size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase">
                      Email
                    </p>
                    <p className="text-white font-medium">{inquiry.email}</p>
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
                <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide block">
                  Select Date
                </label>
                <div className="relative">
                  <DatePicker
                    selected={selectedDate}
                    onChange={(date) => setSelectedDate(date)}
                    minDate={new Date()}
                    dateFormat="MMMM d, yyyy"
                    className="w-full bg-[#1a1b20] border border-white/10 rounded-xl p-3.5 pl-4 text-white text-sm focus:border-[#8B2FC9] focus:ring-1 focus:ring-[#8B2FC9] outline-none transition-all cursor-pointer"
                    placeholderText="Choose a date..."
                    wrapperClassName="w-full"
                  />
                  <Calendar
                    className="absolute right-3.5 top-3.5 text-gray-500 pointer-events-none"
                    size={16}
                  />
                </div>
              </motion.div>

              {/* Timezone */}
              <motion.div variants={formItemVariants} className="space-y-2">
                <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide block">
                  Your Timezone
                </label>
                <div className="relative">
                  <input
                    disabled
                    value={userTimezone}
                    className="w-full bg-[#1a1b20]/50 border border-white/10 rounded-xl p-3.5 pl-10 text-gray-400 text-sm cursor-not-allowed"
                  />
                  <MapPin
                    className="absolute left-3.5 top-3.5 text-gray-600"
                    size={16}
                  />
                </div>
              </motion.div>
            </div>

            {/* 2. Slot Selection */}
            <motion.div variants={formItemVariants} className="space-y-4">
              <div className="flex justify-between items-end">
                <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                  Available Slots
                </label>
                {selectedDate && (
                  <span className="text-xs font-medium text-[#8B2FC9]">
                    {selectedDate.toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                )}
              </div>

              {/* Slots Container */}
              <div className="min-h-[120px]">
                {loadingSlots && (
                  <div className="flex items-center justify-center h-32 border border-white/5 rounded-xl bg-white/[0.02]">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#8B2FC9]"></div>
                  </div>
                )}

                {!loadingSlots && slots.length === 0 && selectedDate && (
                  <div className="flex flex-col items-center justify-center h-32 border border-dashed border-white/10 rounded-xl bg-white/[0.01] text-center">
                    <Clock className="mb-2 text-gray-600" size={24} />
                    <p className="text-gray-400 text-sm">No slots available.</p>
                    <p className="text-gray-600 text-xs">
                      Try selecting another date.
                    </p>
                  </div>
                )}

                {!loadingSlots && !selectedDate && (
                  <div className="flex flex-col items-center justify-center h-32 border border-dashed border-white/10 rounded-xl bg-white/[0.01] text-center">
                    <Calendar className="mb-2 text-gray-600" size={24} />
                    <p className="text-gray-400 text-sm">
                      Please select a date above
                    </p>
                  </div>
                )}

                {!loadingSlots && slots.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {slots.map((slot, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedSlot(slot)}
                        className={`
                            relative px-4 py-3 rounded-xl border text-sm font-medium transition-all duration-200 flex flex-col items-center gap-1 group
                            ${
                              selectedSlot?.start === slot.start
                                ? "bg-[#8B2FC9] border-[#8B2FC9] text-white shadow-[0_0_15px_rgba(139,47,201,0.4)]"
                                : "bg-[#1a1b20] border-white/10 text-gray-400 hover:border-[#8B2FC9]/50 hover:text-white"
                            }
                          `}
                      >
                        <span className="font-bold tracking-wide">
                          {slot.start}
                        </span>
                        <span
                          className={`text-[10px] ${
                            selectedSlot?.start === slot.start
                              ? "text-white/80"
                              : "text-gray-600 group-hover:text-gray-500"
                          }`}
                        >
                          - {slot.end}
                        </span>

                        {selectedSlot?.start === slot.start && (
                          <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-white rounded-full shadow-sm animate-pulse" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>

            {/* 3. Action Button */}
            <motion.div
              variants={formItemVariants}
              className="pt-4 border-t border-white/10"
            >
              <button
                onClick={handleSubmit}
                disabled={!selectedSlot || submitting}
                className={`
                    w-full py-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-all duration-300 shadow-lg
                    ${
                      !selectedSlot || submitting
                        ? "bg-white/5 text-gray-500 cursor-not-allowed border border-white/5"
                        : "bg-[#8B2FC9] hover:bg-[#7e22ce] text-white shadow-[#8B2FC9]/20 hover:shadow-[#8B2FC9]/40 hover:-translate-y-0.5"
                    }
                `}
              >
                {submitting ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5 text-white/50"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      ></path>
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

      {/* --- CUSTOM CSS FOR DATEPICKER DARK THEME --- */}
      <style>{`
        .react-datepicker {
          background-color: #1a1b20 !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          font-family: inherit !important;
          color: #fff !important;
          border-radius: 12px !important;
          overflow: hidden !important;
          box-shadow: 0 10px 40px -10px rgba(0,0,0,0.5) !important;
        }
        .react-datepicker__header {
          background-color: #121214 !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
        }
        .react-datepicker__current-month, .react-datepicker-time__header, .react-datepicker-year-header {
          color: #fff !important;
          font-weight: 700 !important;
          font-size: 0.9rem !important;
          padding-bottom: 5px !important;
        }
        .react-datepicker__day-name {
          color: #8B2FC9 !important;
          font-weight: 700 !important;
        }
        .react-datepicker__day {
          color: #d1d5db !important;
          border-radius: 8px !important;
          transition: all 0.2s !important;
        }
        .react-datepicker__day:hover {
          background-color: rgba(139, 47, 201, 0.2) !important;
          color: white !important;
        }
        .react-datepicker__day--selected, .react-datepicker__day--keyboard-selected {
          background-color: #8B2FC9 !important;
          color: white !important;
          font-weight: bold !important;
          box-shadow: 0 0 10px rgba(139, 47, 201, 0.4) !important;
        }
        .react-datepicker__day--disabled {
          color: #4b5563 !important;
          opacity: 0.5 !important;
        }
        .react-datepicker__navigation-icon::before {
          border-color: #6b7280 !important;
        }
        .react-datepicker__triangle {
            display: none !important;
        }
      `}</style>
    </div>
  );
}
