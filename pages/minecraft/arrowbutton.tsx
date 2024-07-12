import NextImage from 'next/image';
import infostyles from './styles/info.module.css';

const helper: React.FC = () => {
    return null;
};

export default helper;

export const GalleryButton = ({ direction, rotation, currentImage, setCurrentImage, numberImages }:
    { direction: string, rotation: number, currentImage: number, setCurrentImage: (arg0: number) => void, numberImages: number }) => {

    const increment = direction === 'left' ? -1 : 1;

    return (
        <div className={`${infostyles.arrow} ${direction === 'left' ? infostyles.leftArrow : infostyles.rightArrow}`}>
            <NextImage
                src="/assets/index/images/arrow.png"
                alt={`${direction.charAt(0).toUpperCase() + direction.slice(1)} Arrow`}
                width={30}
                height={24}
                style={{ transform: `rotate(${rotation}deg)`, userSelect: 'none'}}
                onClick={() => switchImage(increment, currentImage, setCurrentImage, numberImages)}
                draggable={false}
            />
        </div>
    );
};

export const TaskButton = ({ direction, rotation, currentTask, setCurrentTask, numberTasks }:
    { direction: string, rotation: number, currentTask: number, setCurrentTask: any, numberTasks: number }) => {

    const increment = direction === 'left' ? -1 : 1;

    return (
        <div className={`${infostyles.arrow} ${direction === 'left' ? infostyles.leftArrow : infostyles.rightArrow}`}>
            <NextImage
                src="/assets/index/images/arrow.png"
                alt={`${direction.charAt(0).toUpperCase() + direction.slice(1)} Arrow`}
                width={30}
                height={24}
                style={{ transform: `rotate(${rotation}deg)`, userSelect: 'none'}}
                onClick={() => switchTask(increment, currentTask, setCurrentTask, numberTasks)}
                draggable={false}
            />
        </div>
    );
};

function switchImage(increment: number, currentImage: number, setCurrentImage: (arg0: number) => void, numberImages: number) {
    let newImage = (currentImage + increment) % numberImages;
    if (newImage < 0) {
        newImage += numberImages;
    }
    setCurrentImage(newImage);
}

function switchTask(increment: number, currentTask: number, setCurrentTask: (arg0: number) => void, numberTasks: number) {
    let newTask = (currentTask + increment) % numberTasks;
    if (newTask < 0) {
        newTask += numberTasks;
    }
    setCurrentTask(newTask);
}