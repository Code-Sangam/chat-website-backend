import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../../contexts/AuthContext';

const FormContainer = styled.form`
  width: 100%;
`;

const FormTitle = styled.h2`
  text-align: center;
  margin-bottom: 2rem;
  color: #333;
  font-weight: 600;
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #333;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  font-size: 1rem;
  border: 1px solid ${props => props.hasError ? '#dc3545' : '#ced4da'};
  border-radius: 0.375rem;
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;

  &:focus {
    outline: none;
    border-color: ${props => props.hasError ? '#dc3545' : '#007bff'};
    box-shadow: 0 0 0 0.2rem ${props => props.hasError ? 'rgba(220, 53, 69, 0.25)' : 'rgba(0, 123, 255, 0.25)'};
  }

  &::placeholder {
    color: #6c757d;
  }
`;

const ErrorMessage = styled.div`
  color: #dc3545;
  font-size: 0.875rem;
  margin-top: 0.25rem;
`;

const SubmitButton = styled.button`
  width: 100%;
  padding: 0.75rem;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  margin-bottom: 1rem;

  &:hover:not(:disabled) {
    background-color: #0056b3;
  }

  &:disabled {
    background-color: #6c757d;
    cursor: not-allowed;
  }
`;

const AlertMessage = styled.div`
  padding: 0.75rem;
  margin-bottom: 1rem;
  border-radius: 0.375rem;
  background-color: ${props => props.type === 'error' ? '#f8d7da' : '#d4edda'};
  color: ${props => props.type === 'error' ? '#721c24' : '#155724'};
  border: 1px solid ${props => props.type === 'error' ? '#f5c6cb' : '#c3e6cb'};
`;

const SigninLink = styled.div`
  text-align: center;
  margin-top: 1.5rem;
  color: #666;
`;

const StyledLink = styled(Link)`
  color: #007bff;
  text-decoration: none;
  font-weight: 500;

  &:hover {
    color: #0056b3;
    text-decoration: underline;
  }
`;

const PasswordStrengthIndicator = styled.div`
  margin-top: 0.5rem;
  font-size: 0.875rem;
`;

const StrengthBar = styled.div`
  height: 4px;
  background-color: #e9ecef;
  border-radius: 2px;
  margin-top: 0.25rem;
  overflow: hidden;
`;

const StrengthFill = styled.div`
  height: 100%;
  width: ${props => props.strength}%;
  background-color: ${props => {
    if (props.strength < 25) return '#dc3545';
    if (props.strength < 50) return '#fd7e14';
    if (props.strength < 75) return '#ffc107';
    return '#28a745';
  }};
  transition: all 0.3s ease;
`;

const StrengthText = styled.div`
  margin-top: 0.25rem;
  color: ${props => {
    if (props.strength < 25) return '#dc3545';
    if (props.strength < 50) return '#fd7e14';
    if (props.strength < 75) return '#ffc107';
    return '#28a745';
  }};
`;

const SignupForm = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { signup, error: authError, clearError } = useAuth();
  const navigate = useNavigate();

  // Calculate password strength
  const calculatePasswordStrength = (password) => {
    let strength = 0;
    
    if (password.length >= 8) strength += 25;
    if (/[a-z]/.test(password)) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/\d/.test(password)) strength += 25;
    if (/[@$!%*?&]/.test(password)) strength += 25;
    
    return Math.min(strength, 100);
  };

  const getPasswordStrengthText = (strength) => {
    if (strength < 25) return 'Very Weak';
    if (strength < 50) return 'Weak';
    if (strength < 75) return 'Good';
    return 'Strong';
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear specific field error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    // Clear auth error when user starts typing
    if (authError) {
      clearError();
    }

    // Calculate password strength
    if (name === 'password') {
      setPasswordStrength(calculatePasswordStrength(value));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (formData.username.length > 30) {
      newErrors.username = 'Username cannot exceed 30 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await signup({
        username: formData.username.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password
      });

      // Redirect to chat page on successful signup
      navigate('/chat');
    } catch (error) {
      console.error('Signup error:', error);
      // Error is handled by AuthContext
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormContainer onSubmit={handleSubmit}>
      <FormTitle>Create Your Account</FormTitle>

      {authError && (
        <AlertMessage type="error">
          {authError}
        </AlertMessage>
      )}

      <FormGroup>
        <Label htmlFor="username">Username</Label>
        <Input
          type="text"
          id="username"
          name="username"
          value={formData.username}
          onChange={handleInputChange}
          placeholder="Enter your username"
          hasError={!!errors.username}
          autoComplete="username"
        />
        {errors.username && <ErrorMessage>{errors.username}</ErrorMessage>}
      </FormGroup>

      <FormGroup>
        <Label htmlFor="email">Email Address</Label>
        <Input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          placeholder="Enter your email"
          hasError={!!errors.email}
          autoComplete="email"
        />
        {errors.email && <ErrorMessage>{errors.email}</ErrorMessage>}
      </FormGroup>

      <FormGroup>
        <Label htmlFor="password">Password</Label>
        <Input
          type={showPassword ? 'text' : 'password'}
          id="password"
          name="password"
          value={formData.password}
          onChange={handleInputChange}
          placeholder="Enter your password"
          hasError={!!errors.password}
          autoComplete="new-password"
        />
        {formData.password && (
          <PasswordStrengthIndicator>
            <StrengthBar>
              <StrengthFill strength={passwordStrength} />
            </StrengthBar>
            <StrengthText strength={passwordStrength}>
              Password strength: {getPasswordStrengthText(passwordStrength)}
            </StrengthText>
          </PasswordStrengthIndicator>
        )}
        {errors.password && <ErrorMessage>{errors.password}</ErrorMessage>}
      </FormGroup>

      <FormGroup>
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <Input
          type={showPassword ? 'text' : 'password'}
          id="confirmPassword"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleInputChange}
          placeholder="Confirm your password"
          hasError={!!errors.confirmPassword}
          autoComplete="new-password"
        />
        {errors.confirmPassword && <ErrorMessage>{errors.confirmPassword}</ErrorMessage>}
      </FormGroup>

      <FormGroup>
        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={showPassword}
            onChange={(e) => setShowPassword(e.target.checked)}
            style={{ marginRight: '0.5rem' }}
          />
          Show passwords
        </label>
      </FormGroup>

      <SubmitButton type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creating Account...' : 'Create Account'}
      </SubmitButton>

      <SigninLink>
        Already have an account?{' '}
        <StyledLink to="/signin">Sign in here</StyledLink>
      </SigninLink>
    </FormContainer>
  );
};

export default SignupForm;