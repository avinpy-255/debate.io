
import React, { useState, useEffect } from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
  onClose?: () => void;
}

const Toast: React.FC<ToastProps> = ({ 
  message, 
  type = 'info', 
  duration = 3000, 
  onClose 
}) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      if (onClose) {
        setTimeout(onClose, 300); // Allow time for animation before calling onClose
      }
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const typeClasses = {
    success: 'bg-green-500 text-white',
    error: 'bg-destructive text-white',
    info: 'bg-primary text-white',
  };

  return (
    <div
      className={`fixed bottom-4 right-4 max-w-md rounded-lg shadow-lg px-6 py-4 
                  transform transition-all duration-300 ease-in-out z-50
                  ${typeClasses[type]} 
                  ${visible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}
    >
      <div className="flex items-center justify-between">
        <p>{message}</p>
        <button 
          onClick={() => setVisible(false)}
          className="ml-4 text-white/80 hover:text-white transition-colors"
        >
          ×
        </button>
      </div>
    </div>
  );
};

export const useToast = () => {
  const [toasts, setToasts] = useState<Array<{ id: number; props: ToastProps }>>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info', duration = 3000) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, props: { message, type, duration } }]);
    return id;
  };

  const hideToast = (id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const ToastContainer = () => (
    <div className="toast-container">
      {toasts.map(({ id, props }) => (
        <Toast 
          key={id} 
          {...props} 
          onClose={() => hideToast(id)} 
        />
      ))}
    </div>
  );

  return { showToast, hideToast, ToastContainer };
};

export default Toast;
