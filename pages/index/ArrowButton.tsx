import Image from 'next/image';
import styles from './styles/index.module.css';

// ARROW BUTTON PROPS
type ArrowButtonProps = {
    wrapperStyle: string;
    buttonStyle: string;
    onClick: () => void;
    altText: string;
    rotation: number;
};

// ARROW BUTTON COMPONENT
export const ArrowButton: React.FC<ArrowButtonProps> = ({ wrapperStyle, buttonStyle, onClick, altText, rotation }) => (
    <div className={`${wrapperStyle} ${styles.buttonWrapper}`} onClick={onClick}>
        <button className={buttonStyle}>
            <Image src="/assets/index/images/arrow.png" alt={altText}
                width={30} height={24} style={{ transform: `rotate(${rotation}deg)` }} />
        </button>
    </div>
);