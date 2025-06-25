"use client";
import React, { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Users, Bell, Activity, Circle, MessageSquare, Eye, RefreshCw, X } from 'lucide-react';
import { cn } from '@/lib/utils';
export function RealtimeCollaboration({ className, showOnlineUsers = true, showCollaborationEvents = true, showNotifications = true, maxItems = 10, }) {
    var _a, _b, _c;
    const { data: session } = useSession();
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [collaborationEvents, setCollaborationEvents] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [isVisible, setIsVisible] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [lastUpdate, setLastUpdate] = useState(new Date());
    // Update user presence
    const updatePresence = useCallback(async () => {
        var _a;
        if (!((_a = session === null || session === void 0 ? void 0 : session.user) === null || _a === void 0 ? void 0 : _a.id))
            return;
        try {
            const response = await fetch('/api/realtime/presence', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: session.user.id,
                    userName: session.user.name,
                    userRole: session.user.role,
                    currentPage: window.location.pathname,
                }),
            });
            if (!response.ok) {
                console.error('Failed to update presence');
            }
        }
        catch (error) {
            console.error('Error updating presence:', error);
        }
    }, [session === null || session === void 0 ? void 0 : session.user]);
    // Fetch real-time data
    const fetchRealtimeData = useCallback(async () => {
        var _a;
        if (!((_a = session === null || session === void 0 ? void 0 : session.user) === null || _a === void 0 ? void 0 : _a.id))
            return;
        setIsLoading(true);
        try {
            const [usersResponse, eventsResponse, notificationsResponse] = await Promise.all([
                fetch('/api/realtime/online-users'),
                fetch('/api/realtime/collaboration-events'),
                fetch('/api/realtime/notifications'),
            ]);
            if (usersResponse.ok) {
                const users = await usersResponse.json();
                setOnlineUsers(users.slice(0, maxItems));
            }
            if (eventsResponse.ok) {
                const events = await eventsResponse.json();
                setCollaborationEvents(events.slice(0, maxItems));
            }
            if (notificationsResponse.ok) {
                const notifications = await notificationsResponse.json();
                setNotifications(notifications.slice(0, maxItems));
            }
            setLastUpdate(new Date());
        }
        catch (error) {
            console.error('Error fetching real-time data:', error);
        }
        finally {
            setIsLoading(false);
        }
    }, [(_a = session === null || session === void 0 ? void 0 : session.user) === null || _a === void 0 ? void 0 : _a.id, maxItems]);
    // Mark notification as read
    const markNotificationAsRead = useCallback(async (notificationId) => {
        var _a;
        if (!((_a = session === null || session === void 0 ? void 0 : session.user) === null || _a === void 0 ? void 0 : _a.id))
            return;
        try {
            await fetch(`/api/realtime/notifications/${notificationId}/read`, {
                method: 'POST',
            });
            setNotifications(prev => prev.map(notification => notification.id === notificationId
                ? Object.assign(Object.assign({}, notification), { read: true }) : notification));
        }
        catch (error) {
            console.error('Error marking notification as read:', error);
        }
    }, [(_b = session === null || session === void 0 ? void 0 : session.user) === null || _b === void 0 ? void 0 : _b.id]);
    // Initialize presence and fetch data
    useEffect(() => {
        updatePresence();
        fetchRealtimeData();
        // Update presence every 30 seconds
        const presenceInterval = setInterval(updatePresence, 30000);
        // Fetch real-time data every 10 seconds
        const dataInterval = setInterval(fetchRealtimeData, 10000);
        // Cleanup on unmount
        return () => {
            var _a;
            clearInterval(presenceInterval);
            clearInterval(dataInterval);
            // Remove presence on unmount
            if ((_a = session === null || session === void 0 ? void 0 : session.user) === null || _a === void 0 ? void 0 : _a.id) {
                fetch('/api/realtime/presence', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: session.user.id }),
                }).catch(console.error);
            }
        };
    }, [updatePresence, fetchRealtimeData, (_c = session === null || session === void 0 ? void 0 : session.user) === null || _c === void 0 ? void 0 : _c.id]);
    // Format timestamp
    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        if (diffMins < 1)
            return 'Just now';
        if (diffMins < 60)
            return `${diffMins}m ago`;
        if (diffHours < 24)
            return `${diffHours}h ago`;
        return date.toLocaleDateString();
    };
    // Get user initials
    const getUserInitials = (name) => {
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };
    // Get event icon
    const getEventIcon = (type) => {
        switch (type) {
            case 'candidate_update':
                return <Users className="w-4 h-4"/>;
            case 'position_update':
                return <Activity className="w-4 h-4"/>;
            case 'status_change':
                return <Circle className="w-4 h-4"/>;
            case 'comment':
                return <MessageSquare className="w-4 h-4"/>;
            case 'assignment':
                return <Users className="w-4 h-4"/>;
            default:
                return <Activity className="w-4 h-4"/>;
        }
    };
    if (!isVisible) {
        return (<div className={cn("fixed bottom-4 right-4 z-50", className)}>
        <Button variant="outline" size="sm" onClick={() => setIsVisible(true)} className="rounded-md w-12 h-12 p-0">
          <Eye className="w-4 h-4"/>
        </Button>
      </div>);
    }
    return (<div className={cn("fixed bottom-4 right-4 z-50 w-80", className)}>
      <Card className="shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Real-time Collaboration</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={fetchRealtimeData} disabled={isLoading} className="h-6 w-6 p-0">
                <RefreshCw className={cn("w-3 h-3", isLoading && "animate-spin")}/>
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setIsVisible(false)} className="h-6 w-6 p-0">
                <X className="w-3 h-3"/>
              </Button>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            Last updated: {formatTimestamp(lastUpdate.getTime())}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Online Users */}
          {showOnlineUsers && (<div>
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4"/>
                <span className="text-sm font-medium">Online Users</span>
                <Badge variant="secondary" className="text-xs">
                  {onlineUsers.length}
                </Badge>
              </div>
              <ScrollArea className="h-24">
                <div className="space-y-2">
                  {onlineUsers.map((user) => (<TooltipProvider key={user.userId}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50">
                            <Avatar className="w-6 h-6">
                              <AvatarImage src=""/>
                              <AvatarFallback className="text-xs">
                                {getUserInitials(user.userName)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-medium truncate">
                                {user.userName}
                              </div>
                              <div className="text-xs text-muted-foreground truncate">
                                {user.currentPage}
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <Circle className="w-2 h-2 text-green-500 fill-current"/>
                              <span className="text-xs text-muted-foreground">
                                {formatTimestamp(user.lastActivity)}
                              </span>
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="text-xs">
                            <div><strong>{user.userName}</strong></div>
                            <div>Role: {user.userRole}</div>
                            <div>Page: {user.currentPage}</div>
                            <div>Last active: {formatTimestamp(user.lastActivity)}</div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>))}
                </div>
              </ScrollArea>
            </div>)}

          {/* Collaboration Events */}
          {showCollaborationEvents && (<div>
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4"/>
                <span className="text-sm font-medium">Recent Activity</span>
                <Badge variant="secondary" className="text-xs">
                  {collaborationEvents.length}
                </Badge>
              </div>
              <ScrollArea className="h-24">
                <div className="space-y-2">
                  {collaborationEvents.map((event) => (<div key={event.id} className="flex items-start gap-2 p-2 rounded-md hover:bg-muted/50">
                      <div className="mt-1">
                        {getEventIcon(event.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium truncate">
                          {event.userName}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {event.type.replace('_', ' ')}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatTimestamp(event.timestamp)}
                        </div>
                      </div>
                    </div>))}
                </div>
              </ScrollArea>
            </div>)}

          {/* Notifications */}
          {showNotifications && (<div>
              <div className="flex items-center gap-2 mb-2">
                <Bell className="w-4 h-4"/>
                <span className="text-sm font-medium">Notifications</span>
                <Badge variant="secondary" className="text-xs">
                  {notifications.filter(n => !n.read).length}
                </Badge>
              </div>
              <ScrollArea className="h-24">
                <div className="space-y-2">
                  {notifications.map((notification) => (<div key={notification.id} className={cn("flex items-start gap-2 p-2 rounded-md cursor-pointer transition-colors", notification.read ? "opacity-60" : "bg-muted/50", "hover:bg-muted")} onClick={() => !notification.read && markNotificationAsRead(notification.id)}>
                      <div className="mt-1">
                        <Bell className="w-4 h-4"/>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium truncate">
                          {notification.title}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {notification.message}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatTimestamp(notification.timestamp)}
                        </div>
                      </div>
                      {!notification.read && (<div className="w-2 h-2 bg-blue-500 rounded-md mt-1"/>)}
                    </div>))}
                </div>
              </ScrollArea>
            </div>)}
        </CardContent>
      </Card>
    </div>);
}
