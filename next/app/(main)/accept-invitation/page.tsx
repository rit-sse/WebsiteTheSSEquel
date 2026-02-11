"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Invitation {
  id: number;
  invitedEmail: string;
  type: "officer" | "user";
  positionId: number | null;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  expiresAt: string;
  position: {
    id: number;
    title: string;
    email: string;
    is_primary: boolean;
  } | null;
  inviter: {
    id: number;
    name: string;
    email: string;
  };
}

export default function AcceptInvitationPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<number | null>(null);

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      // Redirect to sign in, then back here
      signIn("google", { callbackUrl: "/accept-invitation" });
      return;
    }

    // Fetch pending invitations
    fetchInvitations();
  }, [status]);

  const fetchInvitations = async () => {
    try {
      const response = await fetch("/api/invitations/pending");
      if (response.ok) {
        const data = await response.json();
        setInvitations(data);
      } else if (response.status === 401) {
        signIn("google", { callbackUrl: "/accept-invitation" });
      }
    } catch (error) {
      console.error("Error fetching invitations:", error);
      toast.error("Failed to load invitations");
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (invitationId: number) => {
    setProcessing(invitationId);
    try {
      const response = await fetch("/api/invitations/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invitationId }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || "Invitation accepted!");
        // Remove from list
        setInvitations((prev) => prev.filter((inv) => inv.id !== invitationId));
      } else {
        toast.error(data || "Failed to accept invitation");
      }
    } catch (error) {
      console.error("Error accepting invitation:", error);
      toast.error("Failed to accept invitation");
    } finally {
      setProcessing(null);
    }
  };

  const handleDecline = async (invitationId: number) => {
    setProcessing(invitationId);
    try {
      const response = await fetch("/api/invitations/decline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invitationId }),
      });

      if (response.ok) {
        toast.success("Invitation declined");
        // Remove from list
        setInvitations((prev) => prev.filter((inv) => inv.id !== invitationId));
      } else {
        const data = await response.json();
        toast.error(data || "Failed to decline invitation");
      }
    } catch (error) {
      console.error("Error declining invitation:", error);
      toast.error("Failed to decline invitation");
    } finally {
      setProcessing(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Show loading state
  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading invitations...</p>
        </div>
      </div>
    );
  }

  // No invitations
  if (invitations.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CardTitle>No Pending Invitations</CardTitle>
            <CardDescription>
              You don&apos;t have any pending invitations at this time.
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Button onClick={() => router.push("/")}>Go to Homepage</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome to SSE!</h1>
          <p className="text-muted-foreground">
            You have {invitations.length} pending invitation
            {invitations.length > 1 ? "s" : ""}
          </p>
        </div>

        <div className="space-y-6">
          {invitations.map((invitation) => (
            <Card key={invitation.id} className="overflow-hidden">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      invitation.type === "officer"
                        ? "bg-chart-1/20 text-foreground"
                        : "bg-accent/20 text-accent-foreground"
                    }`}
                  >
                    {invitation.type === "officer" ? "Officer Position" : "Membership"}
                  </span>
                </div>
                <CardTitle>
                  {invitation.type === "officer" && invitation.position
                    ? invitation.position.title
                    : "Join SSE as a Member"}
                </CardTitle>
                <CardDescription>
                  Invited by {invitation.inviter.name}
                </CardDescription>
              </CardHeader>

              <CardContent>
                {invitation.type === "officer" && invitation.position ? (
                  <div className="space-y-3">
                    <p className="text-sm">
                      You&apos;ve been invited to join the SSE officer board as{" "}
                      <strong>{invitation.position.title}</strong>.
                    </p>
                    {invitation.startDate && invitation.endDate && (
                      <div className="text-sm text-muted-foreground">
                        <strong>Term:</strong> {formatDate(invitation.startDate)} —{" "}
                        {formatDate(invitation.endDate)}
                      </div>
                    )}
                    {invitation.position.is_primary && (
                      <p className="text-sm text-muted-foreground">
                        This is a <strong>primary officer</strong> position.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm">
                      You&apos;ve been invited to join the Society of Software Engineers
                      as a member.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      As a member, you&apos;ll have access to mentoring programs,
                      exclusive workshops, networking opportunities, and project
                      collaboration.
                    </p>
                  </div>
                )}

                <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
                  Invitation expires: {formatDate(invitation.expiresAt)}
                </div>
              </CardContent>

              <CardFooter className="gap-3 bg-muted/30 px-6 py-4">
                <Button
                  onClick={() => handleAccept(invitation.id)}
                  disabled={processing === invitation.id}
                  className="flex-1"
                >
                  {processing === invitation.id ? "Processing..." : "Accept"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleDecline(invitation.id)}
                  disabled={processing === invitation.id}
                >
                  Decline
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="text-center mt-8">
          <Button variant="ghost" onClick={() => router.push("/")}>
            Go to Homepage
          </Button>
        </div>
      </div>
    </div>
  );
}
