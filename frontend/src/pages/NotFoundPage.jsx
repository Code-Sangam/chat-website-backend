import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

const NotFoundContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
  text-align: center;
  background-color: #f8f9fa;
`;

const NotFoundTitle = styled.h1`
  font-size: 6rem;
  font-weight: bold;
  color: #007bff;
  margin-bottom: 1rem;
`;

const NotFoundSubtitle = styled.h2`
  font-size: 2rem;
  color: #333;
  margin-bottom: 1rem;
`;

const NotFoundMessage = styled.p`
  font-size: 1.1rem;
  color: #666;
  margin-bottom: 2rem;
  max-width: 500px;
`;

const HomeLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  padding: 0.75rem 1.5rem;
  background-color: #007bff;
  color: white;
  text-decoration: none;
  border-radius: 0.375rem;
  font-weight: 500;
  transition: background-color 0.2s;

  &:hover {
    background-color: #0056b3;
    text-decoration: none;
    color: white;
  }
`;

const NotFoundPage = () => {
  return (
    <NotFoundContainer>
      <NotFoundTitle>404</NotFoundTitle>
      <NotFoundSubtitle>Page Not Found</NotFoundSubtitle>
      <NotFoundMessage>
        The page you're looking for doesn't exist. It might have been moved, 
        deleted, or you entered the wrong URL.
      </NotFoundMessage>
      <HomeLink to="/">
        Go Home
      </HomeLink>
    </NotFoundContainer>
  );
};

export default NotFoundPage;