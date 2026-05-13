"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then(setProducts)
      .catch(() => setError("Failed to load products. Make sure your server is running."));
  }, []);

  const handleReserve = async (inventoryId: string) => {
    setLoadingId(inventoryId);
    setError(null);
    
    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inventoryId, quantity: 1 }),
      });

      const data = await res.json();
      
      if (res.ok) { 
        router.push(`/reservation/${data.id}`);
      } else {
        if (res.status === 409) {
          setError("Not enough stock available. Another user might have just reserved the last unit.");
        } else {
          setError(data.error || "Failed to create reservation. Please try again.");
        }
        setLoadingId(null);
      }
    } catch (err) {
      setError("Network error. Please check your connection.");
      setLoadingId(null);
    }
  };

  return (
    <main className="min-h-screen bg-zinc-50 font-sans text-zinc-900 selection:bg-zinc-200">
      <nav className="bg-white border-b border-zinc-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-lg tracking-tight">Allo Health </span>
          </div>
          
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-12">
        
        <header className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
            Inventory Dashboard
          </h1>
          <p className="mt-2 text-zinc-500 text-sm">
            Select a warehouse to reserve physical units. Reservations are held for 10 minutes.
          </p>
        </header>
        {error && (
          <div className="mb-8 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3 shadow-sm">
              <svg className="w-5 h-5 text-rose-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <h3 className="text-sm font-semibold text-rose-800">Reservation Failed</h3>
                <p className="text-sm text-rose-600 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        

        <div className="space-y-8">
          {products.map((product) => (
            <div key={product.id} className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden group hover:shadow-md transition-shadow">
              
              <div className="px-6 py-5 border-b border-zinc-100 bg-zinc-50/50 flex items-center gap-3">
                <h2 className="text-xl font-semibold text-zinc-900">{product.name}</h2>
              </div>
              
              <div className="divide-y divide-zinc-100">
                {product.inventories.map((inv: any) => {
                  const available = inv.availableStock || 0;
                  const isOutOfStock = available <= 0;
                  const isReservingThis = loadingId === inv.id;
                  
                  return (
                    <div key={inv.id} className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-zinc-50/50 transition-colors">
                      
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2 mb-1.5">
                          <p className="font-semibold text-zinc-900">{inv.warehouse}</p>
                        </div>
                        
                        <div className="flex items-center">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium border ${
                            isOutOfStock 
                              ? 'bg-zinc-100 text-zinc-500 border-zinc-200' 
                              : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isOutOfStock ? 'bg-zinc-400' : 'bg-emerald-500 animate-pulse'}`}></span>
                            {isOutOfStock ? "Out of Stock" : `${available} Units Available`}
                          </span>
                        </div>
                      </div>

                      <button 
                        disabled={isOutOfStock || loadingId !== null}
                        onClick={() => handleReserve(inv.id)}
                        className={`relative w-full sm:w-[140px] h-10 flex items-center justify-center rounded-lg text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-900
                          ${isOutOfStock 
                            ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed border border-zinc-200' 
                            : 'bg-zinc-900 text-white hover:bg-zinc-800 active:scale-95 shadow-sm hover:shadow'
                          }
                        `}
                      >
                        {isReservingThis ? (
                          <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : (
                          "Reserve Unit"
                        )}
                      </button>

                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

      </div>
    </main>
  );
}
