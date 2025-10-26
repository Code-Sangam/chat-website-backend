import React, { useState, useEffect, useRef, useMemo } from 'react';
import styled from 'styled-components';

const Container = styled.div`
  height: 100%;
  overflow-y: auto;
  position: relative;
`;

const ScrollContainer = styled.div`
  position: relative;
`;

const VisibleItems = styled.div`
  position: relative;
`;

const VirtualizedList = ({
  items = [],
  itemHeight = 60,
  containerHeight = 400,
  renderItem,
  overscan = 5,
  onScroll,
  className,
  ...props
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef(null);

  // Calculate visible range
  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );

    return { startIndex, endIndex };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

  // Calculate total height
  const totalHeight = items.length * itemHeight;

  // Calculate offset for visible items
  const offsetY = visibleRange.startIndex * itemHeight;

  // Get visible items
  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.startIndex, visibleRange.endIndex + 1);
  }, [items, visibleRange.startIndex, visibleRange.endIndex]);

  // Handle scroll
  const handleScroll = (event) => {
    const newScrollTop = event.target.scrollTop;
    setScrollTop(newScrollTop);
    
    if (onScroll) {
      onScroll(event);
    }
  };

  // Auto-scroll to bottom when new items are added (for chat messages)
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const prevItemsLength = useRef(items.length);

  useEffect(() => {
    if (containerRef.current && shouldAutoScroll && items.length > prevItemsLength.current) {
      containerRef.current.scrollTop = totalHeight;
    }
    prevItemsLength.current = items.length;
  }, [items.length, totalHeight, shouldAutoScroll]);

  // Check if user is near bottom to enable/disable auto-scroll
  useEffect(() => {
    if (containerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
      const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100;
      setShouldAutoScroll(isNearBottom);
    }
  }, [scrollTop]);

  return (
    <Container
      ref={containerRef}
      onScroll={handleScroll}
      className={className}
      style={{ height: containerHeight }}
      {...props}
    >
      <ScrollContainer style={{ height: totalHeight }}>
        <VisibleItems style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) => {
            const actualIndex = visibleRange.startIndex + index;
            return (
              <div
                key={item.id || actualIndex}
                style={{ height: itemHeight }}
              >
                {renderItem(item, actualIndex)}
              </div>
            );
          })}
        </VisibleItems>
      </ScrollContainer>
    </Container>
  );
};

export default VirtualizedList;