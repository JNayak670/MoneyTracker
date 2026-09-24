import { useEffect, useRef } from 'react';

/**
 * Custom hook to enable automatic closing of modals, drawers, and pop-up pages
 * when the phone/browser "Back" button is pressed.
 *
 * When a modal opens, it pushes a history state. If the user presses the phone's
 * back button, popstate fires and calls onClose() instead of navigating away.
 * If the modal is closed by clicking "X" or backdrop, the dummy history state
 * is cleanly popped.
 *
 * @param {boolean} isOpen - Whether the modal/drawer is currently open
 * @param {function} onClose - Callback function to close the modal/drawer
 */
export function useModalBackHandler(isOpen, onClose) {
  const isPushedRef = useRef(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) {
      // If modal was closed via UI (X button, backdrop, form submit),
      // remove the dummy history entry we added so history stays clean
      if (isPushedRef.current) {
        isPushedRef.current = false;
        if (window.history.state && window.history.state.__modalOpen) {
          window.history.back();
        }
      }
      return;
    }

    // Modal was just opened: push dummy history state
    const modalKey = `modal_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    window.history.pushState(
      { ...(window.history.state || {}), __modalOpen: true, __modalKey: modalKey },
      ''
    );
    isPushedRef.current = true;

    const handlePopState = () => {
      if (isPushedRef.current) {
        isPushedRef.current = false;
        // Phone back button was pressed: close modal!
        if (typeof onCloseRef.current === 'function') {
          onCloseRef.current();
        }
      }
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      if (isPushedRef.current) {
        isPushedRef.current = false;
        if (window.history.state && window.history.state.__modalOpen) {
          window.history.back();
        }
      }
    };
  }, [isOpen]);
}

export default useModalBackHandler;
