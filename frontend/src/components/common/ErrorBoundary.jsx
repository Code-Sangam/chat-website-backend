import React from 'react';
import styled from 'styled-components';

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
  text-align: center;
  background-color: #f8f9fa;
`;

const ErrorTitle = styled.h1`
  color: #dc3545;
  font-size: 2rem;
  margin-bottom: 1rem;
`;

const ErrorMessage = styled.p`
  color: #666;
  font-size: 1.1rem;
  margin-bottom: 2rem;
  max-width: 600px;
`;

const ErrorDetails = styled.details`
  margin-top: 2rem;
  padding: 1rem;
  background-color: #fff;
  border: 1px solid #ddd;
  border-radius: 4px;
  text-align: left;
  max-width: 800px;
  width: 100%;
`;

const ErrorSummary = styled.summary`
  cursor: pointer;
  font-weight: bold;
  color: #666;
  margin-bottom: 1rem;
`;

const ErrorStack = styled.pre`
  font-size: 12px;
  color: #666;
  overflow-x: auto;
  white-space: pre-wrap;
`;

const RefreshButton = styled.button`
  background-color: #007bff;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #0056b3;
  }
`;

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  handleRefresh = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorContainer>
          <ErrorTitle>Oops! Something went wrong</ErrorTitle>
          <ErrorMessage>
            We're sorry, but something unexpected happened. Please try refreshing the page.
            If the problem persists, please contact support.
          </ErrorMessage>
          
          <RefreshButton onClick={this.handleRefresh}>
            Refresh Page
          </RefreshButton>

          {process.env.NODE_ENV === 'development' && this.state.error && (
            <ErrorDetails>
              <ErrorSummary>Error Details (Development Only)</ErrorSummary>
              <div>
                <strong>Error:</strong> {this.state.error.toString()}
              </div>
              {this.state.errorInfo && (
                <ErrorStack>
                  {this.state.errorInfo.componentStack}
                </ErrorStack>
              )}
            </ErrorDetails>
          )}
        </ErrorContainer>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;