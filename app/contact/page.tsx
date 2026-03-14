import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function ContactUs() {
    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <Header />
            <main className="flex-grow container mx-auto px-4 py-12">
                <div className="max-w-3xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-gray-200">
                    <h1 className="text-3xl font-bold text-blue-900 mb-6 border-b pb-4">Contact Us</h1>
                    
                    <div className="space-y-6 text-gray-700">
                        <p>
                            We value your feedback and inquiries. If you have any questions about Job Portal, 
                            job notifications, admit cards, or any other information, feel free to reach out to us.
                        </p>
                        
                        <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
                            <h2 className="text-xl font-bold text-blue-900 mb-4">Get in Touch</h2>
                            
                            <div className="space-y-4">
                                <div>
                                    <h3 className="font-semibold text-gray-900">Email Address:</h3>
                                    <p className="text-blue-700">jobportalinker@gmail.com</p>
                                </div>
                                
                                <div>
                                    <h3 className="font-semibold text-gray-900">Working Hours:</h3>
                                    <p>Monday - Friday: 10:00 AM to 6:00 PM (IST)</p>
                                </div>
                            </div>
                        </div>

                        <p className="text-sm text-gray-500 mt-8">
                            Please allow 24-48 hours for our team to respond to your queries. 
                            For business inquiries and advertising, please use the same email address 
                            with the subject line "Business Inquiry".
                        </p>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
