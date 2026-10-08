import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import NormalLoader from '../components/NormalLoader';

const OperationLoaderContext = createContext(null);

export function OperationLoaderProvider({ children }) {
  const [loadingState, setLoadingState] = useState({
    isOpen: false,
    message: '',
    submessage: '',
    tag: 'DATABASE SYNC',
    statusText: 'Updating Records'
  });

  const activeCountRef = useRef(0);

  const showLoader = useCallback(({
    message = 'Updating Database Records...',
    submessage = 'Writing changes to database and recalculating balances...',
    tag = 'DATABASE SYNC',
    statusText = 'Updating Records'
  } = {}) => {
    activeCountRef.current += 1;
    setLoadingState({
      isOpen: true,
      message,
      submessage,
      tag,
      statusText
    });
  }, []);

  const updateLoader = useCallback(({
    message,
    submessage,
    tag,
    statusText
  } = {}) => {
    setLoadingState(prev => {
      if (!prev.isOpen) return prev;
      return {
        ...prev,
        ...(message !== undefined ? { message } : {}),
        ...(submessage !== undefined ? { submessage } : {}),
        ...(tag !== undefined ? { tag } : {}),
        ...(statusText !== undefined ? { statusText } : {})
      };
    });
  }, []);

  const hideLoader = useCallback(() => {
    activeCountRef.current = Math.max(0, activeCountRef.current - 1);
    if (activeCountRef.current === 0) {
      setLoadingState(prev => ({ ...prev, isOpen: false }));
    }
  }, []);

  const executeWithLoader = useCallback(async (asyncFn, options = {}) => {
    const {
      message = 'Updating Database Records...',
      submessage = 'Writing changes to database and fetching updated records...',
      tag = 'DATABASE SYNC',
      statusText = 'Updating Records',
      minDuration = 0
    } = options;

    showLoader({ message, submessage, tag, statusText });
    const startTime = Date.now();

    try {
      const result = await asyncFn({ updateLoader });
      const elapsed = Date.now() - startTime;
      if (elapsed < minDuration) {
        await new Promise(resolve => setTimeout(resolve, minDuration - elapsed));
      }
      return result;
    } catch (err) {
      // Re-throw so caller can display specific alert/toast
      throw err;
    } finally {
      hideLoader();
    }
  }, [showLoader, hideLoader, updateLoader]);

  // Lock body scroll while loader page is active
  useEffect(() => {
    if (loadingState.isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [loadingState.isOpen]);

  // Global window event listeners so any utility or component can trigger it
  useEffect(() => {
    const handleShowEvent = (e) => {
      const detail = e.detail || {};
      showLoader(detail);
    };

    const handleUpdateEvent = (e) => {
      const detail = e.detail || {};
      updateLoader(detail);
    };

    const handleHideEvent = () => {
      activeCountRef.current = 1;
      hideLoader();
    };

    window.addEventListener('show-operation-loader', handleShowEvent);
    window.addEventListener('update-operation-loader', handleUpdateEvent);
    window.addEventListener('hide-operation-loader', handleHideEvent);

    return () => {
      window.removeEventListener('show-operation-loader', handleShowEvent);
      window.removeEventListener('update-operation-loader', handleUpdateEvent);
      window.removeEventListener('hide-operation-loader', handleHideEvent);
    };
  }, [showLoader, updateLoader, hideLoader]);

  return (
    <OperationLoaderContext.Provider value={{ showLoader, updateLoader, hideLoader, executeWithLoader, isLoading: loadingState.isOpen }}>
      {children}
      {loadingState.isOpen && createPortal(
        <NormalLoader 
          message={loadingState.message}
          submessage={loadingState.submessage}
          tag={loadingState.tag}
          statusText={loadingState.statusText}
        />,
        document.body
      )}
    </OperationLoaderContext.Provider>
  );
}

export function useOperationLoader() {
  const context = useContext(OperationLoaderContext);
  if (!context) {
    return {
      showLoader: () => {},
      updateLoader: () => {},
      hideLoader: () => {},
      executeWithLoader: async (fn) => fn({ updateLoader: () => {} }),
      isLoading: false
    };
  }
  return context;
}

export function triggerOperationLoader(options) {
  window.dispatchEvent(new CustomEvent('show-operation-loader', { detail: options }));
}

export function updateOperationLoader(options) {
  window.dispatchEvent(new CustomEvent('update-operation-loader', { detail: options }));
}

export function dismissOperationLoader() {
  window.dispatchEvent(new CustomEvent('hide-operation-loader'));
}
