"use client";

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { PlusCircle, Briefcase, Edit, Trash2, Search, Filter, Loader2 } from "lucide-react";
import type { Position } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "react-hot-toast";
import { AddPositionModal, type AddPositionFormValues } from '@/components/positions/AddPositionModal';
import { EditPositionModal, type EditPositionFormValues } from '@/components/positions/EditPositionModal';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function PositionsPageClient() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'closed'>('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [positionToDelete, setPositionToDelete] = useState<Position | null>(null);
  const { data: session } = useSession();

  const canManagePositions = session?.user?.role === 'Admin' || session?.user?.modulePermissions?.includes('POSITIONS_MANAGE');

  // Fetch positions
  const fetchPositions = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/positions');
      if (!response.ok) {
        throw new Error('Failed to fetch positions');
      }
      const data = await response.json();
      setPositions(data.data || []);
    } catch (error) {
      toast.error('Failed to load positions');
      console.error('Error fetching positions:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPositions();
  }, [fetchPositions]);

  // Filter positions
  const filteredPositions = positions.filter(position => {
    const matchesSearch = position.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         position.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'open' && position.isOpen) ||
                         (statusFilter === 'closed' && !position.isOpen);
    const matchesDepartment = departmentFilter === 'all' || position.department === departmentFilter;
    
    return matchesSearch && matchesStatus && matchesDepartment;
  });

  // Get unique departments for filter
  const departments = Array.from(new Set(positions.map(p => p.department))).sort();

  // Handle add position
  const handleAddPosition = async (formData: AddPositionFormValues) => {
    try {
      const response = await fetch('/api/positions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add position');
      }
      
      const newPosition = await response.json();
      setPositions(prev => [...prev, newPosition]);
      setIsAddModalOpen(false);
      toast.success('Position added successfully');
    } catch (error) {
      toast.error('Failed to add position');
    }
  };

  // Handle edit position
  const handleEditPosition = async (positionId: string, data: EditPositionFormValues) => {
    try {
      const response = await fetch(`/api/positions/${positionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update position');
      }
      
      const updatedPosition = await response.json();
      setPositions(prev => prev.map(p => p.id === positionId ? updatedPosition : p));
      setIsEditModalOpen(false);
      setSelectedPosition(null);
      toast.success('Position updated successfully');
    } catch (error) {
      toast.error('Failed to update position');
    }
  };

  // Handle delete position
  const handleDeletePosition = async () => {
    if (!positionToDelete) return;
    
    try {
      const response = await fetch(`/api/positions/${positionToDelete.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete position');
      }
      
      setPositions(prev => prev.filter(p => p.id !== positionToDelete.id));
      setPositionToDelete(null);
      toast.success('Position deleted successfully');
    } catch (error) {
      toast.error('Failed to delete position');
    }
  };

  // Stats
  const totalPositions = positions.length;
  const openPositions = positions.filter(p => p.isOpen).length;
  const closedPositions = positions.filter(p => !p.isOpen).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Job Positions</h1>
          <p className="text-muted-foreground">Manage your open job positions</p>
        </div>
        {canManagePositions && (
          <Button onClick={() => setIsAddModalOpen(true)} className="btn-primary-gradient">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Position
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Positions</p>
                <p className="text-2xl font-bold">{totalPositions}</p>
              </div>
              <Briefcase className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Open Positions</p>
                <p className="text-2xl font-bold text-green-600">{openPositions}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                <span className="text-green-600 text-sm font-bold">O</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Closed Positions</p>
                <p className="text-2xl font-bold text-gray-600">{closedPositions}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                <span className="text-gray-600 text-sm font-bold">C</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search positions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter || ''} onValueChange={(value: 'all' | 'open' | 'closed') => setStatusFilter(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open Only</SelectItem>
                <SelectItem value="closed">Closed Only</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={departmentFilter || ''} onValueChange={setDepartmentFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map(dept => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Positions List */}
      <Card>
        <CardHeader>
          <CardTitle>Positions ({filteredPositions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredPositions.length === 0 ? (
            <div className="text-center py-12">
              <Briefcase className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No positions found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== 'all' || departmentFilter !== 'all' 
                  ? 'Try adjusting your filters' 
                  : 'Get started by adding your first position'}
              </p>
              {canManagePositions && !searchTerm && statusFilter === 'all' && departmentFilter === 'all' && (
                <Button onClick={() => setIsAddModalOpen(true)} className="btn-primary-gradient">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add First Position
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPositions.map((position) => (
                <div
                  key={position.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Link 
                        href={`/positions/${position.id}`}
                        className="text-lg font-semibold hover:text-primary transition-colors"
                      >
                        {position.title}
                      </Link>
                      <Badge variant={position.isOpen ? "default" : "secondary"}>
                        {position.isOpen ? "Open" : "Closed"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{position.department}</span>
                      {position.position_level && (
                        <span>• {position.position_level}</span>
                      )}
                      {position.description && (
                        <span className="truncate max-w-xs">• {position.description}</span>
                      )}
                    </div>
                  </div>
                  
                  {canManagePositions && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedPosition(position);
                          setIsEditModalOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPositionToDelete(position)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      {canManagePositions && (
        <AddPositionModal 
          isOpen={isAddModalOpen} 
          onOpenChange={setIsAddModalOpen} 
          onAddPosition={handleAddPosition} 
        />
      )}
      
      {canManagePositions && selectedPosition && (
        <EditPositionModal
          isOpen={isEditModalOpen}
          onOpenChange={(open) => {
            setIsEditModalOpen(open);
            if (!open) setSelectedPosition(null);
          }}
          onEditPosition={handleEditPosition}
          position={selectedPosition}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!positionToDelete} onOpenChange={() => setPositionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Position</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{positionToDelete?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePosition} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 