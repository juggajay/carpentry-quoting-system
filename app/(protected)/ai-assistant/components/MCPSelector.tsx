"use client";

import { useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalFooter,
} from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { MCPConnection } from "@/lib/ai-assistant/types";

interface MCPSelectorProps {
  onClose: () => void;
  onConnect: (connection: MCPConnection) => void;
  existingConnections: MCPConnection[];
}

const AVAILABLE_MCPS = [
  {
    type: 'postgresql' as const,
    name: 'PostgreSQL MCP',
    icon: '🗄️',
    description: 'Access your materials database',
    features: ['Query materials', 'Search products', 'Get pricing'],
  },
  {
    type: 'playwright' as const,
    name: 'Playwright MCP',
    icon: '🌐',
    description: 'Scrape supplier websites',
    features: ['Web scraping', 'Price updates', 'Screenshot capture'],
  },
  {
    type: 'memory' as const,
    name: 'Memory MCP',
    icon: '🧠',
    description: 'Remember project preferences',
    features: ['Store preferences', 'Learn patterns', 'Improve suggestions'],
  },
  {
    type: 'brave' as const,
    name: 'Brave Search',
    icon: '🔍',
    description: 'Research products and standards',
    features: ['Web search', 'Product research', 'Technical standards'],
  },
];

export default function MCPSelector({ onClose, onConnect, existingConnections }: MCPSelectorProps) {
  const [selectedMCP, setSelectedMCP] = useState<typeof AVAILABLE_MCPS[0] | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    if (!selectedMCP) return;

    setIsConnecting(true);

    // TODO: Implement actual MCP connection
    // For now, simulate connection
    setTimeout(() => {
      const connection: MCPConnection = {
        id: crypto.randomUUID(),
        name: selectedMCP.name,
        type: selectedMCP.type,
        status: 'connected',
      };
      onConnect(connection);
      setIsConnecting(false);
    }, 1500);
  };

  const isConnected = (type: string) => {
    return existingConnections.some(conn => conn.type === type && conn.status === 'connected');
  };

  return (
    <Modal open onOpenChange={onClose}>
      <ModalContent className="max-w-3xl">
        <ModalHeader>
          <ModalTitle>Select MCP Capabilities</ModalTitle>
        </ModalHeader>
        
        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            Connect additional capabilities to enhance the AI assistant
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {AVAILABLE_MCPS.map((mcp) => {
              const connected = isConnected(mcp.type);
              return (
                <Card
                  key={mcp.type}
                  className={`p-4 cursor-pointer transition-all ${
                    selectedMCP?.type === mcp.type
                      ? 'ring-2 ring-electric-magenta'
                      : ''
                  } ${connected ? 'opacity-50' : ''}`}
                  onClick={() => !connected && setSelectedMCP(mcp)}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{mcp.icon}</span>
                        <h3 className="font-semibold">{mcp.name}</h3>
                      </div>
                      {connected && (
                        <span className="text-green-500 text-sm">Connected</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {mcp.description}
                    </p>
                    <ul className="text-xs space-y-1">
                      {mcp.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-1">
                          <span className="text-electric-magenta">•</span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        <ModalFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleConnect}
            disabled={!selectedMCP || isConnecting}
            className="min-w-[100px]"
          >
            {isConnecting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Connecting...
              </span>
            ) : (
              'Connect'
            )}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}