import Link from "next/link";

const Footer = () => {
    return (
        <footer className="bg-blue-900 text-white pt-12 pb-6">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="col-span-1 md:col-span-2">
                        <h3 className="text-xl font-bold mb-4">JOB PORTAL</h3>
                        <p className="text-blue-200 text-sm mb-4">
                            Job Portal is the most trusted website for government job updates in India.
                            We provide the latest information about various exams, results, admit cards, and job notifications.
                        </p>
                    </div>
                    <div>
                        <h4 className="text-lg font-semibold mb-4 underline decoration-red-500 underline-offset-4">Quick Links</h4>
                        <ul className="space-y-2 text-sm text-blue-200">
                            <li><Link href="/category/latest-jobs" className="hover:text-white transition-colors">Latest Jobs</Link></li>
                            <li><Link href="/category/admit-card" className="hover:text-white transition-colors">Admit Card</Link></li>
                            <li><Link href="/category/result" className="hover:text-white transition-colors">Results</Link></li>
                            <li><Link href="/category/answer-key" className="hover:text-white transition-colors">Answer Key</Link></li>
                            <li><Link href="/category/syllabus" className="hover:text-white transition-colors">Syllabus</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-lg font-semibold mb-4 underline decoration-red-500 underline-offset-4">Important Info</h4>
                        <ul className="space-y-2 text-sm text-blue-200">
                            <li><Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
                            <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
                            <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                            <li><Link href="/disclaimer" className="hover:text-white transition-colors">Disclaimer</Link></li>
                        </ul>
                    </div>
                </div>
                <div className="border-t border-blue-800 mt-12 pt-6 text-center text-sm text-blue-300">
                    <p>© 2026 Job Portal. All Rights Reserved.</p>
                    <p className="mt-1">Handcrafted with ❤️ for Indian Aspirants</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
