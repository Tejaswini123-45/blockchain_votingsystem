import './Card.css';

const Card = ({
    children,
    variant = 'default',
    hover = false,
    padding = 'medium',
    className = '',
    onClick,
    ...props
}) => {
    const classes = [
        'card',
        `card-${variant}`,
        `card-padding-${padding}`,
        hover && 'card-hover',
        onClick && 'card-clickable',
        className
    ].filter(Boolean).join(' ');

    return (
        <div className={classes} onClick={onClick} {...props}>
            {children}
        </div>
    );
};

// Sub-components
Card.Header = ({ children, className = '' }) => (
    <div className={`card-header ${className}`}>{children}</div>
);

Card.Body = ({ children, className = '' }) => (
    <div className={`card-body ${className}`}>{children}</div>
);

Card.Footer = ({ children, className = '' }) => (
    <div className={`card-footer ${className}`}>{children}</div>
);

export default Card;
