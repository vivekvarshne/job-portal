import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Marquee from "@/components/ui/Marquee";
import JobSection from "@/components/ui/JobSection";
import AdBanner from "@/components/AdBanner";
import { getJobsByCategory, getLatestJobs } from "@/lib/db/jobs";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export const dynamic = "force-dynamic";

export default async function Home() {
  // Fetch real data from Firebase
  // Note: These will return empty arrays initially until data is added via Admin panel
  const latestJobs = await getJobsByCategory("latest-jobs");
  const admitCards = await getJobsByCategory("admit-card");
  const results = await getJobsByCategory("result");
  const answerKeys = await getJobsByCategory("answer-key");
  const syllabus = await getJobsByCategory("syllabus");
  const admission = await getJobsByCategory("admission");
  const documents = await getJobsByCategory("documents");

  let breakingNews: {title: string, url?: string}[] = [];
  let importantLinks: {title: string, url?: string}[] = [];
  let featuredBoxes: {title: string, url: string, color: string}[] = [];
  
  try {
      const siteDoc = await getDoc(doc(db, "settings", "site"));
      if (siteDoc.exists()) {
          const data = siteDoc.data();
          if (data.breakingNews && Array.isArray(data.breakingNews)) {
             breakingNews = data.breakingNews;
          }
          if (data.importantLinks && Array.isArray(data.importantLinks)) {
             importantLinks = data.importantLinks;
          }
          if (data.featuredBoxes && Array.isArray(data.featuredBoxes)) {
             featuredBoxes = data.featuredBoxes;
          }
      }
  } catch (error) {
      console.error("Failed to load site settings", error);
  }

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

          {/* Featured Boxes Section */}
          {featuredBoxes && featuredBoxes.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {featuredBoxes.map((box, idx) => (
                <a
                  key={idx}
                  href={box.url}
                  className="flex items-center justify-center p-4 rounded-lg text-white font-bold text-center text-sm md:text-base shadow-md hover:scale-[1.02] transition-transform min-h-[80px]"
                  style={{ backgroundColor: box.color }}
                >
                  {box.title}
                </a>
              ))}
            </div>
          )}

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
                {importantLinks.map((link, idx) => (
                  <a 
                    key={idx} 
                    href={link.url || "#"} 
                    target={link.url && link.url !== "#" ? "_blank" : "_self"} 
                    rel={link.url && link.url !== "#" ? "noopener noreferrer" : ""}
                    className="p-2 border rounded text-sm text-blue-700 font-semibold hover:bg-blue-50 text-center transition-colors"
                  >
                    {link.title}
                  </a>
                ))}
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
