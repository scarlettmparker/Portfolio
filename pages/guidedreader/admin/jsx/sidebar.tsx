import { useState } from "react";
import styles from '../styles/user.module.css';
import adminstyles from '../styles/admin.module.css';
import permissions from '../../data/permissions.json';

// permission item component
const PermissionItem = ({ permissionKey, permissionValue, userPermissions, parentKey, isActive, onToggleActive, setCurrentPermission }: {
    permissionKey: string; permissionValue: any; userPermissions: string[]; parentKey: string; isActive: boolean;
    onToggleActive: (key: string) => void; setCurrentPermission: (value: string) => void;
}) => {
    const hasPermission = (perm: string) => {
        return userPermissions.includes(perm) || userPermissions.includes('*') || userPermissions.includes(parentKey);
    };

    // handle toggling nested menu for nested permissions
    const handlePermissionClick = () => {
        const fullPermissionName = `${parentKey}.${permissionKey}`;
        if (typeof permissionValue === 'object' && Object.keys(permissionValue).some(key => key !== 'description')) {
            onToggleActive(fullPermissionName);
        }
        setCurrentPermission(fullPermissionName);
    };

    // render logic for permissions
    if (typeof permissionValue === 'string') {
        return hasPermission(`${parentKey}.${permissionKey}`) ? (
            <span className={`${adminstyles.adminMenu} ${styles.adminMenu}`} onClick={handlePermissionClick}>{permissionValue}</span>
        ) : null;
    } else if (typeof permissionValue === 'object') {
        return hasPermission(`${parentKey}.${permissionKey}`) ? (
            <>
                <span className={`${adminstyles.adminMenu} ${styles.adminMenu}`} onClick={handlePermissionClick}>
                    {permissionValue.description}
                </span>
                {isActive && (
                    <>
                        {Object.keys(permissionValue).map((nestedKey) => (
                            nestedKey !== 'description' && (
                                <PermissionItem key={nestedKey} permissionKey={nestedKey} permissionValue={permissionValue[nestedKey]} userPermissions={userPermissions}
                                    parentKey={`${parentKey}.${permissionKey}`} isActive={isActive} onToggleActive={onToggleActive} setCurrentPermission={setCurrentPermission} />
                            )
                        ))}
                    </>
                )}
            </>
        ) : null;
    }

    return null;
};

// sidebar component
const Sidebar = ({ userPermissions, parentKey, setCurrentPermission }: { userPermissions: string[], parentKey: string, setCurrentPermission(value: string): void }) => {
    const [activeKey, setActiveKey] = useState<string>('');
    const permissionValues: { [key: string]: any } = permissions[parentKey as keyof typeof permissions];

    // handle toggling active state for sidebar items
    const handleToggleActive = (key: string) => {
        setActiveKey((prevKey) => (prevKey === key ? '' : key));
    };

    return (
        <div className={styles.sidebar}>
            {permissionValues && Object.keys(permissionValues).map((key) => (
                (activeKey === '' || activeKey.startsWith(`${parentKey}.${key}`)) && (
                    <PermissionItem key={key} permissionKey={key} permissionValue={permissionValues[key]} userPermissions={userPermissions}
                        parentKey={parentKey} isActive={activeKey === `${parentKey}.${key}`} onToggleActive={handleToggleActive} setCurrentPermission={setCurrentPermission} />
                )
            ))}
        </div>
    );
};

export default Sidebar;