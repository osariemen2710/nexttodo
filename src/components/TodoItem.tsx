"use client";
import React from 'react';
import type { Todo } from './types';
import Link from 'next/link';

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
  onEdit: (todo: Todo) => void;
}

const TodoItem: React.FC<TodoItemProps> = ({ todo, onToggle, onDelete, onEdit }) => {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white shadow-md rounded-lg p-3 sm:p-4 mb-3 border border-gray-200">
      <div className="flex items-center flex-grow w-full">
        <input
          type="checkbox"
          checked={todo.completed}
          onChange={() => onToggle(todo.id)}
          className="form-checkbox h-5 w-5 text-green-600 rounded focus:ring-green-500 mr-4 cursor-pointer"
        />
        <Link href={`/todo/${todo.id}`} className={`text-base sm:text-lg flex-grow truncate ${todo.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
          {todo.title}
        </Link>
      </div>
      <div className="flex space-x-2 mt-3 sm:mt-0 ml-0 sm:ml-4 w-full sm:w-auto">
        <button
          onClick={() => onEdit(todo)}
          className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-md text-sm transition-colors w-full sm:w-auto text-center"
          aria-label={`Edit ${todo.title}`}
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(todo.id)}
          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-sm transition-colors w-full sm:w-auto text-center"
          aria-label={`Delete ${todo.title}`}
        >
          Delete
        </button>
      </div>
    </div>
  );
};

export default TodoItem;
