'use client';

import { useTransition } from 'react';

export default function DeleteProductButton({ id, deleteAction }: { id: string, deleteAction: (id: string) => Promise<void> }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      startTransition(async () => {
        try {
          await deleteAction(id);
          alert('Product deleted successfully!');
        } catch (error) {
          alert('Error deleting product');
        }
      });
    }
  };

  return (
    <button 
      type="button" 
      onClick={handleDelete}
      disabled={isPending}
      className="text-red-500 hover:text-red-700 text-xs font-semibold uppercase tracking-wider px-3 py-1 border border-red-200 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
    >
      {isPending ? 'Deleting...' : 'Delete'}
    </button>
  );
}
