"use client";

import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ToggleField, SelectField, NumberField } from "@/components/page-blocks/shared/EditorPrimitives";

interface PageMeta {
  id: number;
  slug: string;
  title: string;
  systemLocked: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
  showInNav: boolean;
  navSection: string;
  navLabel: string | null;
  navOrder: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  page: PageMeta;
  onChange: (patch: Partial<PageMeta>) => void;
  canEditSlug: boolean;
  canEditLock: boolean;
  disabled: boolean;
}

export function PageSettingsDrawer({
  open,
  onClose,
  page,
  onChange,
  canEditSlug,
  canEditLock,
  disabled,
}: Props) {
  return (
    <Modal
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title="Page settings"
    >
      <div className={["flex flex-col gap-5", disabled ? "opacity-60 pointer-events-none" : ""].join(" ")}>
        <section>
          <h3 className="mb-3 text-[13px] font-semibold text-muted-foreground">
            Identity
          </h3>
          <div className="space-y-3">
            <div>
              <Label htmlFor="settings-title">Title</Label>
              <Input
                id="settings-title"
                value={page.title}
                onChange={(e) => onChange({ title: e.target.value })}
                maxLength={200}
              />
            </div>
            <div>
              <Label htmlFor="settings-slug">Slug</Label>
              <Input
                id="settings-slug"
                value={page.slug}
                disabled={!canEditSlug}
                onChange={(e) => onChange({ slug: e.target.value.toLowerCase() })}
                maxLength={200}
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                {canEditSlug
                  ? "Renaming changes the public URL. Old links will 404."
                  : "Slug changes require a primary officer."}
              </p>
            </div>
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-[13px] font-semibold text-muted-foreground">
            Navigation
          </h3>
          <div className="space-y-3">
            <ToggleField
              label="Show in site navigation"
              value={page.showInNav}
              onChange={(v) => onChange({ showInNav: v })}
            />
            {page.showInNav && (
              <>
                <SelectField
                  label="Section"
                  value={page.navSection}
                  onChange={(v) => onChange({ navSection: v })}
                  options={[
                    { value: "TOP_LEVEL", label: "Top-level shortcut" },
                    { value: "STUDENTS", label: "Students dropdown" },
                    { value: "ALUMNI", label: "Alumni dropdown" },
                    { value: "COMPANIES", label: "Companies dropdown" },
                    { value: "SE_OFFICE", label: "SE Office dropdown" },
                    { value: "HIDDEN", label: "Hidden (override)" },
                  ]}
                />
                <div>
                  <Label htmlFor="settings-nav-label">Nav label (overrides title)</Label>
                  <Input
                    id="settings-nav-label"
                    value={page.navLabel ?? ""}
                    onChange={(e) => onChange({ navLabel: e.target.value || null })}
                    maxLength={80}
                    placeholder={page.title}
                  />
                </div>
                <NumberField
                  label="Sort order"
                  value={page.navOrder}
                  onChange={(v) => onChange({ navOrder: v })}
                  min={0}
                  max={10000}
                />
              </>
            )}
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-[13px] font-semibold text-muted-foreground">
            SEO
          </h3>
          <div className="space-y-3">
            <div>
              <Label htmlFor="settings-seo-title">SEO title (optional)</Label>
              <Input
                id="settings-seo-title"
                value={page.seoTitle ?? ""}
                onChange={(e) => onChange({ seoTitle: e.target.value || null })}
                maxLength={200}
                placeholder={page.title}
              />
            </div>
            <div>
              <Label htmlFor="settings-seo-desc">SEO description (optional)</Label>
              <Textarea
                id="settings-seo-desc"
                value={page.seoDescription ?? ""}
                onChange={(e) => onChange({ seoDescription: e.target.value || null })}
                rows={3}
                maxLength={500}
                placeholder="Auto-generated from page content if blank."
              />
            </div>
          </div>
        </section>

        {canEditLock && (
          <section>
            <h3 className="mb-3 text-[13px] font-semibold text-muted-foreground">
              Advanced
            </h3>
            <ToggleField
              label="System-locked (read-only in editor)"
              hint="Use for pages owned by other systems (constitution, etc.)."
              value={page.systemLocked}
              onChange={(v) => onChange({ systemLocked: v })}
            />
          </section>
        )}
      </div>
    </Modal>
  );
}
