import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import styles from './styles/pw.module.css'

function Home() {
    const markdown = `
### Retention Schedule for User Annotations

#### 1. **Annotations Submitted by Users**

-   **Retention Period**: Annotations submitted by users will be retained indefinitely.
    
-   **Conditions for Deletion**:
    
    -   **User-Initiated Deletion**: Users can delete their annotations at any time through their account settings.
    -   **Account Deletion**: If a user chooses to delete their account, all associated annotations will be permanently removed from our system.
    -   **Ban or Suspension**: If a user is banned or suspended from the platform, their annotations may be retained for a period of [specify a time frame, e.g., 30 days] for review purposes. After this period, annotations will be permanently deleted unless otherwise required by law.

#### 2. **User Data and Account Information**

-   **Retention Period**: User account information, including annotations, will be retained as long as the account is active.
    
-   **Conditions for Deletion**:
    
    -   **User-Initiated Deletion**: Users can delete their accounts and all associated data, including annotations, at any time.
    -   **Inactivity**: Accounts that have been inactive for a period of [specify a time frame, e.g., 12 months] may be subject to deletion, along with all associated annotations, after prior notification.

#### 3. **Data Review and Compliance**

-   All retained data, including annotations, will be subject to periodic review to ensure compliance with this retention schedule and any applicable legal requirements.`

    return (
        <div className={styles.markdown}>
            <Markdown remarkPlugins={[remarkGfm]}>
                {markdown}
            </Markdown>
        </div>
    );
}

export default Home;