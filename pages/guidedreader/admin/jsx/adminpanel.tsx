import { useState } from 'react';
import styles from '../styles/admin.module.css';
import User from './user/user';
import Annotation, { EditAnnotationModal } from './annotation/annotation';
import Text from './text/text';

// menu type for admin panel loading api stuff
type MenuType = {
    [key: string]: JSX.Element;
};

const AdminPanel = ({ userPermissions }: { userPermissions: string[] }) => {
    const [currentMenu, setCurrentMenu] = useState("");

    // for modfying annotations
    const [currentAnnotation, setCurrentAnnotation] = useState<any>(null);
    const [creatingAnnotation, setCreatingAnnotation] = useState(false);

    // menus for the admin panel
    const MENUS: MenuType = {
        "User": <User userPermissions={userPermissions} />,
        "Annotation": <Annotation userPermissions={userPermissions} setCurrentAnnotation={setCurrentAnnotation} setCreatingAnnotation={setCreatingAnnotation} />,
        "Text": <Text userPermissions={userPermissions} />
    };

    return (
        <>
            {creatingAnnotation && (
                <EditAnnotationModal setCreatingAnnotation={setCreatingAnnotation} annotation={currentAnnotation} />
            )}
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
                </div>
                <div className={styles.currentMenu}>
                    {currentMenu && MENUS[currentMenu]}
                </div>
            </div>
        </>
    );
}

export default AdminPanel;