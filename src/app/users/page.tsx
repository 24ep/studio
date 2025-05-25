
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, UsersRound, ShieldAlert } from "lucide-react";
import { mockAppUsers } from "@/lib/data";
import type { UserProfile } from "@/lib/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from 'react';


export default function ManageUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // In a real app, fetch users here. For now, use mock data.
    setUsers(mockAppUsers);
  }, []);

  if (!isClient) {
     // Skeleton or loading state for SSR/initial client render
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
                <div className="h-8 bg-muted rounded w-1/4 animate-pulse"></div>
                <div className="h-10 bg-muted rounded w-40 animate-pulse"></div>
            </div>
            <Card className="shadow-sm animate-pulse">
                <CardHeader>
                    <CardTitle className="h-8 bg-muted rounded w-1/2"></CardTitle>
                    <CardDescription className="h-4 bg-muted rounded w-3/4 mt-1"></CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-lg overflow-hidden">
                        <div className="h-12 bg-muted border-b"></div>
                        {[1,2,3].map(i => (
                            <div key={i} className="flex items-center p-4 border-b h-[70px]">
                                <div className="h-9 w-9 rounded-full bg-muted mr-3"></div>
                                <div className="space-y-2 flex-1">
                                    <div className="h-4 bg-muted rounded w-1/3"></div>
                                    <div className="h-3 bg-muted rounded w-1/2"></div>
                                </div>
                                <div className="h-6 bg-muted rounded w-1/4 ml-auto"></div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
  }


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
        <div></div> {/* Placeholder for title, handled by Header */}
        <Button className="w-full sm:w-auto" disabled> 
          <PlusCircle className="mr-2 h-4 w-4" /> Add New User
        </Button>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center">
             <UsersRound className="mr-2 h-5 w-5 text-primary" /> App Users
          </CardTitle>
          <CardDescription>
            Manage application users and their roles. Modifying users and their permissions
            is typically restricted to administrators.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {users.length === 0 && isClient ? ( 
            <div className="text-center py-10">
              <UsersRound className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">No users found.</p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={user.avatarUrl} alt={user.name} data-ai-hint={user.avatarUrl ? undefined : user.dataAiHint || "profile person"}/>
                          <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{user.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === 'Admin' ? "default" : "secondary"}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" disabled>Edit</Button> 
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
           <div className="mt-4 p-3 bg-secondary/30 border border-secondary/50 rounded-md flex items-start text-sm text-secondary-foreground">
            <ShieldAlert className="h-5 w-5 mr-2 mt-0.5 text-primary" />
            <div>
              <span className="font-semibold">Permissions Note:</span> User creation, deletion, and role modification functionalities are disabled in this prototype. In a production system, these actions would require administrative privileges and a backend implementation for user and role management.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

    