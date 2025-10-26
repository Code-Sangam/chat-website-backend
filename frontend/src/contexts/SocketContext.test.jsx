import React from 'react';
import { render } from '@testing-library/react';
import { vi } from 'vitest';
import { SocketProvider, useSocket } from './SocketContext';
import { AuthProvider } from './AuthContext';

// Mock socket.io-client
vi.mock('socket.io-client', () => ({
  io: vi.fn(() => ({
    on: vi.fn(),
    emit: vi.fn(),
    disconnect: vi.fn(),
    connected: true
  }))
}));

// Mock auth service
vi.mock('../services/authService', () => ({
  authService: {
    verifyToken: vi.fn(() => Promise.resolve({
      data: { user: { _id: 'test-user', username: 'testuser' } }
    }))
  }
}));

// Mock token manager
vi.mock('../utils/tokenManager', () => ({
  tokenManager: {
    getToken: vi.fn(() => 'mock-token'),
    isTokenExpired: vi.fn(() => false)
  }
}));

// Test component
const TestComponent = () => {
  const socket = useSocket();
  return <div data-testid="socket-connected">{socket.connected ? 'connected' : 'disconnected'}</div>;
};

// Wrapper component
const TestWrapper = ({ children }) => (
  <AuthProvider>
    <SocketProvider>
      {children}
    </SocketProvider>
  </AuthProvider>
);

describe('SocketContext', () => {
  it('should provide socket context', () => {
    const { getByTestId } = render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    // Should render without crashing
    expect(getByTestId('socket-connected')).toBeInTheDocument();
  });

  it('should initialize with default state', () => {
    let socketData;
    
    const TestComponent = () => {
      socketData = useSocket();
      return <div>test</div>;
    };

    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    // Should have expected properties
    expect(socketData).toHaveProperty('connected');
    expect(socketData).toHaveProperty('messages');
    expect(socketData).toHaveProperty('joinChat');
    expect(socketData).toHaveProperty('sendMessage');
    expect(Array.isArray(socketData.messages)).toBe(true);
  });
});