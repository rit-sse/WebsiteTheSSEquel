import { Card } from "@/components/ui/card";
import { Check } from "lucide-react";

interface TierProps {
  name: string;
  price: string;
  benefits: string[];
  featured?: boolean;
}

function TierCard({ name, price, benefits, featured }: TierProps) {
  return (
    <Card 
      depth={featured ? 3 : 2} 
      className={`p-6 h-full flex flex-col ${featured ? "border-primary border-2" : ""}`}
    >
      {featured && (
        <div className="text-xs font-semibold text-primary uppercase tracking-wide mb-2">
          Most Popular
        </div>
      )}
      <h3 className="text-xl font-bold font-display mb-1">{name}</h3>
      <p className="text-2xl font-bold text-primary mb-4">
        {price}
        <span className="text-sm font-normal text-muted-foreground ml-1">minimum</span>
      </p>
      <ul className="space-y-3 flex-grow">
        {benefits.map((benefit, index) => (
          <li key={index} className="flex items-start gap-2">
            <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <span className="text-muted-foreground">{benefit}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export default function SponsorshipTiers() {
  const tiers: TierProps[] = [
    {
      name: "Tier 1 — Visibility",
      price: "$1,000",
      benefits: [
        "Logo displayed on the SSE website",
        "Logo printed on the annual SSE T-shirt",
      ],
    },
    {
      name: "Tier 2 — Engagement",
      price: "$3,000",
      benefits: [
        "Hold recruiting talks or on-campus interviews in the SSE lab",
        "Sponsor a student project and be credited in the SSE Project Book",
        "Name listed on mentor program schedules and materials",
      ],
      featured: true,
    },
    {
      name: "Tier 3 — Premium Access",
      price: "$5,000",
      benefits: [
        "Access to the SSE Resume Book (officers, mentors, and top contributors)",
        "Company branding displayed inside the SSE lab",
        "Sponsor a team for a hackathon or conference",
        "Logo included on mentor appreciation gifts each semester",
      ],
    },
  ];

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {tiers.map((tier) => (
        <TierCard key={tier.name} {...tier} />
      ))}
    </div>
  );
}
