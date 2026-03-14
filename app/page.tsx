import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Marquee from "@/components/ui/Marquee";
import JobSection from "@/components/ui/JobSection";
import AdBanner from "@/components/AdBanner";
import { getJobsByCategory, getLatestJobs } from "@/lib/db/jobs";

export default async function Home() {
  // Fetch real data from Firebase
  // Note: These will return empty arrays initially until data is added via Admin panel
  const latestJobs = await getLatestJobs(15);
  const admitCards = await getJobsByCategory("admit-card");
  const results = await getJobsByCategory("result");
  const answerKeys = await getJobsByCategory("answer-key");
  const syllabus = await getJobsByCategory("syllabus");
  const admission = await getJobsByCategory("admission");
  const documents = await getJobsByCategory("documents");

  const breakingNews = [
    "SSC CGL 2026 Tier 1 Admit Card Released - Download Now",
    "UPSC Civil Services Prelims 2026 Notification Out",
    "RRB NTPC Phase 2 Exam Dates Announced",
    "IBPS PO Interview Call Letter Available"
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow">
        <Marquee news={breakingNews} />

        <div className="container mx-auto px-4 py-8">
          {/* Welcome Section */}
          <div className="bg-white p-6 rounded-lg border shadow-sm mb-8 text-center border-blue-100">
            <h1 className="text-2xl md:text-3xl font-extrabold text-blue-900 mb-2">
              JOB PORTAL - OFFICIAL WEBSITE
            </h1>
            <p className="text-sm text-gray-600 font-medium">
              Join us to get the latest government job notifications, admit cards, and exam results.
              The most trusted platform for millions of aspirants.
            </p>
          </div>

          <AdBanner position="header" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <JobSection title="Latest Jobs" category="latest-jobs" jobs={latestJobs} />
            <JobSection title="Admit Card" category="admit-card" jobs={admitCards} />
            <JobSection title="Results" category="result" jobs={results} />
            <JobSection title="Answer Key" category="answer-key" jobs={answerKeys} />
            <JobSection title="Syllabus" category="syllabus" jobs={syllabus} />
            <JobSection title="Admission" category="admission" jobs={admission} />
            <JobSection title="Documents" category="documents" jobs={documents} />

            {/* Useful Links / More Section */}
            <div className="bg-white border-2 border-red-600 rounded-lg overflow-hidden shadow-sm">
              <div className="bg-red-600 text-white px-4 py-2">
                <h2 className="font-bold uppercase tracking-wide text-center">Important Links</h2>
              </div>
              <div className="p-4 grid grid-cols-1 gap-2">
                <a href="#" className="p-2 border rounded text-sm text-blue-700 font-semibold hover:bg-blue-50 text-center">UP Scholarship Registration</a>
                <a href="#" className="p-2 border rounded text-sm text-blue-700 font-semibold hover:bg-blue-50 text-center">Aadhar Card Download</a>
                <a href="#" className="p-2 border rounded text-sm text-blue-700 font-semibold hover:bg-blue-50 text-center">Pan Card Online Form</a>
                <a href="#" className="p-2 border rounded text-sm text-blue-700 font-semibold hover:bg-blue-50 text-center">UP Ration Card List</a>
                <a href="#" className="p-2 border rounded text-sm text-blue-700 font-semibold hover:bg-blue-50 text-center">Voter ID Card Online</a>
              </div>
            </div>
          </div>

          <AdBanner position="footer" />
        </div>
      </main>

      <Footer />
    </div>
  );
}
