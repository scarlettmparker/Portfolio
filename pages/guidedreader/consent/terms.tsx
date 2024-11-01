import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import styles from './styles/pw.module.css'

function Home() {
    const markdown = `
## Terms of Service for Guided Reader

**Last Updated: 1 November 2024**

Welcome to Guided Reader! By accessing or using this website, you agree to comply with and be bound by these Terms of Service. If you do not agree with any part of these terms, you must not use our services.

### 1. **Acceptance of Terms**

By using Guided Reader, you confirm that you are at least 13 years old or the minimum age required to use Discord in your country, whichever is greater. If you are using the site on behalf of an organization, you represent that you have the authority to bind that organization to these terms.

### 2. **User Submissions**

Guided Reader allows users to submit texts, annotations, translations, and images. You are responsible for the content you submit and ensure that it does not violate any laws or rights of others.

### 3. **Content Guidelines**

You agree not to submit any content that is:

-   Inappropriate, obscene, or offensive
-   Defamatory, threatening, or harassing
-   Infringing on intellectual property rights
-   Misleading or false
-   Spam or unsolicited promotional materials

We reserve the right to review, edit, or remove any content that violates these guidelines or that we deem inappropriate at our discretion.

### 4. **Use of Markdown**

You may use Markdown to format your texts and annotations, including the ability to include images. Ensure that any images you submit are either owned by you or properly licensed for use, and that they do not contain inappropriate or offensive content.

### 5. **Voting System**

Users have the ability to upvote or downvote annotations and texts. This voting system is intended to promote high-quality content. Abuse of this system, such as manipulating votes, is prohibited.

### 6. **Free Use of Tools**

All tools provided on Guided Reader are free to use. We reserve the right to change, suspend, or discontinue any part of our services without prior notice.

### 7. **User Accounts**

You may be required to create an account to access certain features of Guided Reader. You are responsible for maintaining the confidentiality of your account information and for all activities that occur under your account. Notify us immediately of any unauthorized use of your account. We reserve the right to terminate or restrict your account, including making your votes and annotations no longer visible, at our sole discretion and without prior notice if you violate these Terms of Service or engage in any behavior that we deem inappropriate or harmful to the community.

### 8. **Intellectual Property**

All content on Guided Reader is provided for free use. While you are encouraged to use and share the data, you must ensure that your use complies with any applicable laws and does not misrepresent the source of the content. Please respect the contributions of other users and provide proper attribution where necessary.

### 9. **Disclaimer of Warranties**

Guided Reader is provided on an “as-is” and “as available” basis. We do not warrant that the services will be uninterrupted, secure, or error-free. You use the service at your own risk.

### 10. **Limitation of Liability**

To the maximum extent permitted by law, Guided Reader shall not be liable for any indirect, incidental, or consequential damages arising from your use of the site or services.

### 11. **Changes to Terms**

We may update these Terms of Service from time to time. Any changes will be posted on this page with an updated effective date. Your continued use of Guided Reader after any changes constitutes acceptance of the new terms.

### 12. **Governing Law**

These Terms of Service shall be governed by the laws of the United Kingdom of Great Britain and Northern Ireland, without regard to its conflict of law principles.

### 13. **Contact Information**

If you have any questions about these Terms of Service, please contact us at scarwe2020@gmail.com.`

    return (
        <div className={styles.markdown}>
            <Markdown remarkPlugins={[remarkGfm]}>
                {markdown}
            </Markdown>
        </div>
    );
}

export default Home;