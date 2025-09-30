"use client";
import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';
import type { Todo } from './types';
import TodoItem from './TodoItem';
import TodoForm from './TodoForm';
import ConfirmationModal from './ConfirmationModal';
import EditTodoModal from './EditTodoModal';
import Pagination from './Pagination';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';

const API_URL = 'https://jsonplaceholder.typicode.com/todos';
const ITEMS_PER_PAGE = 10;

const TodoList: React.FC = () => {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [todoToDeleteId, setTodoToDeleteId] = useState<number | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [todoToEdit, setTodoToEdit] = useState<Todo | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'active'>('all');

  const { data: todos = [], isPending, isError, error } = useQuery<Todo[], Error>({
    queryKey: ['todos'],
    queryFn: async () => {
      const { data } = await axios.get<Todo[]>(API_URL);
      return data.slice(0, 20);
    },
    staleTime: 5 * 60 * 1000,
  });

  const addTodoMutation = useMutation<Todo, Error, Omit<Todo, 'id' | 'userId'>>({
    mutationFn: async (newTodo) => {
      const { data } = await axios.post<Todo>(API_URL, { ...newTodo, userId: 1 });
      return { ...data, id: Math.floor(Math.random() * 1000) + 201 };
    },
    onSuccess: (newTodo) => {
      queryClient.setQueryData<Todo[]>(['todos'], (oldTodos) => {
        if (!oldTodos) return [newTodo];
        return [{ ...newTodo, id: Math.floor(Math.random() * 1000) + 201 }, ...oldTodos];
      });
      toast.success('Todo added successfully!');
      setIsFormOpen(false);
    },
    onError: (err) => {
      toast.error(`Error adding todo: ${err.message}`);
    },
  });

  const updateTodoMutation = useMutation<Todo, Error, Todo>({
    mutationFn: async (updatedTodo) => {
      await axios.put<Todo>(`${API_URL}/${updatedTodo.id}`, updatedTodo);
      return updatedTodo;
    },
    onSuccess: (updatedTodo) => {
      queryClient.setQueryData<Todo[]>(['todos'], (oldTodos) =>
        oldTodos?.map((todo) => (todo.id === updatedTodo.id ? updatedTodo : todo))
      );
      toast.success('Todo updated successfully!');
      setIsEditModalOpen(false);
      setTodoToEdit(null);
    },
    onError: (err) => {
      toast.error(`Error updating todo: ${err.message}`);
    },
  });

  const deleteTodoMutation = useMutation<void, Error, number>({
    mutationFn: async (id) => {
      await axios.delete(`${API_URL}/${id}`);
    },
    onSuccess: (data, id) => {
      queryClient.setQueryData<Todo[]>(['todos'], (oldTodos) => oldTodos?.filter((todo) => todo.id !== id));
      toast.success('Todo deleted successfully!');
      setIsConfirmModalOpen(false);
      setTodoToDeleteId(null);
    },
    onError: (err) => {
      toast.error(`Error deleting todo: ${err.message}`);
    },
  });

  const handleAddTodo = (title: string) => {
    addTodoMutation.mutate({ title, completed: false });
  };

  const handleToggleTodo = (id: number) => {
    const todo = todos.find((t) => t.id === id);
    if (todo) {
      updateTodoMutation.mutate({ ...todo, completed: !todo.completed });
    }
  };

  const handleDeleteClick = (id: number) => {
    setTodoToDeleteId(id);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (todoToDeleteId !== null) deleteTodoMutation.mutate(todoToDeleteId);
  };

  const handleEditClick = (todo: Todo) => {
    setTodoToEdit(todo);
    setIsEditModalOpen(true);
  };

  const handleUpdateTodo = (id: number, title: string, completed: boolean) => {
    if (todoToEdit) updateTodoMutation.mutate({ ...todoToEdit, title, completed });
  };

  const filteredAndSearchedTodos = useMemo(() => {
    let filtered = todos;
    if (filterStatus === 'completed') filtered = filtered.filter((t) => t.completed);
    else if (filterStatus === 'active') filtered = filtered.filter((t) => !t.completed);
    if (searchTerm) filtered = filtered.filter((todo) => todo.title.toLowerCase().includes(searchTerm.toLowerCase()));
    return filtered;
  }, [todos, searchTerm, filterStatus]);

  useEffect(() => setCurrentPage(1), [searchTerm, filterStatus]);

  const totalPages = Math.ceil(filteredAndSearchedTodos.length / ITEMS_PER_PAGE);
  const paginatedTodos = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAndSearchedTodos.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredAndSearchedTodos, currentPage]);

  if (isPending) return <LoadingSpinner />;
  if (isError) return <ErrorMessage message={error?.message || 'Failed to fetch todos.'} />;

  return (
    <div className="bg-gradient-to-br from-green-100 to-green-200 p-6 rounded-xl shadow-lg min-h-[60vh]">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold text-gray-800">Your Todos</h1>
        <button onClick={() => setIsFormOpen(true)} className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-5 rounded-lg shadow-md transition-colors duration-200">
          Add New Todo
        </button>
      </div>

      {isFormOpen && <TodoForm onAddTodo={handleAddTodo} onClose={() => setIsFormOpen(false)} isPending={addTodoMutation.isPending} />}

      <div className="mb-6 flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
        <input type="text" placeholder="Search todos..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="flex-grow p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 shadow-sm" aria-label="Search todos" />
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as 'all' | 'completed' | 'active')} className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 shadow-sm md:w-auto" aria-label="Filter todos by status">
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      <div className="space-y-3">
        {paginatedTodos.length === 0 ? <p className="text-center text-gray-600 text-lg py-8">No todos found matching your criteria.</p> : paginatedTodos.map((todo) => <TodoItem key={todo.id} todo={todo} onToggle={handleToggleTodo} onDelete={handleDeleteClick} onEdit={handleEditClick} />)}
      </div>

      {totalPages > 1 && <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />}

      <ConfirmationModal isOpen={isConfirmModalOpen} onClose={() => setIsConfirmModalOpen(false)} onConfirm={handleConfirmDelete} title="Delete Todo" message="Are you sure you want to delete this todo? This action cannot be undone." isPending={deleteTodoMutation.isPending} />

      {todoToEdit && <EditTodoModal isOpen={isEditModalOpen} onClose={() => { setIsEditModalOpen(false); setTodoToEdit(null); }} todo={todoToEdit} onSave={handleUpdateTodo} isPending={updateTodoMutation.isPending} />}
    </div>
  );
};

export default TodoList;
