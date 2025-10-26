import React, { memo, useState, useCallback, useMemo } from 'react';
import styled from 'styled-components';
import { useDebounce } from '../../hooks/useDebounce';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { useRenderPerformance } from '../../hooks/usePerformanceMonitor';
import LoadingSpinner from '../common/LoadingSpinner';

const SearchContainer = styled.div`
  padding: 16px;
  border-bottom: 1px solid #e1e5e9;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.2s ease;

  &:focus {
    outline: none;
    border-color: #007bff;
  }

  &::placeholder {
    color: #999;
  }
`;

const ResultsContainer = styled.div`
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #e1e5e9;
  border-top: none;
  border-radius: 0 0 8px 8px;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const UserItem = styled.div`
  display: flex;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: #f8f9fa;
  }

  &:not(:last-child) {
    border-bottom: 1px solid #f1f3f4;
  }
`;

const UserAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 16px;
  margin-right: 12px;
  flex-shrink: 0;
`;

const UserInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const UserName = styled.div`
  font-weight: 500;
  color: #333;
  margin-bottom: 2px;
`;

const UserId = styled.div`
  font-size: 12px;
  color: #666;
  font-family: monospace;
`;

const EmptyState = styled.div`
  padding: 24px 16px;
  text-align: center;
  color: #666;
  font-size: 14px;
`;

const LoadingContainer = styled.div`
  padding: 16px;
  display: flex;
  justify-content: center;
`;

const ErrorMessage = styled.div`
  padding: 16px;
  color: #dc3545;
  font-size: 14px;
  text-align: center;
`;

// Memoized user item component
const UserSearchItem = memo(({ user, onSelect }) => {
  const handleClick = useCallback(() => {
    onSelect(user);
  }, [user, onSelect]);

  const avatarLetter = user.username?.charAt(0).toUpperCase() || '?';

  return (
    <UserItem onClick={handleClick}>
      <UserAvatar>{avatarLetter}</UserAvatar>
      <UserInfo>
        <UserName>{user.username}</UserName>
        <UserId>{user.uniqueUserId}</UserId>
      </UserInfo>
    </UserItem>
  );
});

UserSearchItem.displayName = 'UserSearchItem';

const OptimizedUserSearch = memo(({
  onUserSelect,
  searchUsers,
  placeholder = "Search users by ID...",
  className
}) => {
  useRenderPerformance('OptimizedUserSearch');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showResults, setShowResults] = useState(false);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const { handleAsyncError } = useErrorHandler();

  // Perform search when debounced term changes
  React.useEffect(() => {
    const performSearch = async () => {
      if (!debouncedSearchTerm.trim()) {
        setResults([]);
        setShowResults(false);
        setError(null);
        return;
      }

      if (debouncedSearchTerm.length < 2) {
        setResults([]);
        setShowResults(false);
        setError('Please enter at least 2 characters');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const searchResults = await searchUsers(debouncedSearchTerm);
        setResults(searchResults || []);
        setShowResults(true);
      } catch (err) {
        setError('Failed to search users. Please try again.');
        setResults([]);
        setShowResults(false);
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [debouncedSearchTerm, searchUsers]);

  const handleInputChange = useCallback((e) => {
    setSearchTerm(e.target.value);
  }, []);

  const handleUserSelect = useCallback((user) => {
    setSearchTerm('');
    setResults([]);
    setShowResults(false);
    onUserSelect(user);
  }, [onUserSelect]);

  const handleInputFocus = useCallback(() => {
    if (results.length > 0) {
      setShowResults(true);
    }
  }, [results.length]);

  const handleInputBlur = useCallback(() => {
    // Delay hiding results to allow for clicks
    setTimeout(() => {
      setShowResults(false);
    }, 200);
  }, []);

  // Memoize rendered results
  const renderedResults = useMemo(() => {
    if (!showResults) return null;

    if (loading) {
      return (
        <LoadingContainer>
          <LoadingSpinner size="small" showText={false} />
        </LoadingContainer>
      );
    }

    if (error) {
      return <ErrorMessage>{error}</ErrorMessage>;
    }

    if (results.length === 0 && debouncedSearchTerm.trim()) {
      return <EmptyState>No users found matching "{debouncedSearchTerm}"</EmptyState>;
    }

    return results.map(user => (
      <UserSearchItem
        key={user.id}
        user={user}
        onSelect={handleUserSelect}
      />
    ));
  }, [showResults, loading, error, results, debouncedSearchTerm, handleUserSelect]);

  return (
    <SearchContainer className={className}>
      <div style={{ position: 'relative' }}>
        <SearchInput
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder={placeholder}
          autoComplete="off"
        />
        
        {showResults && (
          <ResultsContainer>
            {renderedResults}
          </ResultsContainer>
        )}
      </div>
    </SearchContainer>
  );
});

OptimizedUserSearch.displayName = 'OptimizedUserSearch';

export default OptimizedUserSearch;