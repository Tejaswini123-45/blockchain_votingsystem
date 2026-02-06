import './Input.css';

const Input = ({
    label,
    icon,
    error,
    type = 'text',
    id,
    name,
    value,
    onChange,
    placeholder,
    required = false,
    disabled = false,
    className = '',
    ...props
}) => {
    return (
        <div className={`input-group ${error ? 'has-error' : ''} ${className}`}>
            {label && (
                <label htmlFor={id || name}>
                    {icon && <span className="label-icon">{icon}</span>}
                    {label}
                    {required && <span className="required">*</span>}
                </label>
            )}
            <input
                type={type}
                id={id || name}
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                required={required}
                disabled={disabled}
                {...props}
            />
            {error && <span className="input-error">{error}</span>}
        </div>
    );
};

export default Input;
