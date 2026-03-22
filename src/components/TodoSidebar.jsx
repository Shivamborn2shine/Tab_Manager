import { useState } from 'react';
import { useTabStore } from '../store/useTabStore';
import { Check, X, Plus, ListTodo } from 'lucide-react';

export default function TodoSidebar({ onClose }) {
  const workspace = useTabStore((s) => s.getActiveWorkspace());
  const addTodo = useTabStore((s) => s.addTodo);
  const toggleTodo = useTabStore((s) => s.toggleTodo);
  const deleteTodo = useTabStore((s) => s.deleteTodo);
  const [newTask, setNewTask] = useState('');

  if (!workspace) return null;

  const todos = workspace.todos || [];
  const completedCount = todos.filter(t => t.completed).length;
  const totalCount = todos.length;
  const progress = totalCount === 0 ? 0 : (completedCount / totalCount) * 100;

  const handleAdd = (e) => {
    e.preventDefault();
    if (newTask.trim()) {
      addTodo(newTask.trim());
      setNewTask('');
    }
  };

  return (
    <div className="todo-sidebar">
      <div className="todo-header">
        <div className="todo-header-title">
          <ListTodo size={18} className="todo-header-icon" />
          <h3>Tasks</h3>
        </div>
        <button className="todo-close-btn" onClick={onClose}>
          <X size={16} />
        </button>
      </div>

      <div className="todo-progress-section">
        <div className="todo-progress-text">
          <span>Progress</span>
          <span>{completedCount} / {totalCount}</span>
        </div>
        <div className="todo-progress-bar-bg">
          <div className="todo-progress-bar-fill" style={{ width: `${progress}%` }}></div>
        </div>
      </div>

      <div className="todo-list">
        {todos.length === 0 ? (
          <div className="todo-empty">
            <p>No tasks yet.</p>
            <p>Add one below to get started!</p>
          </div>
        ) : (
          todos.map((todo) => (
            <div key={todo.id} className={`todo-item ${todo.completed ? 'completed' : ''}`}>
              <button 
                className="todo-checkbox" 
                onClick={() => toggleTodo(todo.id)}
              >
                {todo.completed && <Check size={12} strokeWidth={3} />}
              </button>
              <span className="todo-text">{todo.text}</span>
              <button 
                className="todo-delete-btn" 
                onClick={() => deleteTodo(todo.id)}
              >
                <X size={14} />
              </button>
            </div>
          ))
        )}
      </div>

      <form className="todo-input-form" onSubmit={handleAdd}>
        <input
          type="text"
          className="todo-input"
          placeholder="Add a task..."
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
        />
        <button type="submit" className="todo-add-btn" disabled={!newTask.trim()}>
          <Plus size={16} />
        </button>
      </form>
    </div>
  );
}
