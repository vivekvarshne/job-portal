import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function AboutUs() {
    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <Header />
            <main className="flex-grow container mx-auto px-4 py-12">
                <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 rounded-xl shadow-sm border border-gray-200">
                    <h1 className="text-3xl font-bold text-blue-900 mb-6 border-b pb-4">About Job Portal</h1>
                    
                    <div className="space-y-6 text-gray-700 leading-relaxed text-left">
                        <p>
                            Welcome to <strong>Job Portal</strong>, India's most trusted and reliable platform for government job 
                            notifications, admit cards, exam results, syllabi, and admission updates.
                        </p>

                        <h2 className="text-2xl font-bold text-blue-900 mt-8 mb-4">Our Mission</h2>
                        <p>
                            Our primary mission is to simplify the process of finding government jobs for millions of aspirants 
                            across India. We understand that navigating through various official websites to find accurate and 
                            timely information can be overwhelming. Job Portal acts as a centralized dashboard where 
                            students can find all the latest updates in one place, categorized neatly for easy access.
                        </p>

                        <h2 className="text-2xl font-bold text-blue-900 mt-8 mb-4">What We Provide</h2>
                        <ul className="list-disc pl-6 space-y-2">
                            <li><strong>Latest Jobs:</strong> Instant notifications for upcoming UPSC, SSC, Banking, Railway, and State government jobs.</li>
                            <li><strong>Admit Cards:</strong> Direct download links for hall tickets and exam call letters.</li>
                            <li><strong>Results:</strong> Fast and accurate updates on exam results and merit lists.</li>
                            <li><strong>Answer Keys:</strong> Prompt availability of official provisional and final answer keys.</li>
                            <li><strong>Syllabus & Pattern:</strong> Detailed exam syllabi to help you prepare better.</li>
                            <li><strong>Admissions:</strong> Updates on major university and college admission forms.</li>
                        </ul>

                        <h2 className="text-2xl font-bold text-blue-900 mt-8 mb-4">Why Choose Us?</h2>
                        <p>
                            Since our inception, we have strived to maintain accuracy and speed. We aggregate data from 
                            official sources, leading employment news portals, and government gazettes to ensure that 
                            the information we provide is authentic. Our user-friendly interface is designed to work seamlessly 
                            on both desktops and mobile devices, ensuring you never miss an important update, even on the go.
                        </p>

                        <div className="bg-blue-50 border-l-4 border-blue-600 p-4 mt-8">
                            <p className="italic text-blue-900 font-medium">
                                "Empowering the youth of India by connecting them with the right opportunities at the right time."
                            </p>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
