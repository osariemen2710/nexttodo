"use client";
import React from 'react';
import Modal from './Modal';
import LoadingSpinner from './LoadingSpinner';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  isPending: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  isPending,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <p className="text-gray-700 text-base mb-6">{message}</p>
      <div className="flex justify-end space-x-3">
        <button
          onClick={onClose}
          className="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
          disabled={isPending}
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-md transition-colors duration-200 flex items-center justify-center"
          disabled={isPending}
        >
          {isPending ? <LoadingSpinner size="sm" /> : 'Confirm'}
        </button>
      </div>
    </Modal>
  );
};

export default ConfirmationModal;
