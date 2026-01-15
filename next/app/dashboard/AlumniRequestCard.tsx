"use client"

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X, Trash2 } from "lucide-react";
import Avatar from 'boring-avatars';
import Image from "next/image";

export interface AlumniRequest {
  id: number;
  name: string;
  email: string;
  linkedIn?: string;
  gitHub?: string;
  description?: string;
  image: string;
  start_date: string;
  end_date: string;
  quote: string;
  previous_roles: string;
  status: string;
  created_at: string;
}

interface AlumniRequestCardProps {
  request: AlumniRequest;
  onApprove: (id: number) => void;
  onReject: (id: number) => void;
  onDelete: (id: number) => void;
  isProcessing: boolean;
}

export default function AlumniRequestCard({ 
  request, 
  onApprove, 
  onReject, 
  onDelete,
  isProcessing 
}: AlumniRequestCardProps) {
  const createdDate = new Date(request.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
  };

  return (
    <Card depth={2} className="p-3 sm:p-4">
      <div className="flex gap-3 sm:gap-4">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {request.image && request.image !== "https://source.boringavatars.com/beam/" ? (
            <Image 
              src={request.image} 
              alt={`Photo of ${request.name}`} 
              width={48} 
              height={48} 
              className="rounded-full object-cover w-12 h-12 sm:w-16 sm:h-16"
            /> 
          ) : (
            <Avatar size={48} name={request.name || "default"} colors={["#426E8C", "#5289AF", "#86ACC7"]} variant="beam" className="sm:w-16 sm:h-16"/>
          )}
        </div>

        {/* Info */}
        <div className="flex-grow min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-semibold text-sm sm:text-base text-foreground truncate">{request.name}</h3>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">{request.email}</p>
            </div>
            <span className={`text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full font-medium whitespace-nowrap ${statusColors[request.status as keyof typeof statusColors] || statusColors.pending}`}>
              {request.status}
            </span>
          </div>

          <div className="mt-2 text-xs sm:text-sm text-muted-foreground space-y-1">
            <p><span className="font-medium">Period:</span> {request.start_date} - {request.end_date}</p>
            {request.previous_roles && (
              <p><span className="font-medium">Previous Roles:</span> {request.previous_roles}</p>
            )}
            {request.quote && (
              <p className="line-clamp-2"><span className="font-medium">Quote:</span> &ldquo;{request.quote}&rdquo;</p>
            )}
            {request.description && (
              <p className="line-clamp-2"><span className="font-medium">Description:</span> {request.description}</p>
            )}
          </div>

          <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
            {request.linkedIn && (
              <a href={request.linkedIn} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
                LinkedIn
              </a>
            )}
            {request.gitHub && (
              <a href={request.gitHub} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
                GitHub
              </a>
            )}
          </div>

          <p className="mt-2 text-xs text-muted-foreground">
            Submitted: {createdDate}
          </p>
        </div>
      </div>

      {/* Actions */}
      {request.status === 'pending' && (
        <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-border flex gap-2 justify-end">
          <Button 
            size="sm" 
            variant="neutral"
            onClick={() => onReject(request.id)}
            disabled={isProcessing}
            className="text-xs sm:text-sm"
          >
            <X size={14} className="sm:mr-1" />
            <span className="hidden sm:inline">Reject</span>
          </Button>
          <Button 
            size="sm"
            onClick={() => onApprove(request.id)}
            disabled={isProcessing}
            className="text-xs sm:text-sm"
          >
            <Check size={14} className="sm:mr-1" />
            <span className="hidden sm:inline">Approve</span>
          </Button>
        </div>
      )}

      {request.status !== 'pending' && (
        <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-border flex gap-2 justify-end">
          <Button 
            size="sm" 
            variant="destructive"
            onClick={() => onDelete(request.id)}
            disabled={isProcessing}
            className="text-xs sm:text-sm"
          >
            <Trash2 size={14} className="sm:mr-1" />
            <span className="hidden sm:inline">Delete</span>
          </Button>
        </div>
      )}
    </Card>
  );
}
