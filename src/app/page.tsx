import Link from "next/link";

// This tells Next.js not to cache this page so we always see live stock
export const dynamic = "force-dynamic";

export default async function Home() {
  // Fetch products from our new API
  const res = await fetch("http://localhost:3000/api/products", {
    cache: "no-store",
  });
  
  if (!res.ok) return <div className="p-8 text-red-500">Failed to load products. Make sure 'npm run dev' is running.</div>;
  
  const products = await res.json();

  return (
    <main className="p-8 max-w-3xl mx-auto font-sans">
      <h1 className="text-3xl font-bold mb-8">Allo Store</h1>
      
      <div className="space-y-6">
        {products.map((product: any) => (
          <div key={product.id} className="border border-gray-200 p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-bold mb-4">{product.name}</h2>
            
            <div className="space-y-3">
              {product.inventories.map((inv: any) => {
                // Calculate available stock
                const availableStock = inv.totalUnits - inv.reservedUnits;
                
                return (
                  <div key={inv.id} className="flex justify-between items-center bg-gray-50 p-4 rounded border border-gray-100">
                    <div>
                      <p className="font-semibold">{inv.warehouse.location}</p>
                      <p className="text-sm text-gray-600">Available: {availableStock}</p>
                    </div>
                    
                    {availableStock > 0 ? (
                      <Link 
                        href={`/checkout?inventoryId=${inv.id}`}
                        className="bg-black text-white px-5 py-2 rounded-md hover:bg-gray-800 transition"
                      >
                        Reserve
                      </Link>
                    ) : (
                      <span className="text-red-600 text-sm font-bold bg-red-50 px-3 py-1 rounded">Out of Stock</span>
                    )}
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