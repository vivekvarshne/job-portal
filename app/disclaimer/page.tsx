import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function Disclaimer() {
    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <Header />
            <main className="flex-grow container mx-auto px-4 py-12">
                <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 rounded-xl shadow-sm border border-gray-200">
                    <h1 className="text-3xl font-bold text-blue-900 mb-6 border-b pb-4">Disclaimer</h1>
                    
                    <div className="space-y-6 text-gray-700 leading-relaxed text-left">
                        <p>
                            If you require any more information or have any questions about our site's disclaimer, 
                            please feel free to contact us by email at jobportalinker@gmail.com.
                        </p>

                        <h2 className="text-xl font-bold text-gray-900 mt-6 mb-3">Disclaimers for Job Portal</h2>
                        
                        <div className="bg-red-50 border-l-4 border-red-600 p-4 my-4">
                            <p className="font-medium text-red-900">
                                <strong>Important Note:</strong> We are NOT an official government website. We do not represent any 
                                government entity, board, or commission. We are a private educational portal that collects information 
                                from various official sources to help job seekers.
                            </p>
                        </div>

                        <p>
                            All the information on this website is published in good faith and for general information purpose only. 
                            Job Portal does not make any warranties about the completeness, reliability, and accuracy of this information. 
                            Any action you take upon the information you find on this website (Job Portal), is strictly at your own risk. 
                            Job Portal will not be liable for any losses and/or damages in connection with the use of our website.
                        </p>

                        <h2 className="text-xl font-bold text-gray-900 mt-6 mb-3">External Links</h2>
                        <p>
                            From our website, you can visit other websites by following hyperlinks to such external sites. While we strive to 
                            provide only quality links to useful and ethical websites, we have no control over the content and nature of these sites. 
                            These links to other websites do not imply a recommendation for all the content found on these sites. Site owners and content 
                            may change without notice and may occur before we have the opportunity to remove a link which may have gone 'bad'.
                        </p>

                        <h2 className="text-xl font-bold text-gray-900 mt-6 mb-3">Official Verification</h2>
                        <p>
                            We strongly advise all users to cross-verify the job details, admission forms, admit cards, or any other notifications 
                            with the respective official websites before applying. We are not responsible for any typographical errors or inadvertent 
                            mistakes in the information provided on our portal.
                        </p>

                        <h2 className="text-xl font-bold text-gray-900 mt-6 mb-3">Consent</h2>
                        <p>
                            By using our website, you hereby consent to our disclaimer and agree to its terms.
                        </p>

                        <h2 className="text-xl font-bold text-gray-900 mt-6 mb-3">Update</h2>
                        <p>
                            Should we update, amend or make any changes to this document, those changes will be prominently posted here.
                        </p>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
