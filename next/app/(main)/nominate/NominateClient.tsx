"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { signIn, useSession } from "next-auth/react";
import { motion } from "motion/react";
import { toast } from "sonner";

import { bigShoulders, fraunces, jetbrainsMono } from "./fonts";
import styles from "./nominate.module.scss";

import Marquee from "./Marquee";
import BallotHero from "./BallotHero";
import BallotProcedural from "./BallotProcedural";
import BallotUserSearch from "./BallotUserSearch";
import BallotReceipt from "./BallotReceipt";
import RoleManifest from "./RoleManifest";

import type {
  NominateData,
  NominateOffice,
  NominateOpenElection,
} from "./types";

interface NominateClientProps {
  data: NominateData;
}

interface PickedNominee {
  id: number;
  name: string;
  email?: string;
  image?: string | null;
  major?: string | null;
}

interface ReceiptState {
  serial: string;
  nominatorName: string;
  nomineeName: string;
  position: string;
}

function ballotNoFor(election: NominateOpenElection | null): string {
  if (!election) return "—";
  const opens = new Date(election.nominationsOpenAt);
  return `${opens.getFullYear()}/${String(election.id).padStart(2, "0")}`;
}

function termLabelFromTitle(title: string): string {
  // Strip the trailing "Primary Officer Election" so the hero shows
  // just the term label ("Spring 2026"), which reads like an editorial
  // pull quote rather than a registry name.
  return title
    .replace(/\s+Primary Officer Election\s*$/i, "")
    .replace(/\s+Election\s*$/i, "")
    .trim();
}

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function buildSerial(electionId: number, nominationId: number): string {
  const year = new Date().getFullYear();
  return `${year}-${String(electionId).padStart(2, "0")}-${String(
    nominationId
  ).padStart(4, "0")}`;
}

export default function NominateClient({ data }: NominateClientProps) {
  const { data: session, status: sessionStatus } = useSession();
  const isSignedIn = !!session?.user;

  const [selectedOfficeId, setSelectedOfficeId] = useState<number | null>(null);
  const [picked, setPicked] = useState<PickedNominee | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<ReceiptState | null>(null);

  const election = data.openElection;
  const nominationsOpen = !!election;

  const marqueeItems = useMemo(() => {
    if (!nominationsOpen || !election) {
      return [
        `Nominations resume ${data.nextSemesterLabel}`,
        `Stay tuned`,
        `${data.nextSemesterLabel}`,
        `New officers · new chapter`,
      ];
    }
    const closes = new Date(election.nominationsCloseAt);
    return [
      `Nominations open`,
      `Closes ${closes.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })}`,
      termLabelFromTitle(election.title),
      `Nominate today`,
    ];
  }, [nominationsOpen, election, data.nextSemesterLabel]);

  // -------- handlers --------
  function pickSelf() {
    if (!data.viewer) return;
    setPicked({
      id: data.viewer.id,
      name: data.viewer.name,
      email: data.viewer.email,
      image: data.viewer.image,
      major: data.viewer.major,
    });
  }

  async function handleSubmit() {
    if (!election) return;
    if (!selectedOfficeId) {
      toast.error("Pick an office first.");
      return;
    }
    if (!picked) {
      toast.error("Pick someone to nominate.");
      return;
    }

    setSubmitting(true);
    try {
      const resp = await fetch(`/api/elections/${election.id}/nominations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          electionOfficeId: selectedOfficeId,
          nomineeUserId: picked.id,
        }),
      });

      if (!resp.ok) {
        const text = await resp.text();
        toast.error(text || "Could not submit your nomination.");
        return;
      }

      const body = await resp.json();
      const office = election.offices.find((o) => o.id === selectedOfficeId);
      const nominationId =
        typeof body?.id === "number" ? body.id : Math.floor(Math.random() * 9999);

      setReceipt({
        serial: buildSerial(election.id, nominationId),
        nominatorName: data.viewer?.name ?? "A member",
        nomineeName: picked.name,
        position: office?.title ?? "an office",
      });
      toast.success("Nomination submitted.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Network error.");
    } finally {
      setSubmitting(false);
    }
  }

  function resetForAnother() {
    setReceipt(null);
    setPicked(null);
    setSelectedOfficeId(null);
  }

  // -------- render --------
  const rootClass = `${styles.root} ${bigShoulders.variable} ${fraunces.variable} ${jetbrainsMono.variable}`;

  return (
    <div className={rootClass} data-style="neo">
      <Marquee items={marqueeItems} />

      <div className={styles.layer}>
        {nominationsOpen && election ? (
          <BallotHero
            ballotNo={ballotNoFor(election)}
            termLabel={termLabelFromTitle(election.title)}
            closesAt={new Date(election.nominationsCloseAt)}
            numSeats={election.offices.length}
          />
        ) : (
          <WaitingHero
            nextSemesterLabel={data.nextSemesterLabel}
            isMember={data.isMember}
          />
        )}

        <MicrotypeDivider />

        {nominationsOpen && election ? (
          receipt ? (
            <ReceiptSection
              receipt={receipt}
              electionSlug={election.slug}
              onAgain={resetForAnother}
            />
          ) : (
            <FormBody
              election={election}
              isSignedIn={isSignedIn}
              sessionLoading={sessionStatus === "loading"}
              isMember={data.viewerCanNominate}
              viewerName={data.viewer?.name ?? null}
              selectedOfficeId={selectedOfficeId}
              setSelectedOfficeId={setSelectedOfficeId}
              picked={picked}
              setPicked={setPicked}
              pickSelf={pickSelf}
              submitting={submitting}
              onSubmit={handleSubmit}
            />
          )
        ) : (
          <BallotProcedural number="—" title="While you wait">
            <p className={styles.submitHelp}>
              SSE elects new primary officers each semester. The next
              nomination window opens with{" "}
              <strong>{data.nextSemesterLabel}</strong>. Until then, browse the
              roles below — and if you&rsquo;re not already an active member,
              that&rsquo;s the first step.
            </p>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <Link
                href="/about/get-involved"
                className={styles.submit}
                style={{ background: "var(--ink)", color: "var(--paper)" }}
              >
                Get involved <span className={styles.submitArrow}>→</span>
              </Link>
              <Link
                href="/about/leadership"
                className={styles.submit}
                style={{
                  background: "var(--paper)",
                  color: "var(--ink)",
                  boxShadow: "8px 8px 0 var(--ink)",
                }}
              >
                Meet current officers
              </Link>
            </div>
          </BallotProcedural>
        )}

        <MicrotypeDivider />

        <ExplainerTiles
          isOpen={nominationsOpen}
          closesAt={election ? formatDate(election.nominationsCloseAt) : null}
          votingOpensAt={election ? formatDate(election.votingOpenAt) : null}
        />

        <RoleManifest roles={data.roleManifest} />
      </div>
    </div>
  );
}

/* ─────────────────── Sub-views ─────────────────── */

function MicrotypeDivider() {
  return (
    <div className={styles.microtypeDivider} aria-hidden>
      {Array.from({ length: 28 })
        .map(() => "BALLOT")
        .join(" · ")}
    </div>
  );
}

function WaitingHero({
  nextSemesterLabel,
  isMember,
}: {
  nextSemesterLabel: string;
  isMember: boolean;
}) {
  return (
    <header className={styles.waitingHero}>
      <motion.span
        className={styles.heroEyebrow}
        initial={{ opacity: 0, y: -16, rotate: -8 }}
        animate={{ opacity: 1, y: 0, rotate: -2 }}
        transition={{ type: "spring", stiffness: 220, damping: 16 }}
      >
        BALLOT BEING DRAWN UP
      </motion.span>
      <motion.h1
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.15 }}
      >
        The next ballot is being drawn up.
      </motion.h1>
      <motion.p
        className={styles.heroSub}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        {isMember ? (
          <>
            You&rsquo;re on the rolls — once the new ballot opens, you can
            nominate from this very page.
          </>
        ) : (
          <>
            Memberships count from the start of every term. Get one before the
            ballot opens and you&rsquo;re cleared to nominate.
          </>
        )}
      </motion.p>
      <motion.div
        style={{ marginTop: "1.25rem" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.65 }}
      >
        <span className={styles.waitingDate}>
          Resumes {nextSemesterLabel}
        </span>
      </motion.div>
    </header>
  );
}

function FormBody({
  election,
  isSignedIn,
  sessionLoading,
  isMember,
  viewerName,
  selectedOfficeId,
  setSelectedOfficeId,
  picked,
  setPicked,
  pickSelf,
  submitting,
  onSubmit,
}: {
  election: NominateOpenElection;
  isSignedIn: boolean;
  sessionLoading: boolean;
  isMember: boolean;
  viewerName: string | null;
  selectedOfficeId: number | null;
  setSelectedOfficeId: (id: number) => void;
  picked: PickedNominee | null;
  setPicked: (p: PickedNominee | null) => void;
  pickSelf: () => void;
  submitting: boolean;
  onSubmit: () => void;
}) {
  if (!isSignedIn && !sessionLoading) {
    return (
      <BallotProcedural number="01" title="Sign in to nominate">
        <div className={styles.signinCard}>
          <span className={styles.signinTitle}>RIT Google sign-in required</span>
          <p className={styles.signinSub}>
            Nominations are member-only — one sign-in puts the ballot in your
            hands.
          </p>
          <button
            type="button"
            className={styles.submit}
            onClick={() => signIn("google")}
            style={{ alignSelf: "center" }}
          >
            Sign in with RIT Google{" "}
            <span className={styles.submitArrow}>→</span>
          </button>
        </div>
      </BallotProcedural>
    );
  }

  const formIsLocked = !isMember;

  return (
    <>
      <BallotProcedural number="01" title="Pick a position">
        <div className={formIsLocked ? styles.disabledStamp : ""}>
          <ul className={styles.officeList} role="radiogroup" aria-label="Office">
            {election.offices.map((office) => (
              <OfficeRow
                key={office.id}
                office={office}
                selected={selectedOfficeId === office.id}
                onSelect={() => setSelectedOfficeId(office.id)}
              />
            ))}
          </ul>
        </div>
      </BallotProcedural>

      <BallotProcedural number="02" title="Choose a nominee" delay={0.05}>
        <div className={formIsLocked ? styles.disabledStamp : ""}>
          {/* Self-nomination shortcut */}
          {viewerName && !picked && (
            <button
              type="button"
              className={styles.searchSelf}
              onClick={pickSelf}
              aria-label={`Nominate yourself, ${viewerName}`}
            >
              <div className={styles.searchSelfMain}>
                <span className={styles.searchSelfHead}>
                  Nominate yourself
                </span>
                <span className={styles.searchSelfSub}>
                  Hi {viewerName.split(" ")[0]}. Take the seat.
                </span>
              </div>
              <span className={styles.searchSelfArrow}>→</span>
            </button>
          )}
          <div style={{ marginTop: picked ? 0 : "0.85rem" }}>
            <BallotUserSearch
              value={picked}
              pickedMajor={picked?.major}
              onPick={(u) =>
                setPicked({
                  id: u.id,
                  name: u.name,
                  email: u.email,
                  image: u.image,
                  major: null,
                })
              }
              onClear={() => setPicked(null)}
            />
          </div>
        </div>
      </BallotProcedural>

      <BallotProcedural number="03" title="Confirm" delay={0.1}>
        <div className={`${styles.submitWrap} ${formIsLocked ? styles.disabledStamp : ""}`}>
          <button
            type="button"
            className={styles.submit}
            onClick={onSubmit}
            disabled={
              submitting || !selectedOfficeId || !picked || formIsLocked
            }
          >
            {submitting ? "STAMPING…" : "SUBMIT NOMINATION"}{" "}
            <span className={styles.submitArrow}>→</span>
          </button>
          <p className={styles.submitHelp}>
            Nominees get an email asking them to accept or decline. You can
            nominate as many people as you like — one position at a time.
          </p>
        </div>
      </BallotProcedural>

      {!isMember && (
        <div
          style={{
            padding: "1.25rem clamp(1.25rem, 4vw, 4rem) 0",
            fontFamily: "var(--font-body), serif",
            fontStyle: "italic",
            color: "var(--ink-mid)",
            maxWidth: "60ch",
          }}
        >
          You&rsquo;re signed in but not on this term&rsquo;s membership rolls.
          Earn a membership at any SSE event, then come back to nominate.
        </div>
      )}
    </>
  );
}

function OfficeRow({
  office,
  selected,
  onSelect,
}: {
  office: NominateOffice;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <li>
      <label
        className={`${styles.officeOption} ${
          selected ? styles.officeOptionSelected : ""
        }`}
      >
        <span className={styles.officeBullet} aria-hidden />
        <input
          type="radio"
          name="office"
          value={office.id}
          checked={selected}
          onChange={onSelect}
          style={{
            position: "absolute",
            opacity: 0,
            pointerEvents: "none",
          }}
        />
        <div>
          <div className={styles.officeOptionTitle}>{office.title}</div>
          <div className={styles.officeOptionDesc}>{office.description}</div>
          {office.incumbent && (
            <div className={styles.officeIncumbentChip}>
              Currently · {office.incumbent.name}
            </div>
          )}
        </div>
        <span className={styles.officeChevron} aria-hidden>
          →
        </span>
      </label>
    </li>
  );
}

function ExplainerTiles({
  isOpen,
  closesAt,
  votingOpensAt,
}: {
  isOpen: boolean;
  closesAt: string | null;
  votingOpensAt: string | null;
}) {
  const tiles = isOpen
    ? [
        {
          number: "01 / WHO",
          title: "Who can nominate?",
          body: "Any active SSE member — that means at least one membership earned this term, or last term during the first two weeks of a new one.",
          tilt: styles.tileA,
        },
        {
          number: "02 / WHAT",
          title: "Who can run?",
          body: "Any RIT student who&apos;ll stay enrolled through the officer year. Eligibility is reviewed after the nominee accepts.",
          tilt: styles.tileB,
        },
        {
          number: "03 / NEXT",
          title: "What happens next?",
          body: closesAt
            ? `The window closes ${closesAt}. Voting opens ${votingOpensAt ?? "shortly after"} and runs for one week.`
            : "Voting opens after nominations close, and runs for one week.",
          tilt: styles.tileC,
        },
      ]
    : [
        {
          number: "01 / EARN",
          title: "Earn a membership",
          body: "Show up to any SSE event and swipe in. Memberships are tracked term by term — you&apos;ll need at least one to nominate or vote.",
          tilt: styles.tileA,
        },
        {
          number: "02 / READ",
          title: "Read the constitution",
          body: "Knowing what each role actually does makes you a better nominator (and a better officer if you decide to run).",
          tilt: styles.tileB,
        },
        {
          number: "03 / WATCH",
          title: "Watch this page",
          body: "When the next ballot opens, this page lights up. No emails, no notifications — just open it in a tab.",
          tilt: styles.tileC,
        },
      ];

  return (
    <section className={styles.tiles}>
      {tiles.map((tile) => (
        <motion.article
          key={tile.title}
          className={`${styles.tile} ${tile.tilt}`}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className={styles.tileNumber}>{tile.number}</span>
          <h3>{tile.title}</h3>
          <p dangerouslySetInnerHTML={{ __html: tile.body }} />
        </motion.article>
      ))}
    </section>
  );
}

function ReceiptSection({
  receipt,
  electionSlug,
  onAgain,
}: {
  receipt: ReceiptState;
  electionSlug: string;
  onAgain: () => void;
}) {
  return (
    <BallotProcedural number="✓" title="Stamped & Filed">
      <BallotReceipt
        serialNumber={receipt.serial}
        nominatorName={receipt.nominatorName}
        nomineeName={receipt.nomineeName}
        position={receipt.position}
        electionSlug={electionSlug}
        onNominateAnother={onAgain}
      />
    </BallotProcedural>
  );
}
