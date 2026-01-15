"use client"

import { useState, useEffect, useCallback } from "react";
import AlumniRequestCard, { AlumniRequest } from "./AlumniRequestCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

type FilterStatus = 'all' | 'pending' | 'approved' | 'rejected';

export default function AlumniRequestsSection() {
  const [requests, setRequests] = useState<AlumniRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [filter, setFilter] = useState<FilterStatus>('pending');
  const [error, setError] = useState("");

  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const statusParam = filter === 'all' ? '' : `?status=${filter}`;
      const response = await fetch(`/api/alumni-requests${statusParam}`);
      if (!response.ok) {
        throw new Error('Failed to fetch requests');
      }
      const data = await response.json();
      setRequests(data);
    } catch (err) {
      console.error('Error fetching requests:', err);
      setError("Failed to load alumni requests");
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleApprove = async (id: number) => {
    setProcessingId(id);
    try {
      const response = await fetch('/api/alumni-requests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'approved' })
      });

      if (response.ok) {
        await fetchRequests();
      } else {
        const errorText = await response.text();
        setError(errorText || "Failed to approve request");
      }
    } catch (err) {
      console.error('Error approving request:', err);
      setError("An error occurred while approving the request");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: number) => {
    setProcessingId(id);
    try {
      const response = await fetch('/api/alumni-requests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'rejected' })
      });

      if (response.ok) {
        await fetchRequests();
      } else {
        const errorText = await response.text();
        setError(errorText || "Failed to reject request");
      }
    } catch (err) {
      console.error('Error rejecting request:', err);
      setError("An error occurred while rejecting the request");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    setProcessingId(id);
    try {
      const response = await fetch('/api/alumni-requests', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });

      if (response.ok) {
        await fetchRequests();
      } else {
        const errorText = await response.text();
        setError(errorText || "Failed to delete request");
      }
    } catch (err) {
      console.error('Error deleting request:', err);
      setError("An error occurred while deleting the request");
    } finally {
      setProcessingId(null);
    }
  };

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-foreground">Alumni Requests</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Review and manage alumni submission requests
          </p>
        </div>
        
        {/* Filter tabs */}
        <div className="flex gap-0.5 sm:gap-1 bg-surface-2 rounded-lg p-0.5 sm:p-1 overflow-x-auto">
          {(['pending', 'approved', 'rejected', 'all'] as FilterStatus[]).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm rounded-md transition-colors capitalize whitespace-nowrap ${
                filter === status 
                  ? 'bg-background text-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {status}
              {status === 'pending' && pendingCount > 0 && filter !== 'pending' && (
                <span className="ml-1 sm:ml-1.5 bg-primary text-primary-foreground text-xs px-1 sm:px-1.5 py-0.5 rounded-full">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-destructive/10 text-destructive rounded-lg text-xs sm:text-sm">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} depth={2} className="p-4">
              <div className="flex gap-4">
                <Skeleton className="h-16 w-16 rounded-full" />
                <div className="flex-grow space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : requests.length === 0 ? (
        <Card depth={2} className="p-8 text-center">
          <p className="text-muted-foreground">
            {filter === 'all' 
              ? 'No alumni requests yet' 
              : `No ${filter} requests`}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <AlumniRequestCard
              key={request.id}
              request={request}
              onApprove={handleApprove}
              onReject={handleReject}
              onDelete={handleDelete}
              isProcessing={processingId === request.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
