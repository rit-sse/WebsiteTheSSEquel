"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Building2, Handshake, Calendar } from "lucide-react";
import { Modal, ModalFooter } from "@/components/ui/modal";
import SponsorCard, { Sponsor } from "./SponsorCard";
import AddSponsorModal from "./AddSponsorModal";
import EditSponsorModal from "./EditSponsorModal";
import SponsorInquiriesSection from "./SponsorInquiriesSection";
import RecruitingTalkRequestsSection from "./RecruitingTalkRequestsSection";

export default function SponsorsPageContent() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editSponsor, setEditSponsor] = useState<Sponsor | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [sponsorToDelete, setSponsorToDelete] = useState<Sponsor | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchSponsors = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/sponsor");
      if (response.ok) {
        const data = await response.json();
        setSponsors(data);
      }
    } catch (error) {
      console.error("Failed to fetch sponsors:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSponsors();
  }, [fetchSponsors]);

  const handleEdit = (sponsor: Sponsor) => {
    setEditSponsor(sponsor);
    setEditModalOpen(true);
  };

  const handleDeleteClick = (sponsor: Sponsor) => {
    setSponsorToDelete(sponsor);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!sponsorToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch("/api/sponsor", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: sponsorToDelete.id }),
      });

      if (response.ok) {
        await fetchSponsors();
        setDeleteModalOpen(false);
        setSponsorToDelete(null);
      } else {
        const errorText = await response.text();
        alert(`Failed to delete sponsor: ${errorText}`);
      }
    } catch (error) {
      console.error("Error deleting sponsor:", error);
      alert("An error occurred while deleting the sponsor");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <Card depth={1} className="p-6">
        <CardHeader className="p-0 mb-6">
          <CardTitle className="text-2xl">Sponsors & Partnerships</CardTitle>
        </CardHeader>

        <Tabs defaultValue="sponsors" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="sponsors" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Active Sponsors</span>
              <span className="sm:hidden">Sponsors</span>
            </TabsTrigger>
            <TabsTrigger value="inquiries" className="flex items-center gap-2">
              <Handshake className="h-4 w-4" />
              <span className="hidden sm:inline">Sponsor Inquiries</span>
              <span className="sm:hidden">Inquiries</span>
            </TabsTrigger>
            <TabsTrigger value="talks" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Recruiting Talks</span>
              <span className="sm:hidden">Talks</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sponsors">
            {/* Header */}
            <div className="flex justify-end mb-6">
              <Button onClick={() => setAddModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Sponsor
              </Button>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="text-center py-12 text-muted-foreground">
                Loading sponsors...
              </div>
            )}

            {/* Empty State */}
            {!isLoading && sponsors.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                No sponsors found. Add your first sponsor to get started.
              </div>
            )}

            {/* Sponsor Cards Grid */}
            {!isLoading && sponsors.length > 0 && (
              <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {sponsors.map((sponsor) => (
                  <SponsorCard
                    key={sponsor.id}
                    sponsor={sponsor}
                    onEdit={handleEdit}
                    onDelete={handleDeleteClick}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="inquiries">
            <SponsorInquiriesSection />
          </TabsContent>

          <TabsContent value="talks">
            <RecruitingTalkRequestsSection />
          </TabsContent>
        </Tabs>
      </Card>

      {/* Add Modal */}
      <AddSponsorModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        onSuccess={fetchSponsors}
      />

      {/* Edit Modal */}
      <EditSponsorModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        sponsor={editSponsor}
        onSuccess={fetchSponsors}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        title="Delete Sponsor"
      >
        <p className="text-foreground">
          Are you sure you want to delete{" "}
          <strong>{sponsorToDelete?.name}</strong>?
        </p>
        <p className="text-sm text-destructive mt-2">
          This action cannot be undone.
        </p>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setDeleteModalOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="destructiveGhost"
            onClick={handleDeleteConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
