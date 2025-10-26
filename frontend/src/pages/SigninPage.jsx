import React from 'react';
import styled from 'styled-components';
import SigninForm from '../components/auth/SigninForm';

const SigninContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
  background-color: #f8f9fa;
`;

const SigninCard = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 0.5rem;
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
  width: 100%;
  max-width: 400px;
`;

const SigninPage = () => {
  return (
    <SigninContainer>
      <SigninCard>
        <SigninForm />
      </SigninCard>
    </SigninContainer>
  );
};

export default SigninPage;