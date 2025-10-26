import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
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

const SignupLink = styled.div`
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

const ForgotPasswordLink = styled.div`
  text-align: center;
  margin-top: 1rem;
`;

const RememberMeContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  cursor: pointer;
  font-size: 0.9rem;
  color: #666;

  input {
    margin-right: 0.5rem;
  }
`;

const WelcomeMessage = styled.div`
  text-align: center;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 0.375rem;
  color: #666;
  font-size: 0.9rem;
`;

const SigninForm = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { signin, error: authError, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Get the intended destination or default to chat
  const from = location.state?.from?.pathname || '/chat';

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
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
  };

  const validateForm = () => {
    const newErrors = {};

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
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
      await signin({
        email: formData.email.trim().toLowerCase(),
        password: formData.password
      });

      // Handle "Remember Me" functionality
      if (formData.rememberMe) {
        localStorage.setItem('rememberMe', 'true');
        localStorage.setItem('userEmail', formData.email.trim().toLowerCase());
      } else {
        localStorage.removeItem('rememberMe');
        localStorage.removeItem('userEmail');
      }

      // Redirect to intended page or chat
      navigate(from, { replace: true });
    } catch (error) {
      console.error('Signin error:', error);
      // Error is handled by AuthContext
    } finally {
      setIsSubmitting(false);
    }
  };

  // Load remembered email on component mount
  React.useEffect(() => {
    const rememberMe = localStorage.getItem('rememberMe');
    const userEmail = localStorage.getItem('userEmail');
    
    if (rememberMe === 'true' && userEmail) {
      setFormData(prev => ({
        ...prev,
        email: userEmail,
        rememberMe: true
      }));
    }
  }, []);

  return (
    <FormContainer onSubmit={handleSubmit}>
      <FormTitle>Welcome Back</FormTitle>

      <WelcomeMessage>
        Sign in to your account to start chatting with others
      </WelcomeMessage>

      {authError && (
        <AlertMessage type="error">
          {authError}
        </AlertMessage>
      )}

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
          autoFocus
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
          autoComplete="current-password"
        />
        {errors.password && <ErrorMessage>{errors.password}</ErrorMessage>}
      </FormGroup>

      <FormGroup>
        <CheckboxLabel>
          <input
            type="checkbox"
            checked={showPassword}
            onChange={(e) => setShowPassword(e.target.checked)}
          />
          Show password
        </CheckboxLabel>
      </FormGroup>

      <RememberMeContainer>
        <CheckboxLabel>
          <input
            type="checkbox"
            name="rememberMe"
            checked={formData.rememberMe}
            onChange={handleInputChange}
          />
          Remember me
        </CheckboxLabel>
        
        <StyledLink to="/forgot-password" style={{ fontSize: '0.9rem' }}>
          Forgot password?
        </StyledLink>
      </RememberMeContainer>

      <SubmitButton type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Signing In...' : 'Sign In'}
      </SubmitButton>

      <SignupLink>
        Don't have an account?{' '}
        <StyledLink to="/signup">Create one here</StyledLink>
      </SignupLink>
    </FormContainer>
  );
};

export default SigninForm;