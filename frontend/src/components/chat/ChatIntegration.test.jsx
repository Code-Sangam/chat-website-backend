import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import MessageList from './MessageList';

// Mock dependencies
vi.mock('../../contexts/SocketContext', () => ({
  useSocket: () => ({
    connected: true,
    typingUsers: {}
  })
}));

// Mock user data
const mockMessages = [
  {
    _id: 'msg1',
    content: 'Hello there!',
    sender: { username: 'testuser2' },
    timestamp: '2024-01-01T10:00:00Z',
    isOwn: false
  },
  {
    _id: 'msg2',
    content: 'Hi! How are you?',
    sender: { username: 'testuser1' },
    timestamp: '2024-01-01T10:01:00Z',
    isOwn: true
  }
];

describe('Chat Integration Tests', () => {
  describe('Message Display', () => {
    it('should display messages correctly', () => {
      render(<MessageList messages={mockMessages} />);

      // Check message content
      expect(screen.getByText('Hello there!')).toBeInTheDocument();
      expect(screen.getByText('Hi! How are you?')).toBeInTheDocument();

      // Check sender names
      expect(screen.getByText('testuser2')).toBeInTheDocument();
    });

    it('should show empty state when no messages', () => {
      render(<MessageList messages={[]} />);

      expect(screen.getByText('No messages yet')).toBeInTheDocument();
      expect(screen.getByText('Start the conversation by sending a message below.')).toBeInTheDocument();
    });

    it('should handle pending messages', () => {
      const messagesWithPending = [
        ...mockMessages,
        {
          _id: 'temp_123',
          content: 'Sending...',
          sender: { username: 'testuser1' },
          timestamp: new Date().toISOString(),
          isOwn: true,
          isPending: true
        }
      ];

      render(<MessageList messages={messagesWithPending} />);

      expect(screen.getByText('Sending...')).toBeInTheDocument();
    });
  });

  describe('Core Functionality', () => {
    it('should render message list component', () => {
      render(<MessageList messages={[]} />);
      
      // Should render without crashing
      expect(screen.getByText('No messages yet')).toBeInTheDocument();
    });

    it('should format timestamps correctly', () => {
      render(<MessageList messages={mockMessages} />);
      
      // Should show time format (e.g., "10:00 AM")
      const timeElements = screen.getAllByText(/\d{1,2}:\d{2}/);
      expect(timeElements.length).toBeGreaterThan(0);
    });

    it('should show date separators', () => {
      const messagesWithDifferentDates = [
        {
          _id: 'msg1',
          content: 'Yesterday message',
          sender: { username: 'testuser' },
          timestamp: '2024-01-01T10:00:00Z',
          isOwn: false
        },
        {
          _id: 'msg2',
          content: 'Today message',
          sender: { username: 'testuser' },
          timestamp: new Date().toISOString(),
          isOwn: false
        }
      ];

      render(<MessageList messages={messagesWithDifferentDates} />);
      
      // Should show "Today" separator
      expect(screen.getByText('Today')).toBeInTheDocument();
    });
  });
});