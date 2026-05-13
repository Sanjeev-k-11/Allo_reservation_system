"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";

export default function ReservationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [status, setStatus] = useState<"pending" | "confirmed" | "released" | "expired">("pending");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/reservations/${id}`) 
      .then(res => res.json())
      .then(data => {
         const expires = new Date(data.expiresAt).getTime();
         const now = new Date().getTime();
         setTimeLeft(Math.max(0, Math.floor((expires - now) / 1000)));
      })
      .catch(() => setError("Reservation not found"));
  }, [id]);

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || status !== "pending") return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev && prev <= 1) {
          clearInterval(timer);
          setStatus("expired");
          setError("Your reservation has expired (Error 410).");
          return 0;
        }
        return prev ? prev - 1 : 0;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, status]);

  const handleAction = async (action: "confirm" | "release") => {
    setLoading(true);
    setError(null);

    const res = await fetch(`/api/reservations/${id}/${action}`, { method: "POST" });
    const data = await res.json();

    if (!res.ok) {
      if (res.status === 410) setStatus("expired");
      setError(data.error || `Failed to ${action}`);
    } else {
      setStatus(data.status);
    }
    setLoading(false);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6 font-sans">
      <div className="bg-white max-w-md w-full p-8 rounded-2xl shadow-xl border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Checkout</h1>
        <p className="text-gray-500 mb-8 text-sm">Complete your purchase to secure your item.</p>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg text-sm font-medium mb-6">
            {error}
          </div>
        )}

        {status === "pending" && timeLeft !== null && (
          <div className="text-center mb-8 bg-gray-50 py-6 rounded-xl border border-gray-100">
            <p className="text-sm text-gray-500 font-medium mb-1">Time remaining</p>
            <p className={`text-4xl font-mono font-bold tracking-tight ${timeLeft < 60 ? 'text-red-500' : 'text-gray-900'}`}>
              {formatTime(timeLeft)}
            </p>
          </div>
        )}

        {status === "confirmed" && (
          <div className="text-center py-10">
            <h2 className="text-xl font-bold text-gray-900">Payment Successful!</h2>
            <p className="text-gray-500 mt-2">Your order confirmed.</p>
            <button onClick={() => router.push('/')} className="mt-8 text-sm font-semibold text-black underline">Return to Store</button>
          </div>
        )}

        {status === "released" && (
          <div className="text-center py-10">
            <h2 className="text-xl font-bold text-gray-900">Reservation Cancelled</h2>
            <p className="text-gray-500 mt-2">The item returned to stock.</p>
            <button onClick={() => router.push('/')} className="mt-8 text-sm font-semibold text-black underline">Return to Store</button>
          </div>
        )}

        {status === "expired" && (
          <div className="text-center py-10">
            <h2 className="text-xl font-bold text-gray-900">Time's up</h2>
            <p className="text-gray-500 mt-2">Your reservation expired and the item was released.</p>
            <button onClick={() => router.push('/')} className="mt-8 text-sm font-semibold text-black underline">Return to Store</button>
          </div>
        )}

        {status === "pending" && (
          <div className="space-y-3 mt-4">
            <button
              onClick={() => handleAction("confirm")}
              disabled={loading || timeLeft === 0}
              className="w-full bg-black text-white font-medium py-3 rounded-xl hover:bg-gray-800 disabled:opacity-50 transition-all shadow-sm"
            >
              {loading ? "Processing..." : "Confirm Purchase"}
            </button>
            <button
              onClick={() => handleAction("release")}
              disabled={loading}
              className="w-full bg-white text-gray-700 font-medium py-3 rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-50 transition-all"
            >
              Cancel Reservation
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
