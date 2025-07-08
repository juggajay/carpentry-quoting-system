"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import QuoteDefaults from "./components/QuoteDefaults";
import UserManagement from "./components/UserManagement";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("quote-defaults");

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-dark-text-secondary">
          Manage your application settings and preferences
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 bg-dark-elevated">
          <TabsTrigger 
            value="quote-defaults"
            className="data-[state=active]:bg-electric-magenta data-[state=active]:text-white"
          >
            Quote Defaults
          </TabsTrigger>
          <TabsTrigger 
            value="user-management"
            className="data-[state=active]:bg-electric-magenta data-[state=active]:text-white"
          >
            User Management
          </TabsTrigger>
        </TabsList>

        <TabsContent value="quote-defaults" className="space-y-4">
          <Card className="bg-dark-elevated border-dark-border">
            <CardHeader>
              <CardTitle className="text-white">Quote Default Settings</CardTitle>
              <CardDescription className="text-dark-text-secondary">
                Configure default values that will be applied to all new quotes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <QuoteDefaults />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="user-management" className="space-y-4">
          <Card className="bg-dark-elevated border-dark-border">
            <CardHeader>
              <CardTitle className="text-white">User Management</CardTitle>
              <CardDescription className="text-dark-text-secondary">
                Manage users and their roles within the application
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UserManagement />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}