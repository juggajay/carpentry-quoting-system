// This file ensures all custom colors are included in the Tailwind build
// It's not rendered anywhere but forces Tailwind to include these classes

export default function ColorReference() {
  return (
    <div className="hidden">
      {/* Background Colors */}
      <div className="bg-electric-magenta bg-vibrant-cyan bg-lime-green bg-royal-blue"></div>
      <div className="bg-dark-elevated bg-dark-surface bg-deep-charcoal bg-dark-navy"></div>
      <div className="bg-critical-red bg-warning-orange bg-success-green bg-info-blue"></div>
      
      {/* Text Colors */}
      <div className="text-electric-magenta text-vibrant-cyan text-lime-green text-royal-blue"></div>
      <div className="text-critical-red text-warning-orange text-success-green text-info-blue"></div>
      
      {/* Border Colors */}
      <div className="border-electric-magenta border-royal-blue border-critical-red border-success-green"></div>
      
      {/* Hover States */}
      <div className="hover:bg-electric-magenta hover:bg-royal-blue hover:bg-vibrant-cyan"></div>
      <div className="hover:bg-electric-magenta/90 hover:bg-royal-blue/10"></div>
      
      {/* Focus States */}
      <div className="focus:ring-electric-magenta focus:ring-royal-blue focus:border-royal-blue"></div>
      
      {/* Ring Colors */}
      <div className="ring-electric-magenta ring-royal-blue ring-critical-red"></div>
    </div>
  );
}