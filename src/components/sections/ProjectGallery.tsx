"use client";

const projects = [
  {
    title: "The Marina Villa",
    location: "Dubai, UAE",
    image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&q=80&w=1000",
    size: "large"
  },
  {
    title: "Skyline Penthouse",
    location: "Abu Dhabi",
    image: "https://images.unsplash.com/photo-1600607687644-c7171b42498f?auto=format&fit=crop&q=80&w=1000",
    size: "small"
  },
  {
    title: "Modern Oasis",
    location: "Palm Jumeirah",
    image: "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&q=80&w=1000",
    size: "small"
  },
  {
    title: "Eco Residence",
    location: "Al Barari",
    image: "https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?auto=format&fit=crop&q=80&w=1000",
    size: "medium"
  }
];

const ProjectGallery = () => {
  return (
    <section className="section-padding bg-matte-black">
      <div className="max-container">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8 px-6 md:px-0">
          <div className="max-w-2xl space-y-4">
            <h2 className="text-brushed-bronze text-sm uppercase tracking-[0.3em] font-bold">Showcase</h2>
            <p className="text-4xl md:text-5xl font-bold text-white leading-tight">
              A Symphony of <br />
              <span className="text-gradient">Glass & Steel</span>
            </p>
          </div>
          <p className="text-steel-gray text-sm uppercase tracking-widest font-bold max-w-xs mb-2">
            Explore our most prestigious installations across the region.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {projects.map((project, index) => (
            <div 
              key={index}
              className={`relative overflow-hidden group cursor-pointer rounded-sm ${
                index === 0 ? "md:col-span-8 h-[600px]" : 
                index === 3 ? "md:col-span-12 h-[400px]" : "md:col-span-4 h-[300px]"
              }`}
            >
              <img 
                src={project.image} 
                alt={project.title}
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-matte-black via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500" />
              <div className="absolute bottom-10 left-10 text-white translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                <span className="block text-[10px] uppercase tracking-[0.3em] font-bold text-brushed-bronze mb-2">{project.location}</span>
                <h3 className="text-2xl font-bold">{project.title}</h3>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProjectGallery;
