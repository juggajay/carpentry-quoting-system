# Modern UI Design System Integration

The carpentry quoting system now includes a comprehensive modern UI design system with vibrant colors, professional components, and dark mode support.

## What's New

### 1. **Design System Files**
- `/styles/variables.css` - CSS custom properties for colors, typography, spacing
- `/styles/components.css` - Pre-styled components (buttons, cards, forms, modals)
- `/styles/utilities.css` - Utility classes for rapid development

### 2. **Tailwind Integration**
The `tailwind.config.ts` has been extended with:
- Custom colors (electric-magenta, vibrant-cyan, lime-green, royal-blue)
- Typography scale matching the design system
- Custom spacing values
- Shadow and animation presets

### 3. **Dark Mode Support**
- Automatic dark mode using `data-theme="dark"` attribute
- CSS variables that adapt to theme changes
- Both Tailwind and custom CSS classes work seamlessly

## Usage Examples

### Using Modern UI Buttons
```jsx
// Modern UI Design System buttons
<button className="btn btn-primary">Create Quote</button>
<button className="btn btn-secondary">Save Draft</button>
<button className="btn btn-ghost">Cancel</button>

// With sizes
<button className="btn btn-primary btn-small">Small</button>
<button className="btn btn-primary btn-large">Large</button>
```

### Using Tailwind with New Colors
```jsx
// Background colors
<div className="bg-electric-magenta">Vibrant background</div>
<div className="bg-dark-elevated">Elevated dark surface</div>

// Text colors
<p className="text-vibrant-cyan">Cyan text</p>
<p className="text-lime-green">Success message</p>
```

### Cards with Effects
```jsx
// Basic card
<div className="card">
  <h3 className="card-title">Quote Summary</h3>
  <p className="text-body text-secondary">Card content</p>
</div>

// Card with glow effect
<div className="card glow-magenta">
  <h3 className="card-title">Featured Quote</h3>
</div>

// Glassmorphism card
<div className="card glass">
  <h3 className="card-title">Premium Feature</h3>
</div>
```

### Form Elements
```jsx
<div className="form-group">
  <label className="form-label" htmlFor="project">Project Name</label>
  <input type="text" id="project" className="input" placeholder="Enter project name" />
  <p className="form-help">This will appear on the quote</p>
</div>
```

### Alerts
```jsx
<div className="alert alert-success">Quote saved successfully!</div>
<div className="alert alert-warning">Quote expires in 7 days</div>
<div className="alert alert-error">Unable to calculate total</div>
<div className="alert alert-info">Prices include tax</div>
```

## Typography Classes

Use these classes for consistent typography:
- `text-display-large` - Large display text
- `text-display` - Display text
- `text-h1` through `text-h4` - Headings
- `text-body-large`, `text-body`, `text-body-small` - Body text
- `text-label` - Form labels (uppercase)
- `text-caption` - Small caption text

## Utility Classes

The design system includes extensive utility classes:
- **Spacing**: `p-micro`, `m-small`, `gap-medium`, etc.
- **Flexbox**: `d-flex`, `justify-center`, `items-center`, `gap-default`
- **Colors**: `text-primary`, `bg-secondary`, `text-magenta`
- **Effects**: `shadow-medium`, `rounded-large`, `transition-all`

## View the Style Guide

Visit `/style-guide` in your application to see all components and colors in action.

## Best Practices

1. **Use CSS variables** for dynamic theming
2. **Combine Tailwind and custom classes** for maximum flexibility
3. **Maintain consistency** by using the design system classes
4. **Test in both light and dark modes** when building new features

## Color Philosophy

- **Electric Magenta** (#FF1744) - Primary CTAs and important actions
- **Vibrant Cyan** (#00E5FF) - Secondary accents and highlights
- **Lime Green** (#76FF03) - Success states and positive feedback
- **Royal Blue** (#2962FF) - Links and informational elements

The design system emphasizes modern, clean interfaces with strategic use of vibrant colors against dark backgrounds for a professional yet engaging user experience.