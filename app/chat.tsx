import React from 'react';
import ChatScreen from './screens/Chat';

// Alias route at /chat -> reuses the existing screens/Chat component.
export default function ChatRouteWrapper() {
  return <ChatScreen />;
}
