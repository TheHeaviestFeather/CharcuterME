import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy - CharcuterME',
  description: 'Privacy policy for CharcuterME - AI-powered girl dinner generator',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#FAF9F7] py-12 px-6">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/"
          className="text-[#A47864] hover:text-[#8B6B5D] text-sm mb-8 inline-block"
        >
          &larr; Back to app
        </Link>

        <h1 className="font-serif text-3xl text-[#5D4E45] mb-8">Privacy Policy</h1>

        <div className="prose prose-stone max-w-none space-y-6 text-[#6B5B4F]">
          <p className="text-sm text-[#736B63]">
            Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>

          <section>
            <h2 className="text-xl font-serif text-[#5D4E45] mt-8 mb-4">What We Collect</h2>
            <p>
              CharcuterME is designed with privacy in mind. We collect minimal data:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li><strong>Ingredient text:</strong> The ingredients you type are sent to our AI services to generate names and images. We do not permanently store this data.</li>
              <li><strong>Photos you upload:</strong> If you use the vibe check feature, your photo is sent to our AI service for analysis and then immediately discarded. We do not store your photos.</li>
              <li><strong>Anonymous usage data:</strong> We may use error tracking (Sentry) to identify and fix bugs. This does not include personally identifiable information.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-serif text-[#5D4E45] mt-8 mb-4">AI Services</h2>
            <p>
              We use third-party AI services to power CharcuterME:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li><strong>Anthropic (Claude):</strong> Generates dinner names</li>
              <li><strong>Google (Imagen):</strong> Creates food illustrations</li>
              <li><strong>OpenAI (GPT-4o):</strong> Analyzes photos for vibe checks</li>
            </ul>
            <p className="mt-2">
              Data sent to these services is processed according to their respective privacy policies.
              We do not share your data with any other third parties.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-serif text-[#5D4E45] mt-8 mb-4">No Account Required</h2>
            <p>
              CharcuterME does not require you to create an account. We do not collect your email,
              name, or any other personal information.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-serif text-[#5D4E45] mt-8 mb-4">Cookies</h2>
            <p>
              We do not use cookies for tracking. Any cookies present are strictly necessary
              for the app to function (e.g., session management by our hosting provider).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-serif text-[#5D4E45] mt-8 mb-4">Data Retention</h2>
            <p>
              We do not permanently store your ingredients or photos. Generated names and images
              may be cached temporarily (up to 7 days) to improve performance and reduce costs.
              Cache data is automatically deleted after this period.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-serif text-[#5D4E45] mt-8 mb-4">Your Rights</h2>
            <p>
              Since we don&apos;t collect personal data, there&apos;s nothing to delete or export.
              If you have any privacy concerns, please contact us.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-serif text-[#5D4E45] mt-8 mb-4">Changes</h2>
            <p>
              We may update this policy from time to time. Significant changes will be noted
              at the top of this page.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-serif text-[#5D4E45] mt-8 mb-4">Contact</h2>
            <p>
              Questions about this policy? Reach out to us through our GitHub repository.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-[#E8B4A0]">
          <Link
            href="/"
            className="text-[#A47864] hover:text-[#8B6B5D]"
          >
            &larr; Back to CharcuterME
          </Link>
        </div>
      </div>
    </div>
  );
}
