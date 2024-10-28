import { useState } from 'react';
import styles from '../styles/admin.module.css';
import User from './user';

// menu type for admin panel loading api stuff
type MenuType = {
    [key: string]: JSX.Element;
};

const AdminPanel = ({ userDetails }: { userDetails: any }) => {
    const [currentMenu, setCurrentMenu] = useState("");

    const MENUS: MenuType = {
        "User": <User userDetails={userDetails} />,
        "Annotation": <div>Annotation Component</div>,
        "Text": <div>Text Component</div>
    };

    return (
        <div className={styles.adminPanelWrapper}>
            <div className={styles.adminSearchWrapper}>
                <div className={styles.adminMenuWrapper}>
                    {Object.keys(MENUS).map((menu, index) => (
                        <div key={index} className={styles.adminMenu} onClick={() => setCurrentMenu(menu)}>
                            <span className={styles.adminMenuText}><li>{menu}</li></span>
                        </div>
                    ))}
                </div>
            </div>
            <div className={styles.adminFlexWrapper}>
                <div className={styles.adminToolbarWrapper} />
                <div>
                    {currentMenu && MENUS[currentMenu]}
                </div>
            </div>
        </div>
    );
}

export default AdminPanel;