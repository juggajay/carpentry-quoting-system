"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export default function StyleGuidePage() {
  const [darkMode, setDarkMode] = useState(true);

  const toggleTheme = () => {
    const html = document.documentElement;
    if (darkMode) {
      html.removeAttribute('data-theme');
      setDarkMode(false);
    } else {
      html.setAttribute('data-theme', 'dark');
      setDarkMode(true);
    }
  };

  return (
    <div className="min-h-screen p-8">
      {/* Header with Theme Toggle */}
      <div className="flex justify-between items-center mb-12">
        <h1 className="text-h1">Carpentry Quoting System - Style Guide</h1>
        <label className="switch">
          <input type="checkbox" checked={darkMode} onChange={toggleTheme} />
          <span className="switch-slider"></span>
        </label>
      </div>

      {/* Colors Section */}
      <section className="mb-16">
        <h2 className="text-h2 mb-8">Color Palette</h2>
        
        <div className="mb-8">
          <h3 className="text-h3 mb-4">Primary Colors</h3>
          <div className="flex gap-4 flex-wrap">
            <div className="text-center">
              <div className="w-24 h-24 rounded-lg bg-deep-charcoal mb-2"></div>
              <p className="text-sm">Deep Charcoal</p>
            </div>
            <div className="text-center">
              <div className="w-24 h-24 rounded-lg bg-dark-surface mb-2"></div>
              <p className="text-sm">Dark Surface</p>
            </div>
            <div className="text-center">
              <div className="w-24 h-24 rounded-lg bg-dark-elevated mb-2"></div>
              <p className="text-sm">Dark Elevated</p>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-h3 mb-4">Accent Colors</h3>
          <div className="flex gap-4 flex-wrap">
            <div className="text-center">
              <div className="w-24 h-24 rounded-lg bg-electric-magenta mb-2"></div>
              <p className="text-sm">Electric Magenta</p>
            </div>
            <div className="text-center">
              <div className="w-24 h-24 rounded-lg bg-vibrant-cyan mb-2"></div>
              <p className="text-sm">Vibrant Cyan</p>
            </div>
            <div className="text-center">
              <div className="w-24 h-24 rounded-lg bg-lime-green mb-2"></div>
              <p className="text-sm">Lime Green</p>
            </div>
            <div className="text-center">
              <div className="w-24 h-24 rounded-lg bg-royal-blue mb-2"></div>
              <p className="text-sm">Royal Blue</p>
            </div>
          </div>
        </div>
      </section>

      {/* Typography Section */}
      <section className="mb-16">
        <h2 className="text-h2 mb-8">Typography</h2>
        <div className="space-y-4">
          <p className="text-display-large">Display Large - Carpentry Excellence</p>
          <p className="text-display">Display - Professional Quotes</p>
          <h1 className="text-h1">Heading 1 - Project Overview</h1>
          <h2 className="text-h2">Heading 2 - Material List</h2>
          <h3 className="text-h3">Heading 3 - Labor Costs</h3>
          <h4 className="text-h4">Heading 4 - Timeline</h4>
          <p className="text-body-large">Body Large - Project description and specifications</p>
          <p className="text-body">Body - Standard text for quotes and details</p>
          <p className="text-body-small text-secondary">Body Small - Additional notes and disclaimers</p>
        </div>
      </section>

      {/* Modern UI Buttons */}
      <section className="mb-16">
        <h2 className="text-h2 mb-8">Modern UI System Buttons</h2>
        <div className="space-y-4">
          <div className="flex gap-4 flex-wrap items-center">
            <button className="btn btn-primary">Create Quote</button>
            <button className="btn btn-secondary">Save Draft</button>
            <button className="btn btn-ghost">Cancel</button>
            <button className="btn btn-primary" disabled>Processing...</button>
          </div>
          
          <div className="flex gap-4 flex-wrap items-center">
            <button className="btn btn-primary btn-small">Small</button>
            <button className="btn btn-primary">Default</button>
            <button className="btn btn-primary btn-large">Large</button>
          </div>
        </div>
      </section>

      {/* Existing Buttons */}
      <section className="mb-16">
        <h2 className="text-h2 mb-8">Current System Buttons</h2>
        <div className="space-y-4">
          <div className="flex gap-4 flex-wrap">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Delete</Button>
            <Button variant="success">Success</Button>
            <Button variant="warning">Warning</Button>
          </div>
          
          <div className="flex gap-4 flex-wrap items-center">
            <Button size="xs">XS</Button>
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
            <Button size="xl">XL</Button>
          </div>
        </div>
      </section>

      {/* Cards */}
      <section className="mb-16">
        <h2 className="text-h2 mb-8">Cards</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card">
            <h3 className="card-title">Quote Summary</h3>
            <p className="text-body text-secondary">View and manage your quotes</p>
            <div className="mt-4">
              <span className="badge badge-success">Active</span>
            </div>
          </div>
          
          <div className="card glow-magenta">
            <h3 className="card-title">New Project</h3>
            <p className="text-body text-secondary">Create a new carpentry quote</p>
            <button className="btn btn-primary btn-small mt-4">Get Started</button>
          </div>
          
          <div className="card glass">
            <h3 className="card-title">Analytics</h3>
            <p className="text-body text-secondary">Track your business metrics</p>
            <div className="flex gap-2 mt-4">
              <span className="badge badge-info">Weekly</span>
              <span className="badge badge-warning">Pending</span>
            </div>
          </div>
        </div>
      </section>

      {/* Forms */}
      <section className="mb-16">
        <h2 className="text-h2 mb-8">Form Elements</h2>
        <div className="max-w-md space-y-4">
          <div className="form-group">
            <label className="form-label" htmlFor="project">Project Name</label>
            <input type="text" id="project" className="input" placeholder="Kitchen Renovation" />
          </div>
          
          <div className="form-group">
            <label className="form-label" htmlFor="materials">Materials Cost</label>
            <input type="number" id="materials" className="input" placeholder="$0.00" />
            <p className="form-help">Enter the total cost of materials</p>
          </div>
          
          <div className="form-group">
            <label className="form-label" htmlFor="description">Project Description</label>
            <textarea id="description" className="input textarea" placeholder="Describe the project scope..." />
          </div>
          
          <div className="flex gap-4">
            <label className="checkbox">
              <input type="checkbox" />
              Include labor costs
            </label>
            <label className="checkbox">
              <input type="checkbox" />
              Rush job
            </label>
          </div>
        </div>
      </section>

      {/* Alerts */}
      <section className="mb-16">
        <h2 className="text-h2 mb-8">Alerts</h2>
        <div className="space-y-4 max-w-2xl">
          <div className="alert alert-success">
            <strong>Success!</strong> Quote has been sent to the client.
          </div>
          <div className="alert alert-info">
            <strong>Note:</strong> Material prices are subject to market fluctuations.
          </div>
          <div className="alert alert-warning">
            <strong>Warning:</strong> This quote will expire in 30 days.
          </div>
          <div className="alert alert-error">
            <strong>Error:</strong> Unable to calculate tax. Please check your settings.
          </div>
        </div>
      </section>

      {/* Special Effects */}
      <section className="mb-16">
        <h2 className="text-h2 mb-8">Special Effects</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-8 rounded-medium gradient-magenta text-white text-center">
            <h3 className="text-h3 mb-2">Premium Quote</h3>
            <p className="text-body">Stand out with style</p>
          </div>
          
          <div className="p-8 rounded-medium gradient-cyan text-white text-center">
            <h3 className="text-h3 mb-2">Express Service</h3>
            <p className="text-body">Fast turnaround</p>
          </div>
          
          <div className="card glass text-center">
            <h3 className="text-h3 mb-2">Glassmorphism</h3>
            <p className="text-body">Modern glass effect</p>
          </div>
        </div>
      </section>
    </div>
  );
}