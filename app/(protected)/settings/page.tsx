"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import QuoteDefaults from "./components/QuoteDefaults";
import UserManagement from "./components/UserManagement";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"quote-defaults" | "user-management">("quote-defaults");

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-dark-text-secondary">
          Manage your application settings and preferences
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex space-x-1 bg-dark-elevated p-1 rounded-lg">
          <button
            onClick={() => setActiveTab("quote-defaults")}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
              activeTab === "quote-defaults"
                ? "bg-electric-magenta text-white"
                : "text-dark-text-secondary hover:text-white hover:bg-dark-surface"
            }`}
          >
            Quote Defaults
          </button>
          <button
            onClick={() => setActiveTab("user-management")}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
              activeTab === "user-management"
                ? "bg-electric-magenta text-white"
                : "text-dark-text-secondary hover:text-white hover:bg-dark-surface"
            }`}
          >
            User Management
          </button>
        </div>

        {activeTab === "quote-defaults" && (
          <Card className="bg-dark-elevated border-dark-border">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-white mb-2">Quote Default Settings</h2>
              <p className="text-dark-text-secondary mb-6">
                Configure default values that will be applied to all new quotes
              </p>
              <QuoteDefaults />
            </div>
          </Card>
        )}

        {activeTab === "user-management" && (
          <Card className="bg-dark-elevated border-dark-border">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-white mb-2">User Management</h2>
              <p className="text-dark-text-secondary mb-6">
                Manage users and their roles within the application
              </p>
              <UserManagement />
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}