
type SaveStatus = "idle" | "saving" | "saved" | "error";

interface SaveStatusIndicatorProps {
  status: SaveStatus;
}

export default function SaveStatusIndicator({ status }: SaveStatusIndicatorProps) {
  const statusConfig = {
    idle: {
      icon: null,
      text: "Editing",
      className: "text-muted",
    },
    saving: {
      icon: <span className="animate-spin">↻</span>,
      text: "Saving...",
      className: "text-primary-light",
    },
    saved: {
      icon: <span>✓</span>,
      text: "All changes saved",
      className: "text-success",
    },
    error: {
      icon: <span>⚠</span>,
      text: "Error saving",
      className: "text-error",
    },
  };

  const config = statusConfig[status];

  return (
    <div className={`flex items-center space-x-2 text-sm ${config.className}`}>
      {config.icon}
      <span>{config.text}</span>
    </div>
  );
}