import { CheckCircleIcon, ArrowPathIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";

type SaveStatus = "idle" | "saving" | "saved" | "error";

interface SaveStatusIndicatorProps {
  status: SaveStatus;
}

export default function SaveStatusIndicator({ status }: SaveStatusIndicatorProps) {
  const statusConfig = {
    idle: {
      icon: null,
      text: "Editing",
      className: "text-text-muted",
    },
    saving: {
      icon: <ArrowPathIcon className="w-4 h-4 animate-spin" />,
      text: "Saving...",
      className: "text-primary-light",
    },
    saved: {
      icon: <CheckCircleIcon className="w-4 h-4" />,
      text: "All changes saved",
      className: "text-success",
    },
    error: {
      icon: <ExclamationTriangleIcon className="w-4 h-4" />,
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