"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Ye line aapke us API ko call kar rahi hai (jo aapne screenshot mein khola tha)
    fetch("/api/products")
      .then((res) => res.json())
      .then(setProducts);
  }, []);

  const handleReserve = async (inventoryId: string) => {
    setLoadingId(inventoryId);
    setError(null);
    
    const res = await fetch("/api/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inventoryId, quantity: 1 }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to reserve");
      setLoadingId(null);
      return;
    }
    // Reservation successful hone ke baad checkout page par le jao
    router.push(`/reservation/${data.id}`);
  };

  return (
    <main className="p-8 max-w-3xl mx-auto font-sans">
      <h1 className="text-4xl font-bold mb-8 tracking-tight">Allo Store</h1>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-md mb-6 font-medium">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {products.map((product) => (
          <div key={product.id} className="border border-gray-200 p-6 rounded-xl shadow-sm bg-white">
            <h2 className="text-xl font-bold mb-4">{product.name}</h2>
            <div className="space-y-3">
              
              {/* Har warehouse ki inventory loop kar rahe hain */}
              {product.inventories.map((inv: any) => {
                const isOutOfStock = inv.availableStock <= 0;
                
                return (
                  <div key={inv.id} className="flex justify-between items-center bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <div>
                      {/* Note: Ab yahan direct inv.warehouse use kar rahe hain */}
                      <p className="font-semibold text-gray-900">{inv.warehouse} Warehouse</p>
                      <p className={`text-sm ${isOutOfStock ? 'text-red-500 font-medium' : 'text-gray-500'}`}>
                        {inv.availableStock} units available
                      </p>
                    </div>
                    <button 
                      disabled={isOutOfStock || loadingId === inv.id}
                      onClick={() => handleReserve(inv.id)}
                      className="bg-black text-white px-5 py-2 rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium text-sm"
                    >
                      {loadingId === inv.id ? "Reserving..." : "Reserve"}
                    </button>
                  </div>
                );
              })}

            </div>
          </div>
        ))}
      </div>
    </main>
  );
}