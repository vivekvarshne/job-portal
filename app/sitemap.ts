import { getAllJobs } from "@/lib/db/jobs";
import { MetadataRoute } from "next";

export const revalidate = 3600; // Revalidate every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const jobs = await getAllJobs();
  const baseUrl = "https://jobportel.online";

  const jobUrls = jobs.map((job) => ({
    url: `${baseUrl}/job/${job.slug}`,
    lastModified: new Date(job.createdAt?.toDate() || new Date()),
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  const categories = ["latest-jobs", "admit-card", "result", "answer-key", "syllabus"];
  const categoryUrls = categories.map((cat) => ({
    url: `${baseUrl}/${cat}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.9,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "hourly" as const,
      priority: 1,
    },
    ...categoryUrls,
    ...jobUrls,
  ];
}
