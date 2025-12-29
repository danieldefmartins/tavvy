import { Check } from 'lucide-react';

const valueItems = [
  {
    bold: 'Filter by your memberships',
    rest: ' (KOA, Thousand Trails, & more)',
  },
  {
    bold: 'See real RV-specific signals,',
    rest: ' not just star ratings',
  },
  {
    bold: 'Works offline',
    rest: ' when you need it most',
  },
];

export function ValueChecklist() {
  return (
    <section className="bg-card rounded-2xl border border-border p-6 mx-4 -mt-8 relative z-10 shadow-card">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide text-center mb-4">
        VALUE CHECKLIST
      </p>
      <div className="space-y-3">
        {valueItems.map((item, index) => (
          <div key={index} className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Check className="w-4 h-4 text-primary" />
            </div>
            <p className="text-base text-foreground">
              <span className="font-semibold">{item.bold}</span>
              <span className="text-muted-foreground">{item.rest}</span>
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
