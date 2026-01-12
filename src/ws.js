export const createWebSocketClient = ({ endpoint, onMessage }) => {
  let socket = null;

  const connect = () => {
    if (socket && socket.readyState === WebSocket.OPEN) return;
    socket = new WebSocket(endpoint);
    socket.addEventListener("message", onMessage);
  };

  const send = (payload) => {
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    socket.send(JSON.stringify(payload));
  };

  const isOpen = () => socket && socket.readyState === WebSocket.OPEN;

  return {
    connect,
    send,
    isOpen
  };
};
