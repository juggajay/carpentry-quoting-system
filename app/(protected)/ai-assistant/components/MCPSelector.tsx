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
    tools: ['search_materials', 'get_labor_rates', 'find_similar_quotes', 'get_labor_rate_templates'],
  },
  {
    type: 'filesystem' as const,
    name: 'Filesystem MCP',
    icon: '📁',
    description: 'Read project files and documents',
    features: ['Read files', 'List directories', 'Process documents'],
    tools: ['read_file', 'list_files'],
  },
  {
    type: 'memory' as const,
    name: 'Memory MCP',
    icon: '🧠',
    description: 'Remember project preferences',
    features: ['Store preferences', 'Learn patterns', 'Improve suggestions'],
    tools: ['store_memory', 'retrieve_memory'],
  },
  {
    type: 'brave' as const,
    name: 'Brave Search',
    icon: '🔍',
    description: 'Research products and standards',
    features: ['Web search', 'Product research', 'Technical standards'],
    tools: ['web_search'],
  },
];

export default function MCPSelector({ onClose, onConnect, existingConnections }: MCPSelectorProps) {
  const [selectedMCP, setSelectedMCP] = useState<typeof AVAILABLE_MCPS[0] | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>('');

  const handleConnect = async () => {
    if (!selectedMCP) return;

    setIsConnecting(true);
    setConnectionStatus('Creating MCP connection...');

    try {
      // Create the MCP connection in the database
      const response = await fetch('/api/mcp/connections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: selectedMCP.name,
          type: selectedMCP.type,
          config: {
            tools: selectedMCP.tools,
            features: selectedMCP.features,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create MCP connection');
      }

      const dbConnection = await response.json();
      setConnectionStatus('Connecting to MCP server...');

      // Connect to the MCP server
      const connectResponse = await fetch(`/api/mcp/connections/${dbConnection.id}/connect`, {
        method: 'POST',
      });

      if (!connectResponse.ok) {
        throw new Error('Failed to connect to MCP server');
      }

      const connectionResult = await connectResponse.json();
      
      const connection: MCPConnection = {
        id: dbConnection.id,
        name: selectedMCP.name,
        type: selectedMCP.type,
        status: connectionResult.status,
      };

      onConnect(connection);
      setIsConnecting(false);
      setConnectionStatus('');
    } catch (error) {
      console.error('MCP connection error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Connection failed';
      setConnectionStatus(`Error: ${errorMessage}`);
      setIsConnecting(false);
      
      // Show error for 5 seconds then clear
      setTimeout(() => {
        setConnectionStatus('');
      }, 5000);
    }
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
                  className={`p-4 transition-all ${
                    connected 
                      ? 'bg-green-500/10 border-green-500/50' 
                      : 'cursor-pointer hover:border-electric-magenta/50'
                  } ${
                    selectedMCP?.type === mcp.type && !connected
                      ? 'ring-2 ring-electric-magenta'
                      : ''
                  }`}
                  onClick={() => !connected && setSelectedMCP(mcp)}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{mcp.icon}</span>
                        <h3 className="font-semibold">{mcp.name}</h3>
                      </div>
                      {connected && (
                        <div className="flex items-center gap-1">
                          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                          <span className="text-green-500 text-sm font-medium">Connected</span>
                        </div>
                      )}
                    </div>
                    <p className={`text-sm ${connected ? 'text-green-100/80' : 'text-muted-foreground'}`}>
                      {mcp.description}
                    </p>
                    <div className="space-y-2">
                      <ul className="text-xs space-y-1">
                        {mcp.features.map((feature) => (
                          <li key={feature} className="flex items-center gap-1">
                            <span className={connected ? "text-green-500" : "text-electric-magenta"}>•</span>
                            <span className={connected ? "text-green-100/70" : ""}>{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <div className={`text-xs ${connected ? 'text-green-100/60' : 'text-muted-foreground'}`}>
                        <strong>Tools:</strong> {mcp.tools.join(', ')}
                      </div>
                    </div>
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
          <div className="flex flex-col items-end gap-2">
            {connectionStatus && (
              <div className="text-sm text-muted-foreground">
                {connectionStatus}
              </div>
            )}
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
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}