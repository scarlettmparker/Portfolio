import NextImage from 'next/image';
import infostyles from './styles/info.module.css';

const helper: React.FC = () => {
    return null;
};
  
export default helper;

export const ArrowButton = ({direction, rotation, onClick}: {direction: string, rotation: number, onClick: void}) => {
    return (
        <div className={`${infostyles.arrow} ${direction === 'left' ? infostyles.leftArrow : infostyles.rightArrow}`}>
            <NextImage 
                src="/assets/index/images/arrow.png" 
                alt={`${direction.charAt(0).toUpperCase() + direction.slice(1)} Arrow`}
                width={30} 
                height={24} 
                style={{ transform: `rotate(${rotation}deg)` }} 
            />
        </div>
    );
};