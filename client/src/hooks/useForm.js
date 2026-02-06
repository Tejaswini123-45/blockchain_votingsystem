import { useState } from 'react';

/**
 * Custom hook for form state management
 * @param {Object} initialValues - Initial form values
 * @param {Function} onSubmit - Submit handler function
 * @param {Function} validate - Optional validation function
 */
const useForm = (initialValues, onSubmit, validate) => {
    const [values, setValues] = useState(initialValues);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [submitError, setSubmitError] = useState('');

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setValues(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        
        // Clear field error on change
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
        setSubmitError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitError('');

        // Run validation if provided
        if (validate) {
            const validationErrors = validate(values);
            if (Object.keys(validationErrors).length > 0) {
                setErrors(validationErrors);
                return;
            }
        }

        setLoading(true);
        try {
            await onSubmit(values);
        } catch (error) {
            setSubmitError(error.response?.data?.message || error.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const reset = () => {
        setValues(initialValues);
        setErrors({});
        setSubmitError('');
    };

    const setFieldValue = (name, value) => {
        setValues(prev => ({ ...prev, [name]: value }));
    };

    return {
        values,
        errors,
        loading,
        submitError,
        handleChange,
        handleSubmit,
        reset,
        setFieldValue,
        setErrors,
        setSubmitError
    };
};

export default useForm;
