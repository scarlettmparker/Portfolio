import Image from 'next/image';
import styles from './styles/index.module.css';

const helper: React.FC = () => {
    return null;
  };
  
export default helper;

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
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Image src="/assets/index/images/arrow.png" alt={altText}
                    width={30} height={24} style={{ transform: `rotate(${rotation}deg)` }} />
            </div>
        </button>
    </div>
);