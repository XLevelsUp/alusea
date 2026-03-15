export default function Home() {
  return (
    <div className="pt-32 pb-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-3xl space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-matte-black dark:text-white">
            Architectural Excellence in <span className="text-brushed-bronze italic">Aluminium</span>.
          </h1>
          <p className="text-xl text-steel-gray leading-relaxed max-w-2xl">
            Alusea delivers premium window and door systems designed for modern performance and timeless aesthetics. Forged for durability, designed for life.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button className="px-8 py-4 bg-architectural-blue text-white font-semibold rounded-sm hover:translate-y-[-2px] transition-all shadow-xl">
              Explore Products
            </button>
            <button className="px-8 py-4 border border-matte-black dark:border-white font-semibold rounded-sm hover:bg-matte-black hover:text-white dark:hover:bg-white dark:hover:text-matte-black transition-all">
              Our Vision
            </button>
          </div>
        </div>
      </div>
      
      {/* Decorative gradient background element */}
      <div className="fixed top-0 right-0 -z-10 w-[500px] h-[500px] bg-architectural-blue/5 blur-[120px] rounded-full" />
    </div>
  );
}
