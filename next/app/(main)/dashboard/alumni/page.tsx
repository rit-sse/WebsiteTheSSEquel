"use client";

import { useState, useEffect, useCallback } from "react";
import { DataTable, Column } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Trash2 } from "lucide-react";
import Avatar from "boring-avatars";
import Image from "next/image";
import { useIsMobile } from "@/hooks/use-mobile";

// ── Unified row type ──

type RowSource = "request" | "candidate";
type RowStatus = "pending" | "approved" | "rejected";

interface UnifiedRow {
    /** Composite key: "req-<id>" or "cand-<id>" */
    _key: string;
    source: RowSource;
    /** Original record id (for API calls) */
    sourceId: number;
    name: string;
    email: string;
    image: string | null;
    detail: string;
    status: RowStatus;
    createdAt: string;
    /** Request-only: is this an update to an existing alumni? */
    isUpdate?: boolean;
}

type FilterStatus = "pending" | "approved" | "rejected";

const DEFAULT_IMG = "https://source.boringavatars.com/beam/";

export default function AlumniReviewPage() {
    const [rows, setRows] = useState<UnifiedRow[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [processingKey, setProcessingKey] = useState<string | null>(null);
    const [filter, setFilter] = useState<FilterStatus>("pending");
    const [error, setError] = useState("");
    const isMobile = useIsMobile();

    const fetchAll = useCallback(async () => {
        setIsLoading(true);
        setError("");
        try {
            const [reqRes, candRes] = await Promise.all([
                fetch(`/api/alumni-requests?status=${filter}`),
                fetch(`/api/alumni-candidates?status=${filter}`),
            ]);

            const unified: UnifiedRow[] = [];

            if (reqRes.ok) {
                const requests = await reqRes.json();
                for (const r of requests) {
                    unified.push({
                        _key: `req-${r.id}`,
                        source: "request",
                        sourceId: r.id,
                        name: r.name,
                        email: r.email,
                        image: r.image && r.image !== DEFAULT_IMG ? r.image : null,
                        detail: [r.previous_roles, r.start_date && r.end_date ? `${r.start_date}–${r.end_date}` : null]
                            .filter(Boolean)
                            .join(" · ") || "–",
                        status: r.status as RowStatus,
                        createdAt: r.created_at,
                        isUpdate: !!r.alumniId,
                    });
                }
            }

            if (candRes.ok) {
                const candidates = await candRes.json();
                for (const c of candidates) {
                    const grad =
                        c.graduationTerm && c.graduationYear
                            ? `${c.graduationTerm} ${c.graduationYear}`
                            : null;
                    unified.push({
                        _key: `cand-${c.id}`,
                        source: "candidate",
                        sourceId: c.id,
                        name: c.name,
                        email: c.email,
                        image: null,
                        detail: [c.major, grad].filter(Boolean).join(" · ") || "–",
                        status: c.status as RowStatus,
                        createdAt: c.createdAt,
                    });
                }
            }

            // Sort newest first
            unified.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setRows(unified);
        } catch (err) {
            console.error(err);
            setError("Failed to load alumni review data");
        } finally {
            setIsLoading(false);
        }
    }, [filter]);

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    // ── Actions ──

    const reviewRequest = async (id: number, status: RowStatus) => {
        const res = await fetch("/api/alumni-requests", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, status }),
        });
        if (!res.ok) throw new Error((await res.text()) || "Failed");
    };

    const deleteRequest = async (id: number) => {
        const res = await fetch("/api/alumni-requests", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id }),
        });
        if (!res.ok) throw new Error((await res.text()) || "Failed");
    };

    const reviewCandidate = async (id: number, status: RowStatus) => {
        const res = await fetch("/api/alumni-candidates", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, status }),
        });
        if (!res.ok) throw new Error((await res.text()) || "Failed");
    };

    const handleAction = async (row: UnifiedRow, action: "approved" | "rejected" | "delete") => {
        setProcessingKey(row._key);
        setError("");
        try {
            if (action === "delete") {
                if (row.source === "request") await deleteRequest(row.sourceId);
                // Candidates don't have a delete action
            } else {
                if (row.source === "request") await reviewRequest(row.sourceId, action);
                else await reviewCandidate(row.sourceId, action);
            }
            await fetchAll();
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : "Action failed");
        } finally {
            setProcessingKey(null);
        }
    };

    // ── Columns ──

    const columns: Column<UnifiedRow>[] = [
        {
            key: "name",
            header: "Name",
            sortable: true,
            isPrimary: true,
            render: (row) => (
                <div className="flex items-center gap-2">
                    {row.image ? (
                        <Image
                            src={row.image}
                            alt={row.name}
                            width={32}
                            height={32}
                            className="rounded-full object-cover w-8 h-8 flex-shrink-0"
                            unoptimized
                        />
                    ) : (
                        <Avatar
                            size={32}
                            name={row.name || "default"}
                            colors={["#426E8C", "#5289AF", "#86ACC7"]}
                            variant="beam"
                        />
                    )}
                    <div className="min-w-0">
                        <span className="font-medium text-sm truncate block">{row.name}</span>
                        <div className="flex items-center gap-1.5">
                            <Badge
                                variant={row.source === "request" ? "outline" : "secondary"}
                                className="text-[9px] px-1.5 py-0 leading-4"
                            >
                                {row.source === "request" ? "Request" : "Auto"}
                            </Badge>
                            {row.isUpdate && (
                                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium uppercase tracking-wide">
                                    Update
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            ),
        },
        {
            key: "email",
            header: "Email",
            render: (row) => (
                <span className="text-muted-foreground text-xs truncate">{row.email}</span>
            ),
        },
        {
            key: "detail",
            header: "Details",
            render: (row) => (
                <span className="text-muted-foreground text-xs truncate max-w-[200px] block">
                    {row.detail}
                </span>
            ),
        },
        {
            key: "actions",
            header: "",
            isAction: true,
            render: (row) => {
                const isProcessing = processingKey === row._key;

                if (row.status === "pending") {
                    return isMobile ? (
                        <div className="flex flex-wrap gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleAction(row, "rejected")}
                                disabled={isProcessing}
                                className="gap-1.5"
                            >
                                <X className="h-3.5 w-3.5" />
                                Reject
                            </Button>
                            <Button
                                size="sm"
                                variant="accent"
                                onClick={() => handleAction(row, "approved")}
                                disabled={isProcessing}
                                className="gap-1.5"
                            >
                                <Check className="h-3.5 w-3.5" />
                                Approve
                            </Button>
                        </div>
                    ) : (
                        <div className="flex gap-1">
                            <Button
                                size="xs"
                                variant="ghost"
                                onClick={() => handleAction(row, "rejected")}
                                disabled={isProcessing}
                                title="Reject"
                            >
                                <X className="h-3 w-3" />
                            </Button>
                            <Button
                                size="xs"
                                variant="accent"
                                onClick={() => handleAction(row, "approved")}
                                disabled={isProcessing}
                                title="Approve"
                            >
                                <Check className="h-3 w-3" />
                            </Button>
                        </div>
                    );
                }

                // Non-pending: show delete for requests only
                if (row.source === "request") {
                    return isMobile ? (
                        <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleAction(row, "delete")}
                            disabled={isProcessing}
                            className="gap-1.5"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                        </Button>
                    ) : (
                        <Button
                            size="xs"
                            variant="destructiveGhost"
                            onClick={() => handleAction(row, "delete")}
                            disabled={isProcessing}
                            title="Delete"
                        >
                            <Trash2 className="h-3 w-3" />
                        </Button>
                    );
                }

                return null;
            },
        },
    ];

    // ── Filter tabs ──

    const filterTabs = (
        <div className="flex gap-1">
            {(["pending", "approved", "rejected"] as FilterStatus[]).map((status) => (
                <button
                    key={status}
                    onClick={() => setFilter(status)}
                    className={`px-3 py-1.5 text-xs rounded-md transition-colors capitalize font-medium ${
                        filter === status
                            ? "bg-accent text-accent-foreground"
                            : "bg-surface-3 text-muted-foreground hover:text-foreground"
                    }`}
                >
                    {status}
                </button>
            ))}
        </div>
    );

    return (
        <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            {error && (
                <div className="mb-3 p-2 bg-destructive/10 text-destructive rounded-lg text-xs">
                    {error}
                </div>
            )}
            <DataTable
                data={rows}
                columns={columns}
                keyField="_key"
                title="Alumni Review"
                titleExtra={filterTabs}
                searchPlaceholder="Search alumni..."
                searchFields={["name", "email", "detail"]}
                isLoading={isLoading}
                emptyMessage={`No ${filter} alumni reviews`}
            />
        </div>
    );
}
