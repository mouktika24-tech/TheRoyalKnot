import { motion } from 'framer-motion';
import { ArrowDownRight, ArrowUpRight, BriefcaseBusiness, IndianRupee, TrendingUp, Wallet } from 'lucide-react';

const sampleKpis = [
  { label: 'Season revenue', value: '₹1,84,50,000', change: '+12.8%', trend: 'up', icon: IndianRupee },
  { label: 'Vendor disbursements', value: '₹1,21,30,000', change: '+8.2%', trend: 'down', icon: Wallet },
  { label: 'Net agency profit', value: '₹63,20,000', change: '+16.4%', trend: 'up', icon: TrendingUp },
  { label: 'Active weddings', value: '25', change: 'Across this season', trend: 'up', icon: BriefcaseBusiness },
];

const sampleWeddings = [
  { id: 1, couple: 'Aarav & Meera', venue: 'Rambagh Palace', revenue: '₹28,00,000', costs: '₹19,60,000', margin: '30%' },
  { id: 2, couple: 'Kabir & Saanvi', venue: 'The Oberoi Udaivilas', revenue: '₹34,50,000', costs: '₹24,15,000', margin: '30%' },
  { id: 3, couple: 'Vihaan & Ananya', venue: 'Samode Palace', revenue: '₹22,00,000', costs: '₹15,40,000', margin: '30%' },
];

function FounderSeasonDashboard({ kpis = sampleKpis, weddings = sampleWeddings, loading = false, error = null }) {
  return (
    <section aria-labelledby="season-dashboard-title" className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-royalMaroon">The Royal Knot</p>
          <h2 id="season-dashboard-title" className="text-2xl font-semibold text-slateNavy sm:text-3xl">Founder&apos;s Season Review</h2>
        </div>
        <p className="rounded-full border border-champagneGold/40 bg-creamIvory px-3 py-1.5 text-sm font-medium text-slateNavy">2026–27 Season</p>
      </header>

      {error && (
        <p role="alert" className="rounded-xl border border-rubyDanger/30 bg-rubyDanger/10 px-4 py-3 text-sm text-rubyDanger">
          {error}
        </p>
      )}

      {loading ? (
        <p role="status" className="rounded-2xl border border-champagneGold/30 bg-creamIvory px-4 py-10 text-center text-sm text-slateNavy/60">
          Loading season performance…
        </p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {kpis.map(({ label, value, change, trend, icon: Icon }, index) => (
              <motion.article
                key={label}
                className="rounded-2xl border border-champagneGold/30 bg-creamIvory p-5 shadow-sm"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
              >
                <div className="flex items-center justify-between">
                  <span className="rounded-xl bg-champagneGoldLight p-2.5 text-royalMaroon" aria-hidden="true">
                    <Icon size={20} />
                  </span>
                  <span className={`inline-flex items-center gap-1 text-xs font-semibold ${trend === 'up' ? 'text-emeraldSuccess' : 'text-rubyDanger'}`}>
                    {trend === 'up' ? <ArrowUpRight size={15} aria-hidden="true" /> : <ArrowDownRight size={15} aria-hidden="true" />}
                    {change}
                  </span>
                </div>
                <p className="mt-5 text-sm text-slateNavy/65">{label}</p>
                <p className="mt-1 text-2xl font-semibold tracking-tight text-slateNavy">{value}</p>
              </motion.article>
            ))}
          </div>

          <section aria-labelledby="wedding-performance-title" className="overflow-hidden rounded-2xl border border-champagneGold/30 bg-creamIvory shadow-sm">
            <div className="border-b border-champagneGold/30 px-5 py-4 sm:px-6">
              <h3 id="wedding-performance-title" className="font-semibold text-slateNavy">Wedding P&amp;L Overview</h3>
              <p className="mt-1 text-sm text-slateNavy/60">Revenue, vendor costs, and margin by wedding</p>
            </div>
            {weddings.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-slateNavy/60">No wedding performance data available.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[44rem] text-left text-sm">
                  <caption className="sr-only">Season revenue and cost by wedding</caption>
                  <thead className="bg-slateLight text-xs uppercase tracking-wide text-slateNavy/65">
                    <tr>
                      <th scope="col" className="px-5 py-3 font-semibold">Couple</th>
                      <th scope="col" className="px-5 py-3 font-semibold">Venue</th>
                      <th scope="col" className="px-5 py-3 font-semibold">Revenue</th>
                      <th scope="col" className="px-5 py-3 font-semibold">Vendor costs</th>
                      <th scope="col" className="px-5 py-3 font-semibold">Margin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-champagneGold/20">
                    {weddings.map((wedding) => (
                      <tr key={wedding.id} className="hover:bg-white/70">
                        <th scope="row" className="whitespace-nowrap px-5 py-4 font-medium text-slateNavy">{wedding.couple}</th>
                        <td className="px-5 py-4 text-slateNavy/70">{wedding.venue}</td>
                        <td className="whitespace-nowrap px-5 py-4 text-slateNavy">{wedding.revenue}</td>
                        <td className="whitespace-nowrap px-5 py-4 text-slateNavy">{wedding.costs}</td>
                        <td className="px-5 py-4">
                          <span className="rounded-full bg-emeraldSuccess/10 px-2.5 py-1 text-xs font-semibold text-emeraldSuccess">{wedding.margin}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </section>
  );
}

export default FounderSeasonDashboard;
