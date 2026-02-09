"use client";

import React, { useCallback, useRef, useState } from "react";
import Cropper, { Area } from "react-easy-crop";
import { Camera, Trash2, Upload, ZoomIn, ZoomOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

const DEFAULT_OUTPUT_SIZE = 256;

interface ImageUploadProps {
    /** Current image value (base64 data URL, external URL, or null) */
    value: string | null;
    /** Called when the image changes */
    onChange: (image: string | null) => void;
    /** Initials to show in the avatar fallback */
    initials?: string;
    /** Avatar size class, e.g. "h-24 w-24". Defaults to "h-20 w-20". */
    avatarSize?: string;
    /** Output pixel dimensions of the cropped image. Defaults to 256. */
    outputSize?: number;
    /** Whether to show the drop zone alongside the avatar. Defaults to true. */
    showDropZone?: boolean;
    /** Whether to show a remove button when a custom image is set. Defaults to true. */
    showRemove?: boolean;
    /** Hint text shown below the drop zone */
    hint?: string;
    /** If true, the component is rendered compactly (avatar + button, no drop zone). */
    compact?: boolean;
}

function getCroppedImage(imageSrc: string, cropArea: Area, outputSize: number): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = outputSize;
            canvas.height = outputSize;
            const ctx = canvas.getContext("2d")!;
            ctx.drawImage(
                img,
                cropArea.x, cropArea.y, cropArea.width, cropArea.height,
                0, 0, outputSize, outputSize
            );
            resolve(canvas.toDataURL("image/jpeg", 0.85));
        };
        img.onerror = () => reject(new Error("Failed to load image for cropping"));
        img.src = imageSrc;
    });
}

export default function ImageUpload({
    value,
    onChange,
    initials = "?",
    avatarSize = "h-20 w-20",
    outputSize = DEFAULT_OUTPUT_SIZE,
    showDropZone = true,
    showRemove = true,
    hint,
    compact = false,
}: ImageUploadProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [dragging, setDragging] = useState(false);

    // Crop dialog state
    const [cropDialogOpen, setCropDialogOpen] = useState(false);
    const [cropSource, setCropSource] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

    const openFileDialog = () => fileInputRef.current?.click();

    const processFile = useCallback((file: File) => {
        if (!file.type.startsWith("image/")) {
            toast.error("Please select an image file.");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            toast.error("Image must be under 5MB.");
            return;
        }
        const reader = new FileReader();
        reader.onload = (ev) => {
            setCropSource(ev.target?.result as string);
            setCrop({ x: 0, y: 0 });
            setZoom(1);
            setCroppedAreaPixels(null);
            setCropDialogOpen(true);
        };
        reader.onerror = () => toast.error("Failed to read file.");
        reader.readAsDataURL(file);
    }, []);

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) processFile(file);
        if (fileInputRef.current) fileInputRef.current.value = "";
    }, [processFile]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) processFile(file);
    }, [processFile]);

    const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
        setCroppedAreaPixels(croppedPixels);
    }, []);

    const handleCropConfirm = useCallback(async () => {
        if (!cropSource || !croppedAreaPixels) return;
        try {
            const cropped = await getCroppedImage(cropSource, croppedAreaPixels, outputSize);
            onChange(cropped);
            setCropDialogOpen(false);
            setCropSource(null);
        } catch {
            toast.error("Failed to crop image.");
        }
    }, [cropSource, croppedAreaPixels, outputSize, onChange]);

    const handleCropCancel = useCallback(() => {
        setCropDialogOpen(false);
        setCropSource(null);
    }, []);

    const hasImage = value && value !== "https://source.boringavatars.com/beam/";

    // ── Compact mode: avatar + small button ──
    if (compact) {
        return (
            <>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
                <div className="flex items-center gap-4">
                    <div className="relative group">
                        <Avatar className={avatarSize}>
                            {hasImage ? <AvatarImage src={value!} alt="Upload" /> : null}
                            <AvatarFallback className="text-lg font-bold">{initials}</AvatarFallback>
                        </Avatar>
                        <button
                            type="button"
                            onClick={openFileDialog}
                            className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            aria-label="Upload image"
                        >
                            <Camera className="h-5 w-5 text-white" />
                        </button>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Button type="button" variant="outline" size="sm" onClick={openFileDialog}>
                            <Camera className="h-4 w-4 mr-1.5" />
                            {hasImage ? "Change" : "Upload"}
                        </Button>
                        {showRemove && hasImage && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                onClick={() => onChange(null)}
                            >
                                <Trash2 className="h-4 w-4 mr-1.5" />
                                Remove
                            </Button>
                        )}
                    </div>
                </div>
                <CropDialog
                    open={cropDialogOpen}
                    source={cropSource}
                    crop={crop}
                    zoom={zoom}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={onCropComplete}
                    onConfirm={handleCropConfirm}
                    onCancel={handleCropCancel}
                />
            </>
        );
    }

    // ── Full mode: avatar + drop zone ──
    return (
        <>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />

            <div className="flex flex-col sm:flex-row items-center gap-6">
                {/* Current avatar */}
                <Avatar className={`${avatarSize} shrink-0`}>
                    {hasImage ? <AvatarImage src={value!} alt="Upload" /> : null}
                    <AvatarFallback className="text-2xl font-bold">{initials}</AvatarFallback>
                </Avatar>

                {/* Drop zone */}
                {showDropZone && (
                    <div
                        role="button"
                        tabIndex={0}
                        onClick={openFileDialog}
                        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") openFileDialog(); }}
                        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={handleDrop}
                        className={[
                            "flex-1 w-full flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-6 cursor-pointer transition-colors",
                            dragging
                                ? "border-primary bg-primary/5"
                                : "border-border/50 hover:border-primary/40 hover:bg-muted/30",
                        ].join(" ")}
                    >
                        <Upload className="h-5 w-5 text-muted-foreground" />
                        <div className="text-center">
                            <p className="text-sm font-medium">
                                Drop an image here, or <span className="text-primary">browse</span>
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {hint ?? "JPG, PNG, or GIF up to 5 MB"}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Actions */}
            {showRemove && hasImage && (
                <div className="mt-3">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => onChange(null)}
                    >
                        <Trash2 className="h-4 w-4 mr-1.5" />
                        Remove upload
                    </Button>
                </div>
            )}

            <CropDialog
                open={cropDialogOpen}
                source={cropSource}
                crop={crop}
                zoom={zoom}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                onConfirm={handleCropConfirm}
                onCancel={handleCropCancel}
            />
        </>
    );
}

// ── Crop dialog (shared between both modes) ──

function CropDialog({
    open,
    source,
    crop,
    zoom,
    onCropChange,
    onZoomChange,
    onCropComplete,
    onConfirm,
    onCancel,
}: {
    open: boolean;
    source: string | null;
    crop: { x: number; y: number };
    zoom: number;
    onCropChange: (c: { x: number; y: number }) => void;
    onZoomChange: (z: number) => void;
    onCropComplete: (area: Area, pixels: Area) => void;
    onConfirm: () => void;
    onCancel: () => void;
}) {
    return (
        <Dialog open={open} onOpenChange={(o) => { if (!o) onCancel(); }}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Crop Image</DialogTitle>
                </DialogHeader>
                <div className="relative w-full h-[300px] sm:h-[350px] bg-black rounded-lg overflow-hidden">
                    {source && (
                        <Cropper
                            image={source}
                            crop={crop}
                            zoom={zoom}
                            aspect={1}
                            cropShape="round"
                            showGrid={false}
                            onCropChange={onCropChange}
                            onZoomChange={onZoomChange}
                            onCropComplete={onCropComplete}
                        />
                    )}
                </div>
                <div className="flex items-center gap-3 px-2">
                    <ZoomOut className="h-4 w-4 text-muted-foreground shrink-0" />
                    <input
                        type="range"
                        min={1}
                        max={3}
                        step={0.05}
                        value={zoom}
                        onChange={(e) => onZoomChange(Number(e.target.value))}
                        className="w-full accent-primary"
                    />
                    <ZoomIn className="h-4 w-4 text-muted-foreground shrink-0" />
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button type="button" onClick={onConfirm}>
                        Apply
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
