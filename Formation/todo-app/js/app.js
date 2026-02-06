/**
 * TodoManager - Handles data logic and localStorage persistence
 */
class TodoManager {
    constructor() {
        this.STORAGE_KEY = 'premium_todo_tasks';
        this.tasks = this.loadTasks();
    }

    loadTasks() {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        try {
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            console.error('Error parsing tasks from local storage', e);
            return [];
        }
    }

    saveTasks() {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.tasks));
    }

    addTask(text) {
        if (!text || text.trim() === '') return { error: 'Please enter a task' };

        const newTask = {
            id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString() + Math.random().toString(36).substr(2, 9),
            text: text.trim(),
            completed: false,
            createdAt: new Date().toISOString()
        };

        this.tasks.unshift(newTask);
        this.saveTasks();
        return newTask;
    }

    deleteTask(id) {
        this.tasks = this.tasks.filter(task => task.id !== id);
        this.saveTasks();
    }

    toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            this.saveTasks();
        }
    }

    getStats() {
        const active = this.tasks.filter(t => !t.completed).length;
        return {
            total: this.tasks.length,
            active: active,
            completed: this.tasks.length - active
        };
    }
}

/**
 * UI Controller - Handles DOM manipulation and events
 */
class UIController {
    constructor(manager) {
        this.manager = manager;

        // DOM Elements
        this.form = document.getElementById('todo-form');
        this.input = document.getElementById('todo-input');
        this.list = document.getElementById('todo-list');
        this.statsLabel = document.getElementById('items-left');

        this.init();
    }

    init() {
        // Render initial tasks
        this.renderAll();

        // Event Listeners
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));

        // Delegation for list interactions
        this.list.addEventListener('click', (e) => this.handleListClick(e));
    }

    handleSubmit(e) {
        e.preventDefault();
        const text = this.input.value;
        const result = this.manager.addTask(text);

        if (result && !result.error) {
            this.input.value = '';
            this.input.classList.remove('input-error');
            this.renderAll();
        } else {
            // F6: Visual feedback for empty input
            this.input.classList.add('input-error');
            this.input.placeholder = result.error;
            setTimeout(() => {
                this.input.classList.remove('input-error');
                this.input.placeholder = "What needs to be done?";
            }, 2000);
        }
    }

    handleListClick(e) {
        const item = e.target.closest('.todo-item');
        if (!item) return;

        const id = item.dataset.id;

        // Check if delete button was clicked
        if (e.target.closest('.btn-delete')) {
            this.manager.deleteTask(id);
            this.animateRemoval(item);
        }
        // Or if checkbox/text was clicked (toggle)
        else {
            this.manager.toggleTask(id);
            this.renderAll();
        }
    }

    animateRemoval(element) {
        element.style.transform = 'translateX(20px)';
        element.style.opacity = '0';
        element.style.pointerEvents = 'none'; // Prevent further clicks during animation
        setTimeout(() => {
            this.renderAll();
        }, 300);
    }

    renderAll() {
        const tasks = this.manager.tasks;
        this.list.innerHTML = ''; // Clear current

        if (tasks.length === 0) {
            this.list.innerHTML = '<p class="subtitle" style="text-align: center; margin-top: 2rem;">No tasks yet. Add one above!</p>';
        } else {
            tasks.forEach(task => {
                const li = document.createElement('li');
                li.className = `todo-item ${task.completed ? 'completed' : ''}`;
                li.dataset.id = task.id;

                // Checkbox
                const checkbox = document.createElement('div');
                checkbox.className = 'todo-checkbox';
                const checkIcon = document.createElement('i');
                checkIcon.setAttribute('data-lucide', 'check');
                checkbox.appendChild(checkIcon);

                // Text
                const textSpan = document.createElement('span');
                textSpan.className = 'todo-text';
                textSpan.textContent = task.text;

                // Delete button
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'btn-delete';
                deleteBtn.setAttribute('aria-label', 'Delete task');
                const trashIcon = document.createElement('i');
                trashIcon.setAttribute('data-lucide', 'trash-2');
                deleteBtn.appendChild(trashIcon);

                li.appendChild(checkbox);
                li.appendChild(textSpan);
                li.appendChild(deleteBtn);

                // F4: Initialize icons only for the new element to save cycles
                if (window.lucide) {
                    lucide.createIcons({
                        attrs: { class: 'lucide' },
                        nameAttr: 'data-lucide',
                        root: li
                    });
                }

                this.list.appendChild(li);
            });
        }

        this.updateStats();
    }

    updateStats() {
        const stats = this.manager.getStats();
        this.statsLabel.textContent = `${stats.active} item${stats.active !== 1 ? 's' : ''} left`;
    }
}

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    const manager = new TodoManager();
    new UIController(manager);
});
