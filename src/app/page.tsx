"use client";
import TodoList from '../components/TodoList';

export default function Home() {
  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto">
        <TodoList />
      </div>
    </div>
  );
}
