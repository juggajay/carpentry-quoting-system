export default function TestPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <h1 className="text-4xl font-bold mb-8">Style System Test</h1>
      
      {/* Test basic rendering */}
      <p className="mb-8">If you can see this text, the page is rendering correctly.</p>
      
      {/* Test Tailwind custom colors */}
      <div className="mb-8">
        <h2 className="text-2xl mb-4">Custom Tailwind Colors</h2>
        <div className="flex gap-4 flex-wrap">
          <div className="w-20 h-20 bg-electric-magenta rounded"></div>
          <div className="w-20 h-20 bg-vibrant-cyan rounded"></div>
          <div className="w-20 h-20 bg-lime-green rounded"></div>
          <div className="w-20 h-20 bg-royal-blue rounded"></div>
        </div>
      </div>

      {/* Test custom CSS classes */}
      <div className="mb-8">
        <h2 className="text-2xl mb-4">Custom Buttons</h2>
        <div className="flex gap-4 flex-wrap">
          <button className="btn btn-primary">Primary</button>
          <button className="btn btn-secondary">Secondary</button>
          <button className="btn btn-ghost">Ghost</button>
        </div>
      </div>

      {/* Test cards */}
      <div className="mb-8">
        <h2 className="text-2xl mb-4">Cards</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card">
            <h3 className="card-title">Basic Card</h3>
            <p>This is a card with custom styling</p>
          </div>
        </div>
      </div>

      {/* Test badges */}
      <div className="mb-8">
        <h2 className="text-2xl mb-4">Badges</h2>
        <div className="flex gap-2">
          <span className="badge badge-primary">Primary</span>
          <span className="badge badge-success">Success</span>
          <span className="badge badge-info">Info</span>
          <span className="badge badge-warning">Warning</span>
        </div>
      </div>

      {/* Test alerts */}
      <div className="mb-8">
        <h2 className="text-2xl mb-4">Alerts</h2>
        <div className="space-y-2 max-w-xl">
          <div className="alert alert-success">Success message</div>
          <div className="alert alert-error">Error message</div>
          <div className="alert alert-warning">Warning message</div>
          <div className="alert alert-info">Info message</div>
        </div>
      </div>
    </div>
  );
}