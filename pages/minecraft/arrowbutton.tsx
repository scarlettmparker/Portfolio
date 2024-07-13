import NextImage from 'next/image';
import infostyles from './styles/info.module.css';
import { JSX } from 'react';

const helper: React.FC = () => {
    return null;
};

export default helper;

const ArrowButton = ({ direction, rotation, current, setCurrent, number, onClick }: {
    direction: string,
    rotation: number,
    current: number,
    setCurrent: (arg0: number) => void,
    number: number,
    onClick?: () => void,
}) => {
    const increment = direction === 'left' ? -1 : 1;

    const handleClick = () => {
        const newValue = (current + increment + number) % number;
        setCurrent(newValue);
        if (onClick) onClick();
    };

    return (
        <div className={`${infostyles.arrow} ${direction === 'left' ? infostyles.leftArrow : infostyles.rightArrow}`}>
            <NextImage
                src="/assets/index/images/arrow.png"
                alt={`${direction.charAt(0).toUpperCase() + direction.slice(1)} Arrow`}
                width={30}
                height={24}
                style={{ transform: `rotate(${rotation}deg)`, userSelect: 'none' }}
                onClick={handleClick}
                draggable={false}
            />
        </div>
    );
};

export const GalleryButton = (props: JSX.IntrinsicAttributes & { direction: string; rotation: number; current: number; setCurrent: (arg0: number) => void; number: number; onClick?: () => void; }) => (
    <ArrowButton {...props} />
);

export const TaskButton = (props: JSX.IntrinsicAttributes & { direction: string; rotation: number; current: number; setCurrent: (arg0: number) => void; number: number; onClick?: () => void; }) => (
    <ArrowButton {...props} />
);

export const PlayerButton = (props: JSX.IntrinsicAttributes & { direction: string; rotation: number; current: number; setCurrent: (arg0: number) => void; number: number; onClick?: () => void; }) => (
    <ArrowButton {...props} />
);