export default function StyleTestPage() {
  return (
    <div className="min-h-screen p-8 bg-slate-900 text-white">
      <h1 className="text-4xl font-bold mb-8">Style System Test</h1>
      
      {/* Test if Tailwind is working */}
      <div className="mb-8">
        <h2 className="text-2xl mb-4">Tailwind Classes (Should Work)</h2>
        <div className="flex gap-4">
          <div className="w-24 h-24 bg-red-500 rounded"></div>
          <div className="w-24 h-24 bg-green-500 rounded"></div>
          <div className="w-24 h-24 bg-blue-500 rounded"></div>
        </div>
      </div>

      {/* Test if custom colors are working */}
      <div className="mb-8">
        <h2 className="text-2xl mb-4">Custom Colors (From Tailwind Config)</h2>
        <div className="flex gap-4">
          <div className="w-24 h-24 bg-electric-magenta rounded"></div>
          <div className="w-24 h-24 bg-vibrant-cyan rounded"></div>
          <div className="w-24 h-24 bg-lime-green rounded"></div>
        </div>
      </div>

      {/* Test if CSS classes are working */}
      <div className="mb-8">
        <h2 className="text-2xl mb-4">CSS Design System Classes</h2>
        <button className="btn btn-primary mr-4">Primary Button</button>
        <button className="btn btn-secondary">Secondary Button</button>
      </div>

      {/* Direct CSS variable test */}
      <div className="mb-8">
        <h2 className="text-2xl mb-4">CSS Variables Test</h2>
        <div 
          className="w-24 h-24 rounded" 
          style={{ backgroundColor: 'var(--color-electric-magenta)' }}
        ></div>
      </div>
    </div>
  );
}