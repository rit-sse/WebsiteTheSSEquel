"use client"

import Image from "next/image"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Pencil, Trash2, ExternalLink } from "lucide-react"

export interface Sponsor {
  id: number
  name: string
  description: string
  logoUrl: string
  websiteUrl: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface SponsorCardProps {
  sponsor: Sponsor
  onEdit: (sponsor: Sponsor) => void
  onDelete: (sponsor: Sponsor) => void
}

export default function SponsorCard({ sponsor, onEdit, onDelete }: SponsorCardProps) {
  return (
    <Card depth={2} className="p-4 flex flex-col">
      {/* Logo */}
      <div className="relative w-full h-24 mb-4 bg-surface-4/30 rounded-lg overflow-hidden">
        <Image
          src={sponsor.logoUrl}
          alt={sponsor.name}
          fill
          className="object-contain p-2"
        />
      </div>

      {/* Content */}
      <div className="flex-1">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-display text-lg font-bold text-foreground">
            {sponsor.name}
          </h3>
          <Badge variant={sponsor.isActive ? "cat-5" : "cat-3"} className="text-xs shrink-0">
            {sponsor.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {sponsor.description}
        </p>
        <a
          href={sponsor.websiteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-chart-4 hover:underline inline-flex items-center gap-1"
        >
          Visit Website
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-4 pt-4 border-t border-border/30">
        <Button
          size="sm"
          variant="neutral"
          className="flex-1"
          onClick={() => onEdit(sponsor)}
        >
          <Pencil className="h-3 w-3 mr-1" />
          Edit
        </Button>
        <Button
          size="sm"
          variant="destructiveGhost"
          className="flex-1"
          onClick={() => onDelete(sponsor)}
        >
          <Trash2 className="h-3 w-3 mr-1" />
          Delete
        </Button>
      </div>
    </Card>
  )
}
