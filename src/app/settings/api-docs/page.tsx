// src/app/api-docs/page.tsx
"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Code2, FileText, Globe, Database, Users, Shield, Bell, Settings, Loader2 } from 'lucide-react';

interface ApiEndpoint {
  path: string;
  method: string;
  summary: string;
  description?: string;
  tags?: string[];
}

export default function ApiDocsPage() {
  const { data: session, status } = useSession();
  const [swaggerSpec, setSwaggerSpec] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string>('all');

  const fetchApiDocs = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/api-docs');
      if (!response.ok) {
        throw new Error('Failed to fetch API documentation');
      }
      const data = await response.json();
      setSwaggerSpec(data);
    } catch (e: any) {
      setError(e.message);
      toast.error(e.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchApiDocs();
    } else if (status === 'unauthenticated') {
      signIn();
    }
  }, [status, fetchApiDocs]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const getTagIcon = (tag: string) => {
    switch (tag.toLowerCase()) {
      case 'candidates': return <Users className="h-4 w-4" />;
      case 'positions': return <Database className="h-4 w-4" />;
      case 'users': return <Users className="h-4 w-4" />;
      case 'settings': return <Settings className="h-4 w-4" />;
      case 'auth': return <Shield className="h-4 w-4" />;
      case 'notifications': return <Bell className="h-4 w-4" />;
      default: return <Code2 className="h-4 w-4" />;
    }
  };

  const getMethodColor = (method: string) => {
    switch (method.toUpperCase()) {
      case 'GET': return 'bg-green-100 text-green-800';
      case 'POST': return 'bg-blue-100 text-blue-800';
      case 'PUT': return 'bg-yellow-100 text-yellow-800';
      case 'DELETE': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const extractEndpoints = (spec: any): ApiEndpoint[] => {
    if (!spec || !spec.paths) return [];
    
    const endpoints: ApiEndpoint[] = [];
    Object.entries(spec.paths).forEach(([path, methods]: [string, any]) => {
      Object.entries(methods).forEach(([method, details]: [string, any]) => {
        if (typeof details === 'object' && details.summary) {
          endpoints.push({
            path,
            method: method.toUpperCase(),
            summary: details.summary,
            description: details.description,
            tags: details.tags || []
          });
        }
      });
    });
    return endpoints;
  };

  const endpoints = swaggerSpec ? extractEndpoints(swaggerSpec) : [];
  const allTags = Array.from(new Set(endpoints.flatMap(ep => ep.tags || []))).sort();
  const filteredEndpoints = selectedTag === 'all' 
    ? endpoints 
    : endpoints.filter(ep => ep.tags?.includes(selectedTag));

  if (status === 'loading') {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (error && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-4">
        <Code2 className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-foreground mb-2">Error Loading API Documentation</h2>
        <p className="text-muted-foreground mb-4 max-w-md">{error}</p>
        <Button onClick={fetchApiDocs} className="btn-hover-primary-gradient">Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl">
            <Code2 className="mr-3 h-6 w-6 text-primary" /> API Documentation
          </CardTitle>
          <CardDescription>
            Complete API reference for developers. All endpoints require authentication unless specified.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Tag Filter */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Filter by Category</h3>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedTag === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedTag('all')}
                className="flex items-center gap-2"
              >
                <Globe className="h-4 w-4" />
                All Endpoints ({endpoints.length})
              </Button>
              {allTags.map(tag => (
                <Button
                  key={tag}
                  variant={selectedTag === tag ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedTag(tag)}
                  className="flex items-center gap-2"
                >
                  {getTagIcon(tag)}
                  {tag} ({endpoints.filter(ep => ep.tags?.includes(tag)).length})
                </Button>
              ))}
            </div>
          </div>

          {/* Endpoints List */}
          <div className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Loading API documentation...</span>
              </div>
            ) : filteredEndpoints.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No endpoints found for the selected category.
              </div>
            ) : (
              filteredEndpoints.map((endpoint, index) => (
                <Card key={`${endpoint.method}-${endpoint.path}-${index}`} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge className={getMethodColor(endpoint.method)}>
                            {endpoint.method}
                          </Badge>
                          <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                            {endpoint.path}
                          </code>
                        </div>
                        <h4 className="font-semibold text-foreground mb-1">
                          {endpoint.summary}
                        </h4>
                        {endpoint.description && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {endpoint.description}
                          </p>
                        )}
                        {endpoint.tags && endpoint.tags.length > 0 && (
                          <div className="flex gap-1">
                            {endpoint.tags.map(tag => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const url = `${window.location.origin}${endpoint.path}`;
                          navigator.clipboard.writeText(url);
                          toast.success('Endpoint URL copied to clipboard');
                        }}
                        className="flex items-center gap-1"
                      >
                        <FileText className="h-3 w-3" />
                        Copy URL
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Additional Resources */}
          <div className="mt-8 p-4 bg-muted/30 rounded-lg">
            <h3 className="font-semibold mb-2">Additional Resources</h3>
            <div className="space-y-2 text-sm">
              <p>• All endpoints require a valid session token in the Authorization header</p>
              <p>• POST/PUT requests should include Content-Type: application/json</p>
              <p>• Error responses include a message field with details</p>
              <p>• Rate limiting may apply to certain endpoints</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
