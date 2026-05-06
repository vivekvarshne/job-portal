import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  Timestamp 
} from "firebase/firestore";
import { db } from "../firebase";

export interface Job {
  id?: string;
  title: string;
  slug: string;
  category: "latest-jobs" | "admit-card" | "result" | "answer-key" | "syllabus" | "admission" | "documents";
  department: string;
    importantDates: {
    start: string;
    end: string;
    examDate?: string;
    resultDate?: string;
    customDates?: { label: string; date: string }[];
  };
  applicationFee: string;
  categoryFees?: { category: string; fee: number | string }[];
  ageLimit: string;
  totalPosts?: string;
  vacancyDetails: {
    postName: string;
    totalPost: number;
    eligibility: string;
  }[];
  applyLink: string;
  externalLinks?: { title: string; url: string }[];
  sidebarLinks?: { title: string; url: string }[];
  pdfUrl?: string;
  requiredDocuments?: string[];
  formFee?: number;
  originalFormFee?: number;
  contentSections?: {
    id: string;
    title: string;
    type: "table" | "bullets" | "rich-text" | "jobs-list";
    tableData?: {
        headers: string[];
        rows: { cells: string[] }[];
    };
    listData?: string[];
    textData?: string;
    category?: string;
  }[];
  seoTitle: string;
  seoDescription: string;
  shortDescription?: string;
  posterUrl?: string;
  status: "draft" | "published";
  createdAt: any;
  showFormFillingHelp?: boolean;
}

const JOBS_COLLECTION = "jobs";

export const addJob = async (job: Omit<Job, "id" | "createdAt">) => {
  return await addDoc(collection(db, JOBS_COLLECTION), {
    ...job,
    createdAt: Timestamp.now(),
  });
};

export const updateJob = async (id: string, job: Partial<Job>) => {
  const jobRef = doc(db, JOBS_COLLECTION, id);
  await updateDoc(jobRef, job);
};

export const deleteJob = async (id: string) => {
  const jobRef = doc(db, JOBS_COLLECTION, id);
  await deleteDoc(jobRef);
};

export const getJobById = async (id: string) => {
  const docRef = doc(db, JOBS_COLLECTION, id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as Job;
};

export const getJobBySlug = async (slug: string) => {
  const q = query(collection(db, JOBS_COLLECTION), where("slug", "==", slug), limit(1));
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) return null;
  const docSnap = querySnapshot.docs[0];
  return { id: docSnap.id, ...docSnap.data() } as Job;
};

export const getJobsByCategory = async (category: string, onlyPublished = true, maxLimit?: number) => {
  const constraints: any[] = [where("category", "==", category)];
  if (onlyPublished) {
    constraints.push(where("status", "==", "published"));
  }
  constraints.push(orderBy("createdAt", "desc"));
  if (maxLimit) {
    constraints.push(limit(maxLimit));
  }
  const q = query(collection(db, JOBS_COLLECTION), ...constraints);
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Job[];
};

export const getLatestJobs = async (max = 10) => {
  const q = query(
    collection(db, JOBS_COLLECTION), 
    where("status", "==", "published"),
    orderBy("createdAt", "desc"), 
    limit(max)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Job[];
};

export const getAllJobs = async () => {
  const q = query(collection(db, JOBS_COLLECTION), orderBy("createdAt", "desc"));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Job[];
};
