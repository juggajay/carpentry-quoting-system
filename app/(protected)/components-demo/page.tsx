"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import {
  Modal,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
  ModalTrigger,
} from "@/components/ui/Modal";
import { toast } from "sonner";

export default function ComponentsDemoPage() {
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const handleLoadingClick = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success("Action completed successfully!");
    }, 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-text-primary mb-2">Component Library</h1>
        <p className="text-text-secondary">
          Core UI components with animations and micro-interactions
        </p>
      </div>

      {/* Buttons Section */}
      <Card>
        <CardHeader>
          <CardTitle>Buttons</CardTitle>
          <CardDescription>
            Various button styles with hover and active states
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <Button>Primary Button</Button>
            <Button variant="secondary">Secondary Button</Button>
            <Button variant="ghost">Ghost Button</Button>
            <Button variant="destructive">Destructive Button</Button>
            <Button variant="outline">Outline Button</Button>
          </div>
          
          <div className="flex flex-wrap gap-4">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
            <Button size="icon">🚀</Button>
          </div>
          
          <div className="flex flex-wrap gap-4">
            <Button loading={loading} onClick={handleLoadingClick}>
              Click to Load
            </Button>
            <Button disabled>Disabled Button</Button>
          </div>
        </CardContent>
      </Card>

      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle>Form Inputs</CardTitle>
          <CardDescription>
            Input fields with focus states and validation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input placeholder="Enter your name" />
          <Input label="Email Address" type="email" placeholder="john@example.com" />
          <Input 
            label="Password" 
            type="password" 
            placeholder="Enter password"
            error="Password must be at least 8 characters"
          />
        </CardContent>
      </Card>

      {/* Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Hover Card</CardTitle>
            <CardDescription>This card scales on hover</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-text-secondary">
              Hover over this card to see the scale and shadow effect.
            </p>
          </CardContent>
        </Card>
        
        <Card hover={false}>
          <CardHeader>
            <CardTitle>Static Card</CardTitle>
            <CardDescription>No hover effects</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-text-secondary">
              This card has hover effects disabled.
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-primary-light/10 border-primary-light">
          <CardHeader>
            <CardTitle>Custom Card</CardTitle>
            <CardDescription>With custom styling</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-text-secondary">
              Cards can be customized with different colors.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Modal Section */}
      <Card>
        <CardHeader>
          <CardTitle>Modal Dialog</CardTitle>
          <CardDescription>
            Accessible modal with animations and focus management
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Modal open={modalOpen} onOpenChange={setModalOpen}>
            <ModalTrigger asChild>
              <Button>Open Modal</Button>
            </ModalTrigger>
            <ModalContent>
              <ModalHeader>
                <ModalTitle>Example Modal</ModalTitle>
                <ModalDescription>
                  This modal demonstrates animations, focus trapping, and accessibility features.
                  Press Escape to close.
                </ModalDescription>
              </ModalHeader>
              <div className="py-4">
                <Input label="Name" placeholder="Enter your name" />
              </div>
              <ModalFooter>
                <Button variant="secondary" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => {
                  setModalOpen(false);
                  toast.success("Modal action completed!");
                }}>
                  Save Changes
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>
        </CardContent>
      </Card>

      {/* Animation Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Animation Examples</CardTitle>
          <CardDescription>
            CSS animations defined in the design system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <div className="p-4 bg-background-hover rounded animate-fade-in">
              Fade In Animation
            </div>
            <div className="p-4 bg-background-hover rounded animate-slide-up">
              Slide Up Animation
            </div>
            <div className="p-4 bg-background-hover rounded animate-pulse">
              Pulse Animation
            </div>
            <div className="p-4 text-white rounded animate-gradient-shift" style={{ background: "linear-gradient(to right, #9333EA, #7C3AED)" }}>
              Gradient Shift
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}