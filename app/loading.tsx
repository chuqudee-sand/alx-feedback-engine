// app/loading.tsx

export default function Loading() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center" style={{ backgroundColor: '#002B56' }}>
      
      {/* Subtle pulsing background logo */}
      <div className="absolute inset-0 z-0 flex items-center justify-center opacity-5">
        <img src="/alx-logo-transparent.png" alt="" className="w-[40%] object-contain animate-pulse" />
      </div>

      {/* Foreground Spinner */}
      <div className="relative z-10 flex flex-col items-center gap-6">
        <div className="relative h-20 w-20">
          {/* Outer spinning ring */}
          <div className="absolute inset-0 rounded-full border-4 border-white/10" />
          {/* Inner brand-colored spinner */}
          <div 
            className="absolute inset-0 rounded-full border-4 border-t-transparent animate-spin" 
            style={{ borderTopColor: '#05F283', borderRightColor: '#27DEF2', borderBottomColor: '#transparent', borderLeftColor: '#transparent' }} 
          />
        </div>
        
        <div className="flex flex-col items-center gap-2">
          <h2 className="text-xl font-black tracking-widest text-white uppercase animate-pulse">
            Processing Data
          </h2>
          <p className="text-xs font-bold tracking-widest text-zinc-400 uppercase">
            Fetching Supabase Intelligence...
          </p>
        </div>
      </div>
      
    </div>
  );
}