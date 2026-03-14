import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <Header />
            <main className="flex-grow container mx-auto px-4 py-12">
                <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 rounded-xl shadow-sm border border-gray-200">
                    <h1 className="text-3xl font-bold text-blue-900 mb-6 border-b pb-4">Privacy Policy</h1>
                    
                    <div className="space-y-6 text-gray-700 leading-relaxed text-left">
                        <p>
                            At Job Portal, accessible from our website, one of our main priorities is the privacy of our visitors. 
                            This Privacy Policy document contains types of information that is collected and recorded by Job Portal 
                            and how we use it.
                        </p>

                        <h2 className="text-xl font-bold text-gray-900 mt-6 mb-3">1. Information We Collect</h2>
                        <p>
                            The personal information that you are asked to provide, and the reasons why you are asked to provide it, 
                            will be made clear to you at the point we ask you to provide your personal information.
                        </p>
                        <p>
                            If you contact us directly, we may receive additional information about you such as your name, email address, 
                            phone number, the contents of the message and/or attachments you may send us, and any other information 
                            you may choose to provide.
                        </p>
                        <p>
                            When you register for an Account (e.g., as a Vendor), we may ask for your contact information, including items 
                            such as name, company name, address, email address, and telephone number.
                        </p>

                        <h2 className="text-xl font-bold text-gray-900 mt-6 mb-3">2. How We Use Your Information</h2>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Provide, operate, and maintain our website.</li>
                            <li>Improve, personalize, and expand our website.</li>
                            <li>Understand and analyze how you use our website.</li>
                            <li>Develop new products, services, features, and functionality.</li>
                            <li>Communicate with you, either directly or through one of our partners, including for customer service and updates.</li>
                            <li>Process your transactions and manage your subscriptions.</li>
                            <li>Find and prevent fraud.</li>
                        </ul>

                        <h2 className="text-xl font-bold text-gray-900 mt-6 mb-3">3. Log Files</h2>
                        <p>
                            Job Portal follows a standard procedure of using log files. These files log visitors when they visit websites. 
                            The information collected by log files includes internet protocol (IP) addresses, browser type, Internet Service Provider (ISP), 
                            date and time stamp, referring/exit pages, and possibly the number of clicks. These are not linked to any information that is personally identifiable.
                        </p>

                        <h2 className="text-xl font-bold text-gray-900 mt-6 mb-3">4. Cookies and Web Beacons</h2>
                        <p>
                            Like any other website, Job Portal uses "cookies". These cookies are used to store information including visitors' preferences, 
                            and the pages on the website that the visitor accessed or visited. The information is used to optimize the users' experience by customizing 
                            our web page content based on visitors' browser type and/or other information.
                        </p>

                        <h2 className="text-xl font-bold text-gray-900 mt-6 mb-3">5. Third-Party Privacy Policies</h2>
                        <p>
                            Job Portal's Privacy Policy does not apply to other advertisers or websites. Thus, we are advising you to consult the respective 
                            Privacy Policies of these third-party ad servers for more detailed information.
                        </p>

                        <h2 className="text-xl font-bold text-gray-900 mt-6 mb-3">6. Consent</h2>
                        <p>
                            By using our website, you hereby consent to our Privacy Policy and agree to its terms.
                        </p>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
