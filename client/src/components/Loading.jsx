import './Loading.css';

const Loading = ({ 
    size = 'medium', 
    text = 'Loading...', 
    fullScreen = false 
}) => {
    const containerClass = fullScreen ? 'loading-fullscreen' : 'loading-container';
    
    return (
        <div className={containerClass}>
            <div className={`spinner spinner-${size}`}></div>
            {text && <p className="loading-text">{text}</p>}
        </div>
    );
};

export default Loading;
